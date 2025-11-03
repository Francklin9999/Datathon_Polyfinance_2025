"""
AWS S3 Service
Handles document storage and retrieval using AWS S3
"""

import os
import uuid
from typing import Optional, BinaryIO
from datetime import datetime

from app.services.aws_config import AWSServices, S3_BUCKET_NAME, is_aws_configured


class S3Service:
    """Service for AWS S3 operations"""
    
    @staticmethod
    def upload_file(file_content: bytes, filename: str, prefix: str = "uploads/") -> dict:
        """
        Upload file to S3
        Returns: dict with file_id, s3_key, url
        """
        if not is_aws_configured():
            raise ValueError("AWS credentials not configured. Using local storage fallback.")
        
        s3_client = AWSServices.get_s3_client()
        
        # Generate unique file ID and S3 key
        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(filename)[1]
        s3_key = f"{prefix}{file_id}{file_ext}"
        
        try:
            # Upload to S3
            s3_client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=s3_key,
                Body=file_content,
                ContentType=_get_content_type(file_ext),
                Metadata={
                    "original_filename": filename,
                    "uploaded_at": datetime.now().isoformat(),
                    "file_id": file_id
                }
            )
            
            # Generate presigned URL (valid for 1 hour)
            url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': S3_BUCKET_NAME, 'Key': s3_key},
                ExpiresIn=3600
            )
            
            return {
                "file_id": file_id,
                "s3_key": s3_key,
                "s3_bucket": S3_BUCKET_NAME,
                "url": url,
                "filename": filename,
                "size": len(file_content),
                "uploaded_at": datetime.now().isoformat()
            }
        except Exception as e:
            raise ValueError(f"Error uploading to S3: {str(e)}")
    
    @staticmethod
    def download_file(s3_key: str) -> bytes:
        """Download file from S3"""
        if not is_aws_configured():
            raise ValueError("AWS credentials not configured")
        
        s3_client = AWSServices.get_s3_client()
        
        try:
            response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
            return response['Body'].read()
        except Exception as e:
            raise ValueError(f"Error downloading from S3: {str(e)}")
    
    @staticmethod
    def get_file_metadata(s3_key: str) -> dict:
        """Get file metadata from S3"""
        if not is_aws_configured():
            raise ValueError("AWS credentials not configured")
        
        s3_client = AWSServices.get_s3_client()
        
        try:
            response = s3_client.head_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
            return {
                "size": response.get('ContentLength', 0),
                "content_type": response.get('ContentType', ''),
                "last_modified": response.get('LastModified', '').isoformat() if response.get('LastModified') else None,
                "metadata": response.get('Metadata', {})
            }
        except Exception as e:
            raise ValueError(f"Error getting file metadata: {str(e)}")
    
    @staticmethod
    def delete_file(s3_key: str) -> bool:
        """Delete file from S3"""
        if not is_aws_configured():
            raise ValueError("AWS credentials not configured")
        
        s3_client = AWSServices.get_s3_client()
        
        try:
            s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
            return True
        except Exception as e:
            raise ValueError(f"Error deleting from S3: {str(e)}")
    
    @staticmethod
    def list_files(prefix: str = "uploads/", max_results: int = 100) -> list:
        """List files in S3 bucket with given prefix"""
        if not is_aws_configured():
            return []
        
        s3_client = AWSServices.get_s3_client()
        
        try:
            response = s3_client.list_objects_v2(
                Bucket=S3_BUCKET_NAME,
                Prefix=prefix,
                MaxKeys=max_results
            )
            
            files = []
            for obj in response.get('Contents', []):
                files.append({
                    "s3_key": obj['Key'],
                    "size": obj['Size'],
                    "last_modified": obj['LastModified'].isoformat() if obj.get('LastModified') else None
                })
            
            return files
        except Exception as e:
            raise ValueError(f"Error listing files: {str(e)}")


def _get_content_type(file_ext: str) -> str:
    """Get content type from file extension"""
    content_types = {
        '.pdf': 'application/pdf',
        '.html': 'text/html',
        '.xml': 'application/xml',
        '.txt': 'text/plain',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    }
    return content_types.get(file_ext.lower(), 'application/octet-stream')

