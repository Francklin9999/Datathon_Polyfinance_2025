"""
Video Generation Service
Creates short videos using Amazon Bedrock Luma Ray2 model
"""

import json
import os
import uuid
import requests
from typing import Dict, Optional
from datetime import datetime

from app.services.aws_config import AWSServices, is_aws_configured, S3_BUCKET_NAME, AWS_REGION, AWS_BEARER_TOKEN_BEDROCK


class VideoGenerationService:
    """Service for generating videos using Amazon Bedrock Luma Ray2"""
    
    # Supported model
    LUMA_RAY2_MODEL_ID = "luma.ray-v2:0"
    
    # Default video settings
    DEFAULT_DURATION = "5s"  # 5 seconds
    DEFAULT_RESOLUTION = "540p"
    DEFAULT_ASPECT_RATIO = "16:9"
    
    # Supported options
    SUPPORTED_DURATIONS = ["5s", "10s"]
    SUPPORTED_RESOLUTIONS = ["540p", "720p", "1080p"]
    SUPPORTED_ASPECT_RATIOS = ["16:9", "9:16", "1:1"]
    
    # S3 prefix for video storage
    S3_VIDEO_PREFIX = "videos/"
    
    @staticmethod
    def generate_video(
        prompt: str,
        duration: str = DEFAULT_DURATION,
        resolution: str = DEFAULT_RESOLUTION,
        aspect_ratio: str = DEFAULT_ASPECT_RATIO,
        s3_output_prefix: Optional[str] = None
    ) -> Dict:
        """
        Generate a video using Amazon Bedrock Luma Ray2 model
        
        Args:
            prompt: Text description of the video to generate
            duration: Video duration (5s or 10s)
            resolution: Video resolution (540p, 720p, or 1080p)
            aspect_ratio: Aspect ratio (16:9, 9:16, or 1:1)
            s3_output_prefix: Optional S3 prefix for output (defaults to videos/)
        
        Returns:
            Dict with job_id, status, and metadata
        """
        if not is_aws_configured():
            return {
                "success": False,
                "error": "AWS credentials not configured",
                "job_id": None
            }
        
        # Validate parameters
        if duration not in VideoGenerationService.SUPPORTED_DURATIONS:
            raise ValueError(f"Duration must be one of {VideoGenerationService.SUPPORTED_DURATIONS}")
        if resolution not in VideoGenerationService.SUPPORTED_RESOLUTIONS:
            raise ValueError(f"Resolution must be one of {VideoGenerationService.SUPPORTED_RESOLUTIONS}")
        if aspect_ratio not in VideoGenerationService.SUPPORTED_ASPECT_RATIOS:
            raise ValueError(f"Aspect ratio must be one of {VideoGenerationService.SUPPORTED_ASPECT_RATIOS}")
        
        # Generate unique job ID
        job_id = str(uuid.uuid4())
        
        # Set up S3 output configuration
        if s3_output_prefix is None:
            s3_output_prefix = VideoGenerationService.S3_VIDEO_PREFIX
        
        # Ensure prefix ends with /
        if not s3_output_prefix.endswith('/'):
            s3_output_prefix += '/'
        
        s3_uri = f"s3://{S3_BUCKET_NAME}/{s3_output_prefix}{job_id}/"
        
        try:
            # Check for bearer token authentication
            bearer_token = AWSServices.get_bedrock_bearer_token() or AWS_BEARER_TOKEN_BEDROCK
            region = AWS_REGION or "us-east-1"
            
            # Prepare model input
            model_input = {
                "prompt": prompt,
                "duration": duration,
                "resolution": resolution,
                "aspect_ratio": aspect_ratio
            }
            
            # Prepare output data config
            output_data_config = {
                "s3OutputDataConfig": {
                    "s3Uri": s3_uri
                }
            }
            
            # Use HTTP request for async invocation (matches AWS CLI pattern)
            if bearer_token:
                # Use direct HTTP request with bearer token
                endpoint_url = f"https://bedrock-runtime.{region}.amazonaws.com/model/{VideoGenerationService.LUMA_RAY2_MODEL_ID}/invoke-async"
                
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {bearer_token}',
                    'Accept': 'application/json'
                }
                
                payload = {
                    "modelInput": json.dumps(model_input),
                    "outputDataConfig": output_data_config
                }
                
                http_response = requests.post(
                    endpoint_url,
                    headers=headers,
                    json=payload,
                    timeout=30
                )
                
                if http_response.status_code != 200:
                    error_msg = f"HTTP {http_response.status_code}"
                    try:
                        error_body = http_response.json()
                        error_msg += f": {json.dumps(error_body)}"
                    except:
                        error_text = http_response.text or http_response.content.decode('utf-8', errors='ignore')
                        error_msg += f": {error_text}"
                    raise Exception(error_msg)
                
                response_data = http_response.json()
                print(f"[VIDEO DEBUG] HTTP Response: {response_data}")  # Debug logging
                # Try multiple possible field names for invocation ID
                invocation_id = (
                    response_data.get('InvocationId') or 
                    response_data.get('invocationId') or 
                    response_data.get('invocation_id') or
                    response_data.get('jobId') or
                    response_data.get('job_id') or
                    response_data.get('id')
                )
            else:
                # Use boto3 client with AWS credentials
                bedrock_runtime = AWSServices.get_bedrock_runtime_client()
                
                # Try to use boto3's invoke_model_async if available
                # Note: boto3 might not have direct async invoke methods, so we'll use HTTP fallback
                # For now, using direct HTTP requests as the primary method
                try:
                    # Attempt to use boto3's invoke_model with async parameter
                    # This is a fallback approach
                    import boto3
                    from botocore.auth import SigV4Auth
                    from botocore.awsrequest import AWSRequest
                    
                    endpoint_url = f"https://bedrock-runtime.{region}.amazonaws.com/model/{VideoGenerationService.LUMA_RAY2_MODEL_ID}/invoke-async"
                    
                    session = boto3.Session()
                    credentials = session.get_credentials()
                    
                    payload = {
                        "modelInput": json.dumps(model_input),
                        "outputDataConfig": output_data_config
                    }
                    
                    request = AWSRequest(
                        method='POST',
                        url=endpoint_url,
                        data=json.dumps(payload),
                        headers={'Content-Type': 'application/json'}
                    )
                    
                    SigV4Auth(credentials, 'bedrock', region).add_auth(request)
                    
                    http_response = requests.post(
                        endpoint_url,
                        headers=dict(request.headers),
                        json=payload,
                        timeout=30
                    )
                    
                    if http_response.status_code != 200:
                        raise Exception(f"HTTP {http_response.status_code}: {http_response.text}")
                    
                    response_data = http_response.json()
                    print(f"[VIDEO DEBUG] HTTP Response (boto3): {response_data}")  # Debug logging
                    # Try multiple possible field names for invocation ID
                    invocation_id = (
                        response_data.get('InvocationId') or 
                        response_data.get('invocationId') or 
                        response_data.get('invocation_id') or
                        response_data.get('jobId') or
                        response_data.get('job_id') or
                        response_data.get('id')
                    )
                except Exception as boto3_error:
                    # Final fallback: raise the original error
                    raise Exception(f"Failed to invoke model: {str(boto3_error)}")
            
            # If we got an invocation_id, use it; otherwise use job_id for tracking
            tracking_id = invocation_id or job_id
            
            result = {
                "success": True,
                "job_id": job_id,
                "invocation_id": invocation_id,
                "status": "IN_PROGRESS",
                "prompt": prompt,
                "duration": duration,
                "resolution": resolution,
                "aspect_ratio": aspect_ratio,
                "s3_output_uri": s3_uri,
                "created_at": datetime.now().isoformat(),
                "estimated_time": "2-5 minutes",  # Let user know expected wait time
                "note": "Video generation is in progress. This typically takes 2-5 minutes."
            }
            
            if not invocation_id:
                print(f"[VIDEO WARNING] No invocation_id returned from API. Using job_id for tracking: {job_id}")
                result["tracking_id"] = job_id
                result["note"] += " Note: Using job_id for status tracking since invocation_id not available."
            
            return result
        except Exception as e:
            return {
                "success": False,
                "job_id": job_id,
                "error": str(e),
                "created_at": datetime.now().isoformat()
            }
    
    @staticmethod
    def get_video_job_status(invocation_id: str) -> Dict:
        """
        Get the status of a video generation job
        
        Args:
            invocation_id: The invocation ID from the start_async_invoke response
        
        Returns:
            Dict with job status, output location, etc.
        """
        if not is_aws_configured():
            return {
                "success": False,
                "error": "AWS credentials not configured"
            }
        
        try:
            bearer_token = AWSServices.get_bedrock_bearer_token() or AWS_BEARER_TOKEN_BEDROCK
            region = AWS_REGION or "us-east-1"
            
            # Use HTTP request to get async invocation status
            if bearer_token:
                endpoint_url = f"https://bedrock-runtime.{region}.amazonaws.com/model/{VideoGenerationService.LUMA_RAY2_MODEL_ID}/invoke-async/{invocation_id}"
                
                headers = {
                    'Authorization': f'Bearer {bearer_token}',
                    'Accept': 'application/json'
                }
                
                http_response = requests.get(endpoint_url, headers=headers, timeout=30)
                
                if http_response.status_code != 200:
                    error_msg = f"HTTP {http_response.status_code}: {http_response.text}"
                    raise Exception(error_msg)
                
                response = http_response.json()
            else:
                # Use boto3 client with AWS credentials
                bedrock_runtime = AWSServices.get_bedrock_runtime_client()
                
                # Use direct HTTP with SigV4 auth
                import boto3
                from botocore.auth import SigV4Auth
                from botocore.awsrequest import AWSRequest
                
                endpoint_url = f"https://bedrock-runtime.{region}.amazonaws.com/model/{VideoGenerationService.LUMA_RAY2_MODEL_ID}/invoke-async/{invocation_id}"
                
                session = boto3.Session()
                credentials = session.get_credentials()
                
                request = AWSRequest(
                    method='GET',
                    url=endpoint_url,
                    headers={'Accept': 'application/json'}
                )
                
                SigV4Auth(credentials, 'bedrock', region).add_auth(request)
                
                http_response = requests.get(endpoint_url, headers=dict(request.headers), timeout=30)
                
                if http_response.status_code != 200:
                    raise Exception(f"HTTP {http_response.status_code}: {http_response.text}")
                
                response = http_response.json()
            
            status = response.get('Status', response.get('status', 'UNKNOWN'))
            output_location = response.get('OutputLocation', response.get('outputLocation', {}))
            error = response.get('Error', response.get('error'))
            
            result = {
                "success": status in ['COMPLETED', 'IN_PROGRESS'],
                "status": status,
                "invocation_id": invocation_id
            }
            
            if output_location:
                result["output_location"] = output_location
                # Extract S3 URI if available
                if isinstance(output_location, dict):
                    s3_uri = output_location.get('s3Uri') or output_location.get('s3OutputLocation')
                    if s3_uri:
                        result["s3_uri"] = s3_uri
                        # Generate presigned URL for the video
                        try:
                            s3_client = AWSServices.get_s3_client()
                            # Parse S3 URI to get bucket and key
                            s3_uri_clean = s3_uri.replace('s3://', '')
                            parts = s3_uri_clean.split('/', 1)
                            if len(parts) == 2:
                                bucket = parts[0]
                                key = parts[1]
                                # Ensure key doesn't end with / (it should point to the file)
                                if key.endswith('/'):
                                    # List objects to find the actual video file
                                    objects = s3_client.list_objects_v2(Bucket=bucket, Prefix=key)
                                    if objects.get('Contents'):
                                        # Get the first file (the video)
                                        key = objects['Contents'][0]['Key']
                                
                                # Generate presigned URL
                                url = s3_client.generate_presigned_url(
                                    'get_object',
                                    Params={'Bucket': bucket, 'Key': key},
                                    ExpiresIn=3600  # 1 hour
                                )
                                result["video_url"] = url
                                result["s3_key"] = key
                        except Exception as s3_error:
                            result["s3_error"] = str(s3_error)
            
            if error:
                result["error"] = error
                result["success"] = False
            
            return result
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "invocation_id": invocation_id
            }
    
    @staticmethod
    def cancel_video_job(invocation_id: str) -> Dict:
        """
        Cancel a video generation job
        
        Args:
            invocation_id: The invocation ID to cancel
        
        Returns:
            Dict with cancellation status
        """
        if not is_aws_configured():
            return {
                "success": False,
                "error": "AWS credentials not configured"
            }
        
        try:
            bearer_token = AWSServices.get_bedrock_bearer_token() or AWS_BEARER_TOKEN_BEDROCK
            region = AWS_REGION or "us-east-1"
            
            # Use HTTP request to stop async invocation
            if bearer_token:
                endpoint_url = f"https://bedrock-runtime.{region}.amazonaws.com/model/{VideoGenerationService.LUMA_RAY2_MODEL_ID}/invoke-async/{invocation_id}/stop"
                
                headers = {
                    'Authorization': f'Bearer {bearer_token}',
                    'Accept': 'application/json'
                }
                
                http_response = requests.post(endpoint_url, headers=headers, timeout=30)
                
                if http_response.status_code != 200:
                    raise Exception(f"HTTP {http_response.status_code}: {http_response.text}")
                
                response = http_response.json()
            else:
                # Use boto3 client with AWS credentials
                bedrock_runtime = AWSServices.get_bedrock_runtime_client()
                
                # Use direct HTTP with SigV4 auth
                import boto3
                from botocore.auth import SigV4Auth
                from botocore.awsrequest import AWSRequest
                
                endpoint_url = f"https://bedrock-runtime.{region}.amazonaws.com/model/{VideoGenerationService.LUMA_RAY2_MODEL_ID}/invoke-async/{invocation_id}/stop"
                
                session = boto3.Session()
                credentials = session.get_credentials()
                
                request = AWSRequest(
                    method='POST',
                    url=endpoint_url,
                    headers={'Accept': 'application/json'}
                )
                
                SigV4Auth(credentials, 'bedrock', region).add_auth(request)
                
                http_response = requests.post(endpoint_url, headers=dict(request.headers), timeout=30)
                
                if http_response.status_code != 200:
                    raise Exception(f"HTTP {http_response.status_code}: {http_response.text}")
                
                response = http_response.json()
            
            return {
                "success": True,
                "invocation_id": invocation_id,
                "status": "CANCELLED"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "invocation_id": invocation_id
            }
    
    @staticmethod
    def list_video_jobs(prefix: Optional[str] = None, max_results: int = 50) -> Dict:
        """
        List generated videos in S3
        
        Args:
            prefix: Optional S3 prefix to filter (defaults to videos/)
            max_results: Maximum number of results
        
        Returns:
            Dict with list of videos
        """
        if not is_aws_configured():
            return {
                "success": False,
                "error": "AWS credentials not configured",
                "videos": []
            }
        
        if prefix is None:
            prefix = VideoGenerationService.S3_VIDEO_PREFIX
        
        try:
            s3_client = AWSServices.get_s3_client()
            
            response = s3_client.list_objects_v2(
                Bucket=S3_BUCKET_NAME,
                Prefix=prefix,
                MaxKeys=max_results
            )
            
            videos = []
            for obj in response.get('Contents', []):
                # Only include video files
                key = obj['Key']
                if key.lower().endswith(('.mp4', '.mov', '.avi', '.webm')):
                    try:
                        # Generate presigned URL
                        url = s3_client.generate_presigned_url(
                            'get_object',
                            Params={'Bucket': S3_BUCKET_NAME, 'Key': key},
                            ExpiresIn=3600
                        )
                        
                        videos.append({
                            "s3_key": key,
                            "size": obj['Size'],
                            "last_modified": obj['LastModified'].isoformat() if obj.get('LastModified') else None,
                            "url": url
                        })
                    except Exception:
                        pass
            
            return {
                "success": True,
                "videos": videos,
                "count": len(videos)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "videos": []
            }

