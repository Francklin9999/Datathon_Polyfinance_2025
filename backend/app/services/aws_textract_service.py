"""
AWS Textract Service
Advanced document text extraction using AWS Textract
"""

import base64
from typing import Optional, Dict, List

from app.services.aws_config import AWSServices, is_aws_configured


class TextractService:
    """Service for AWS Textract operations"""
    
    @staticmethod
    def extract_text_from_document(file_content: bytes, file_format: str = "pdf") -> Dict:
        """
        Extract text from document using AWS Textract
        Returns: dict with text, structure, and metadata
        """
        if not is_aws_configured():
            # Fallback to basic extraction
            return {
                "text": file_content.decode('utf-8', errors='ignore')[:10000],
                "method": "fallback",
                "confidence": 0.5
            }
        
        textract_client = AWSServices.get_textract_client()
        
        try:
            # Textract supports PDF and images
            if file_format.lower() not in ['pdf', 'png', 'jpg', 'jpeg']:
                # Fallback for unsupported formats
                return {
                    "text": file_content.decode('utf-8', errors='ignore'),
                    "method": "fallback",
                    "confidence": 0.5
                }
            
            # Call Textract
            if file_format.lower() == 'pdf':
                response = textract_client.detect_document_text(
                    Document={
                        'Bytes': file_content
                    }
                )
            else:
                # For images
                response = textract_client.detect_document_text(
                    Document={
                        'Bytes': file_content
                    }
                )
            
            # Extract text blocks
            text_blocks = []
            blocks = response.get('Blocks', [])
            
            for block in blocks:
                if block['BlockType'] == 'LINE':
                    text_blocks.append(block.get('Text', ''))
            
            full_text = '\n'.join(text_blocks)
            
            # Extract structure (tables, forms, etc.)
            structure = {
                "pages": len([b for b in blocks if b['BlockType'] == 'PAGE']),
                "lines": len([b for b in blocks if b['BlockType'] == 'LINE']),
                "words": len([b for b in blocks if b['BlockType'] == 'WORD']),
                "tables": len([b for b in blocks if b['BlockType'] == 'TABLE']),
                "forms": len([b for b in blocks if b['BlockType'] == 'KEY_VALUE_SET'])
            }
            
            # Calculate average confidence
            confidences = [
                block.get('Confidence', 0)
                for block in blocks
                if 'Confidence' in block
            ]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.9
            
            return {
                "text": full_text,
                "method": "aws_textract",
                "confidence": avg_confidence / 100.0,
                "structure": structure,
                "blocks": blocks[:50]  # Limit to first 50 blocks for performance
            }
        except Exception as e:
            # Fallback on error
            return {
                "text": file_content.decode('utf-8', errors='ignore'),
                "method": "fallback",
                "confidence": 0.5,
                "error": str(e)
            }
    
    @staticmethod
    def extract_tables_from_document(file_content: bytes, file_format: str = "pdf") -> List[Dict]:
        """
        Extract tables from document using AWS Textract
        Returns: list of tables with structured data
        """
        if not is_aws_configured():
            return []
        
        textract_client = AWSServices.get_textract_client()
        
        try:
            if file_format.lower() != 'pdf':
                return []
            
            # Use analyze_document for table extraction
            response = textract_client.analyze_document(
                Document={
                    'Bytes': file_content
                },
                FeatureTypes=['TABLES']
            )
            
            blocks = response.get('Blocks', [])
            tables = []
            
            # Extract table blocks
            for block in blocks:
                if block['BlockType'] == 'TABLE':
                    tables.append({
                        "id": block.get('Id', ''),
                        "confidence": block.get('Confidence', 0) / 100.0,
                        "geometry": block.get('Geometry', {})
                    })
            
            return tables
        except Exception as e:
            return []

