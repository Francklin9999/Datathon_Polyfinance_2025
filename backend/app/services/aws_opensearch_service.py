"""
AWS OpenSearch Service
Intelligent document search and indexing using Amazon OpenSearch
"""

import json
from typing import Dict, List, Optional
from datetime import datetime

from app.services.aws_config import AWSServices, is_aws_configured
import os

OPENSEARCH_ENDPOINT = os.getenv("OPENSEARCH_ENDPOINT", "")
OPENSEARCH_INDEX = os.getenv("OPENSEARCH_INDEX", "regulatory-documents")


class OpenSearchService:
    """Service for Amazon OpenSearch operations"""
    
    _client = None
    
    @staticmethod
    def get_client():
        """Get or create OpenSearch client"""
        if OpenSearchService._client is None:
            if not is_aws_configured() or not OPENSEARCH_ENDPOINT:
                return None
            
            OpenSearchService._client = AWSServices.get_opensearch_client()
        
        return OpenSearchService._client
    
    @staticmethod
    def index_document(
        document_id: str,
        document_text: str,
        metadata: Dict,
        document_type: str = "regulation"
    ) -> bool:
        """
        Index a document in OpenSearch
        Returns: True if successful
        """
        client = OpenSearchService.get_client()
        if not client:
            return False  # Silently fail if not configured
        
        try:
            document = {
                "document_id": document_id,
                "text": document_text[:100000],  # Limit text length
                "document_type": document_type,
                "title": metadata.get("title", ""),
                "regulation_name": metadata.get("regulation_name", ""),
                "regulation_type": metadata.get("regulation_type", ""),
                "jurisdiction": metadata.get("jurisdiction", ""),
                "effective_date": metadata.get("effective_date", ""),
                "entities": metadata.get("entities", {}),
                "indexed_at": datetime.now().isoformat(),
                **{k: v for k, v in metadata.items() if k not in ["entities", "title"]}
            }
            
            response = client.index(
                index=OPENSEARCH_INDEX,
                id=document_id,
                body=document
            )
            
            return response.get("result") in ["created", "updated"]
        except Exception as e:
            print(f"Error indexing document: {str(e)}")
            return False
    
    @staticmethod
    def search_documents(
        query: str,
        document_type: Optional[str] = None,
        jurisdiction: Optional[str] = None,
        size: int = 10
    ) -> List[Dict]:
        """
        Search documents in OpenSearch
        Returns: list of matching documents
        """
        client = OpenSearchService.get_client()
        if not client:
            return []
        
        try:
            # Build query
            search_query = {
                "query": {
                    "bool": {
                        "must": [
                            {
                                "multi_match": {
                                    "query": query,
                                    "fields": ["text^2", "title^3", "regulation_name^2"],
                                    "type": "best_fields",
                                    "fuzziness": "AUTO"
                                }
                            }
                        ],
                        "should": [
                            {"match": {"document_type": document_type}} if document_type else None,
                            {"match": {"jurisdiction": jurisdiction}} if jurisdiction else None
                        ]
                    }
                },
                "size": size,
                "_source": {
                    "includes": [
                        "document_id", "title", "regulation_name", "regulation_type",
                        "jurisdiction", "effective_date", "document_type", "indexed_at"
                    ]
                }
            }
            
            # Remove None values from should clause
            search_query["query"]["bool"]["should"] = [
                s for s in search_query["query"]["bool"]["should"] if s is not None
            ]
            
            if not search_query["query"]["bool"]["should"]:
                del search_query["query"]["bool"]["should"]
            
            response = client.search(
                index=OPENSEARCH_INDEX,
                body=search_query
            )
            
            hits = response.get("hits", {}).get("hits", [])
            results = []
            
            for hit in hits:
                source = hit.get("_source", {})
                results.append({
                    "document_id": source.get("document_id", ""),
                    "title": source.get("title", ""),
                    "regulation_name": source.get("regulation_name", ""),
                    "regulation_type": source.get("regulation_type", ""),
                    "jurisdiction": source.get("jurisdiction", ""),
                    "score": hit.get("_score", 0),
                    "snippet": source.get("text", "")[:500]  # First 500 chars
                })
            
            return results
        except Exception as e:
            print(f"Error searching documents: {str(e)}")
            return []
    
    @staticmethod
    def find_similar_documents(
        document_id: str,
        size: int = 5
    ) -> List[Dict]:
        """
        Find similar documents based on content
        Returns: list of similar documents
        """
        client = OpenSearchService.get_client()
        if not client:
            return []
        
        try:
            # Get the source document
            response = client.get(
                index=OPENSEARCH_INDEX,
                id=document_id
            )
            
            source = response.get("_source", {})
            document_text = source.get("text", "")
            
            # Search for similar documents
            similar_query = {
                "query": {
                    "more_like_this": {
                        "fields": ["text", "title", "regulation_name"],
                        "like": [
                            {
                                "_index": OPENSEARCH_INDEX,
                                "_id": document_id
                            }
                        ],
                        "min_term_freq": 1,
                        "min_doc_freq": 1,
                        "max_query_terms": 25
                    }
                },
                "size": size + 1  # +1 to exclude the original document
            }
            
            response = client.search(
                index=OPENSEARCH_INDEX,
                body=similar_query
            )
            
            hits = response.get("hits", {}).get("hits", [])
            results = []
            
            for hit in hits:
                if hit.get("_id") != document_id:  # Exclude original
                    source = hit.get("_source", {})
                    results.append({
                        "document_id": source.get("document_id", ""),
                        "title": source.get("title", ""),
                        "regulation_name": source.get("regulation_name", ""),
                        "regulation_type": source.get("regulation_type", ""),
                        "jurisdiction": source.get("jurisdiction", ""),
                        "similarity_score": hit.get("_score", 0)
                    })
            
            return results[:size]
        except Exception as e:
            print(f"Error finding similar documents: {str(e)}")
            return []
    
    @staticmethod
    def aggregate_by_field(
        field: str,
        document_type: Optional[str] = None
    ) -> Dict:
        """
        Aggregate documents by field (e.g., jurisdiction, regulation_type)
        Returns: aggregated results
        """
        client = OpenSearchService.get_client()
        if not client:
            return {}
        
        try:
            query = {
                "size": 0,
                "aggs": {
                    "by_field": {
                        "terms": {
                            "field": field,
                            "size": 50
                        }
                    }
                }
            }
            
            if document_type:
                query["query"] = {
                    "match": {
                        "document_type": document_type
                    }
                }
            
            response = client.search(
                index=OPENSEARCH_INDEX,
                body=query
            )
            
            buckets = response.get("aggregations", {}).get("by_field", {}).get("buckets", [])
            
            return {
                field: {
                    bucket.get("key", ""): bucket.get("doc_count", 0)
                    for bucket in buckets
                }
            }
        except Exception as e:
            print(f"Error aggregating by field: {str(e)}")
            return {}
    
    @staticmethod
    def delete_document(document_id: str) -> bool:
        """Delete a document from OpenSearch"""
        client = OpenSearchService.get_client()
        if not client:
            return False
        
        try:
            response = client.delete(
                index=OPENSEARCH_INDEX,
                id=document_id
            )
            return response.get("result") == "deleted"
        except Exception as e:
            print(f"Error deleting document: {str(e)}")
            return False
    
    @staticmethod
    def create_index_if_not_exists() -> bool:
        """Create OpenSearch index if it doesn't exist"""
        client = OpenSearchService.get_client()
        if not client:
            return False
        
        try:
            if not client.indices.exists(index=OPENSEARCH_INDEX):
                # Create index with mapping
                mapping = {
                    "mappings": {
                        "properties": {
                            "document_id": {"type": "keyword"},
                            "text": {"type": "text", "analyzer": "standard"},
                            "title": {"type": "text", "analyzer": "standard"},
                            "regulation_name": {"type": "text", "analyzer": "standard"},
                            "regulation_type": {"type": "keyword"},
                            "jurisdiction": {"type": "keyword"},
                            "effective_date": {"type": "date"},
                            "document_type": {"type": "keyword"},
                            "indexed_at": {"type": "date"},
                            "entities": {"type": "object", "enabled": False}
                        }
                    }
                }
                
                client.indices.create(
                    index=OPENSEARCH_INDEX,
                    body=mapping
                )
            
            return True
        except Exception as e:
            print(f"Error creating index: {str(e)}")
            return False

