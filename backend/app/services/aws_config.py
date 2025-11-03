"""
AWS Services Configuration
Centralized configuration for AWS service clients
"""

import os
import boto3
from typing import Optional
from botocore.config import Config

# AWS Configuration
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_BEARER_TOKEN_BEDROCK = os.getenv("AWS_BEARER_TOKEN_BEDROCK")

# AWS Service Configuration
BOTO_CONFIG = Config(
    region_name=AWS_REGION,
    retries={
        'max_attempts': 3,
        'mode': 'standard'
    },
    connect_timeout=10,
    read_timeout=30
)


class AWSServices:
    """Centralized AWS service clients"""
    
    _s3_client = None
    _textract_client = None
    _comprehend_client = None
    _bedrock_client = None
    _bedrock_runtime_client = None
    _opensearch_client = None
    _transcribe_client = None
    _polly_client = None
    
    @classmethod
    def get_s3_client(cls):
        """Get or create S3 client"""
        if cls._s3_client is None:
            cls._s3_client = boto3.client(
                's3',
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=AWS_REGION,
                config=BOTO_CONFIG
            )
        return cls._s3_client
    
    @classmethod
    def get_textract_client(cls):
        """Get or create Textract client"""
        if cls._textract_client is None:
            cls._textract_client = boto3.client(
                'textract',
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=AWS_REGION,
                config=BOTO_CONFIG
            )
        return cls._textract_client
    
    @classmethod
    def get_comprehend_client(cls):
        """Get or create Comprehend client"""
        if cls._comprehend_client is None:
            cls._comprehend_client = boto3.client(
                'comprehend',
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=AWS_REGION,
                config=BOTO_CONFIG
            )
        return cls._comprehend_client
    
    @classmethod
    def get_bedrock_client(cls):
        """Get or create Bedrock client"""
        if cls._bedrock_client is None:
            cls._bedrock_client = boto3.client(
                'bedrock',
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=AWS_REGION,
                config=BOTO_CONFIG
            )
        return cls._bedrock_client
    
    @classmethod
    def get_bedrock_runtime_client(cls):
        """Get or create Bedrock Runtime client for inference"""
        if cls._bedrock_runtime_client is None:
            # Store bearer token if available (will be used in BedrockService.invoke_model)
            cls._bedrock_bearer_token = AWS_BEARER_TOKEN_BEDROCK
            
            # Create client (will use bearer token in BedrockService if available, otherwise use credentials)
            cls._bedrock_runtime_client = boto3.client(
                'bedrock-runtime',
                aws_access_key_id=AWS_ACCESS_KEY_ID if AWS_ACCESS_KEY_ID else None,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY if AWS_SECRET_ACCESS_KEY else None,
                region_name=AWS_REGION,
                config=BOTO_CONFIG
            )
        return cls._bedrock_runtime_client
    
    @classmethod
    def get_bedrock_bearer_token(cls):
        """Get Bedrock bearer token if available"""
        return getattr(cls, '_bedrock_bearer_token', None) or AWS_BEARER_TOKEN_BEDROCK
    
    @classmethod
    def get_opensearch_client(cls):
        """Get or create OpenSearch client"""
        if cls._opensearch_client is None:
            from opensearchpy import OpenSearch, RequestsHttpConnection
            from requests_aws4auth import AWS4Auth
            
            credentials = boto3.Session(
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=AWS_REGION
            ).get_credentials()
            
            awsauth = AWS4Auth(
                credentials.access_key,
                credentials.secret_key,
                AWS_REGION,
                'es',
                session_token=credentials.token
            )
            
            opensearch_host = os.getenv("OPENSEARCH_ENDPOINT", "")
            if opensearch_host:
                cls._opensearch_client = OpenSearch(
                    hosts=[{'host': opensearch_host.replace('https://', '').replace('http://', ''), 'port': 443}],
                    http_auth=awsauth,
                    use_ssl=True,
                    verify_certs=True,
                    connection_class=RequestsHttpConnection
                )
        return cls._opensearch_client
    
    @classmethod
    def get_transcribe_client(cls):
        """Get or create Transcribe client for speech-to-text"""
        if cls._transcribe_client is None:
            cls._transcribe_client = boto3.client(
                'transcribe',
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=AWS_REGION,
                config=BOTO_CONFIG
            )
        return cls._transcribe_client
    
    @classmethod
    def get_polly_client(cls):
        """Get or create Polly client for text-to-speech"""
        if cls._polly_client is None:
            cls._polly_client = boto3.client(
                'polly',
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=AWS_REGION,
                config=BOTO_CONFIG
            )
        return cls._polly_client


# S3 Bucket Configuration
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "intellirisk-regulatory-docs")
S3_UPLOADS_PREFIX = "uploads/"
S3_ANALYSIS_PREFIX = "analysis/"
S3_TENK_PREFIX = "10k-filings/"


def is_aws_configured() -> bool:
    """Check if AWS credentials are configured (either standard credentials or bearer token)"""
    return bool(
        (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY) or 
        AWS_BEARER_TOKEN_BEDROCK
    )


def get_aws_status() -> dict:
    """Get status of AWS services configuration"""
    return {
        "configured": is_aws_configured(),
        "region": AWS_REGION,
        "services": {
            "s3": {
                "configured": is_aws_configured(),
                "bucket": S3_BUCKET_NAME
            },
            "textract": {
                "configured": is_aws_configured()
            },
            "comprehend": {
                "configured": is_aws_configured()
            },
            "bedrock": {
                "configured": is_aws_configured()
            },
            "opensearch": {
                "configured": is_aws_configured() and bool(os.getenv("OPENSEARCH_ENDPOINT"))
            },
            "transcribe": {
                "configured": is_aws_configured()
            },
            "polly": {
                "configured": is_aws_configured()
            }
        }
    }

