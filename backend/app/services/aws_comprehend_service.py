"""
AWS Comprehend Service
NLP and entity extraction using AWS Comprehend
"""

from typing import Dict, List, Optional

from app.services.aws_config import AWSServices, is_aws_configured


class ComprehendService:
    """Service for AWS Comprehend operations"""
    
    @staticmethod
    def extract_entities(text: str, language_code: str = "en") -> Dict:
        """
        Extract entities (organizations, locations, dates, etc.) from text
        Returns: dict with entities categorized by type
        """
        if not is_aws_configured():
            # Fallback to basic extraction
            return _fallback_entity_extraction(text)
        
        comprehend_client = AWSServices.get_comprehend_client()
        
        try:
            # AWS Comprehend has a 5000 byte limit per request
            # Split large documents into chunks
            max_chunk_size = 4500  # Leave some margin
            
            if len(text.encode('utf-8')) <= max_chunk_size:
                # Single request
                response = comprehend_client.detect_entities(
                    Text=text,
                    LanguageCode=language_code
                )
                entities = response.get('Entities', [])
            else:
                # Split into chunks
                chunks = _split_text_into_chunks(text, max_chunk_size)
                all_entities = []
                
                for chunk in chunks:
                    try:
                        response = comprehend_client.detect_entities(
                            Text=chunk,
                            LanguageCode=language_code
                        )
                        all_entities.extend(response.get('Entities', []))
                    except Exception:
                        continue
                
                entities = all_entities
            
            # Organize entities by type
            organized = {
                "organizations": [],
                "locations": [],
                "persons": [],
                "dates": [],
                "quantities": [],
                "commercial_items": [],
                "events": [],
                "other": []
            }
            
            for entity in entities:
                entity_type = entity.get('Type', '').lower()
                entity_text = entity.get('Text', '')
                confidence = entity.get('Score', 0)
                
                entity_obj = {
                    "text": entity_text,
                    "confidence": confidence,
                    "type": entity_type
                }
                
                if entity_type == 'organization':
                    organized["organizations"].append(entity_obj)
                elif entity_type == 'location':
                    organized["locations"].append(entity_obj)
                elif entity_type == 'person':
                    organized["persons"].append(entity_obj)
                elif entity_type in ['date', 'time']:
                    organized["dates"].append(entity_obj)
                elif entity_type in ['quantity', 'number']:
                    organized["quantities"].append(entity_obj)
                elif entity_type == 'commercial_item':
                    organized["commercial_items"].append(entity_obj)
                elif entity_type == 'event':
                    organized["events"].append(entity_obj)
                else:
                    organized["other"].append(entity_obj)
            
            # Extract key phrases
            key_phrases = ComprehendService.extract_key_phrases(text, language_code)
            
            return {
                "entities": organized,
                "key_phrases": key_phrases,
                "method": "aws_comprehend",
                "total_entities": len(entities)
            }
        except Exception as e:
            # Fallback on error
            return _fallback_entity_extraction(text)
    
    @staticmethod
    def extract_key_phrases(text: str, language_code: str = "en") -> List[Dict]:
        """Extract key phrases from text"""
        if not is_aws_configured():
            return []
        
        comprehend_client = AWSServices.get_comprehend_client()
        
        try:
            max_chunk_size = 4500
            if len(text.encode('utf-8')) <= max_chunk_size:
                response = comprehend_client.detect_key_phrases(
                    Text=text,
                    LanguageCode=language_code
                )
                phrases = response.get('KeyPhrases', [])
            else:
                chunks = _split_text_into_chunks(text, max_chunk_size)
                all_phrases = []
                
                for chunk in chunks:
                    try:
                        response = comprehend_client.detect_key_phrases(
                            Text=chunk,
                            LanguageCode=language_code
                        )
                        all_phrases.extend(response.get('KeyPhrases', []))
                    except Exception:
                        continue
                
                phrases = all_phrases
            
            return [
                {
                    "text": phrase.get('Text', ''),
                    "confidence": phrase.get('Score', 0)
                }
                for phrase in phrases
            ]
        except Exception as e:
            return []
    
    @staticmethod
    def detect_sentiment(text: str, language_code: str = "en") -> Dict:
        """Detect sentiment from text"""
        if not is_aws_configured():
            return {"sentiment": "NEUTRAL", "confidence": 0.5}
        
        comprehend_client = AWSServices.get_comprehend_client()
        
        try:
            max_chunk_size = 4500
            if len(text.encode('utf-8')) <= max_chunk_size:
                response = comprehend_client.detect_sentiment(
                    Text=text,
                    LanguageCode=language_code
                )
                return {
                    "sentiment": response.get('Sentiment', 'NEUTRAL'),
                    "confidence": response.get('SentimentScore', {}).get(response.get('Sentiment', 'NEUTRAL'), 0),
                    "scores": response.get('SentimentScore', {}),
                    "method": "aws_comprehend"
                }
            else:
                # For longer texts, analyze chunks and aggregate
                chunks = _split_text_into_chunks(text, max_chunk_size)
                sentiments = []
                
                for chunk in chunks:
                    try:
                        response = comprehend_client.detect_sentiment(
                            Text=chunk,
                            LanguageCode=language_code
                        )
                        sentiments.append(response.get('Sentiment', 'NEUTRAL'))
                    except Exception:
                        continue
                
                # Aggregate sentiments
                if sentiments:
                    from collections import Counter
                    most_common = Counter(sentiments).most_common(1)[0]
                    return {
                        "sentiment": most_common[0],
                        "confidence": most_common[1] / len(sentiments),
                        "method": "aws_comprehend_aggregated"
                    }
                else:
                    return {"sentiment": "NEUTRAL", "confidence": 0.5}
        except Exception as e:
            return {"sentiment": "NEUTRAL", "confidence": 0.5}
    
    @staticmethod
    def detect_language(text: str) -> Dict:
        """Detect language of text"""
        if not is_aws_configured():
            return {"language": "en", "confidence": 0.5}
        
        comprehend_client = AWSServices.get_comprehend_client()
        
        try:
            # Take first 5000 bytes
            sample = text[:5000]
            response = comprehend_client.detect_dominant_language(Text=sample)
            
            languages = response.get('Languages', [])
            if languages:
                top_language = languages[0]
                return {
                    "language": top_language.get('LanguageCode', 'en'),
                    "confidence": top_language.get('Score', 0),
                    "method": "aws_comprehend"
                }
            return {"language": "en", "confidence": 0.5}
        except Exception as e:
            return {"language": "en", "confidence": 0.5}


def _split_text_into_chunks(text: str, max_bytes: int) -> List[str]:
    """Split text into chunks that don't exceed max_bytes"""
    chunks = []
    current_chunk = ""
    
    # Split by sentences first
    sentences = text.split('. ')
    
    for sentence in sentences:
        sentence_bytes = len((current_chunk + sentence).encode('utf-8'))
        
        if sentence_bytes <= max_bytes:
            current_chunk += sentence + '. '
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + '. '
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks


def _fallback_entity_extraction(text: str) -> Dict:
    """Fallback entity extraction using basic regex"""
    import re
    
    entities = {
        "organizations": [],
        "locations": [],
        "persons": [],
        "dates": [],
        "quantities": [],
        "commercial_items": [],
        "events": [],
        "other": []
    }
    
    # Extract dates
    date_pattern = r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2}'
    dates = re.findall(date_pattern, text)
    entities["dates"] = [{"text": d, "confidence": 0.5, "type": "date"} for d in dates[:10]]
    
    # Extract percentages
    pct_pattern = r'\d+(?:\.\d+)?\s*%'
    percentages = re.findall(pct_pattern, text)
    entities["quantities"] = [{"text": p, "confidence": 0.5, "type": "percentage"} for p in percentages[:10]]
    
    return {
        "entities": entities,
        "key_phrases": [],
        "method": "fallback",
        "total_entities": len(dates) + len(percentages)
    }

