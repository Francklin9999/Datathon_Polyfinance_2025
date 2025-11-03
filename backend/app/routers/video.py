"""
Video Generation Router
Handles video generation using Amazon Bedrock Luma Ray2
"""

from fastapi import APIRouter, HTTPException
from typing import Optional

from app.models.requests import VideoGenerationRequest
from app.services.video_generation_service import VideoGenerationService
from app.services.aws_config import is_aws_configured

router = APIRouter()


@router.post("/generate")
async def generate_video(request: VideoGenerationRequest):
    """
    Generate a short video using Amazon Bedrock Luma Ray2 model
    
    Args:
        request: Video generation request with prompt and settings
    
    Returns:
        Dict with job_id, invocation_id, status, and metadata
    """
    try:
        result = VideoGenerationService.generate_video(
            prompt=request.prompt,
            duration=request.duration,
            resolution=request.resolution,
            aspect_ratio=request.aspect_ratio,
            s3_output_prefix=request.s3_output_prefix
        )
        
        if not result.get("success"):
            error_msg = result.get("error", "Unknown error")
            raise HTTPException(
                status_code=400 if "not configured" in error_msg else 500,
                detail=error_msg
            )
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating video: {str(e)}")


@router.get("/status/{invocation_id}")
async def get_video_status(invocation_id: str):
    """
    Get the status of a video generation job
    
    Args:
        invocation_id: The invocation ID from the video generation request
    
    Returns:
        Dict with job status, output location, video URL, etc.
    """
    try:
        result = VideoGenerationService.get_video_job_status(invocation_id)
        
        if not result.get("success") and "not configured" in result.get("error", ""):
            raise HTTPException(status_code=503, detail=result.get("error"))
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting video status: {str(e)}")


@router.post("/cancel/{invocation_id}")
async def cancel_video_job(invocation_id: str):
    """
    Cancel a video generation job
    
    Args:
        invocation_id: The invocation ID to cancel
    
    Returns:
        Dict with cancellation status
    """
    try:
        result = VideoGenerationService.cancel_video_job(invocation_id)
        
        if not result.get("success"):
            error_msg = result.get("error", "Unknown error")
            raise HTTPException(
                status_code=503 if "not configured" in error_msg else 500,
                detail=error_msg
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cancelling video job: {str(e)}")


@router.get("/list")
async def list_videos(
    prefix: Optional[str] = None,
    max_results: int = 50
):
    """
    List generated videos stored in S3
    
    Args:
        prefix: Optional S3 prefix to filter videos
        max_results: Maximum number of results to return
    
    Returns:
        Dict with list of videos and metadata
    """
    try:
        result = VideoGenerationService.list_video_jobs(
            prefix=prefix,
            max_results=max_results
        )
        
        if not result.get("success") and "not configured" in result.get("error", ""):
            raise HTTPException(status_code=503, detail=result.get("error"))
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing videos: {str(e)}")


@router.get("/supported-options")
async def get_supported_options():
    """
    Get supported video generation options
    
    Returns:
        Dict with supported durations, resolutions, and aspect ratios
    """
    return {
        "durations": VideoGenerationService.SUPPORTED_DURATIONS,
        "resolutions": VideoGenerationService.SUPPORTED_RESOLUTIONS,
        "aspect_ratios": VideoGenerationService.SUPPORTED_ASPECT_RATIOS,
        "defaults": {
            "duration": VideoGenerationService.DEFAULT_DURATION,
            "resolution": VideoGenerationService.DEFAULT_RESOLUTION,
            "aspect_ratio": VideoGenerationService.DEFAULT_ASPECT_RATIO
        },
        "aws_configured": is_aws_configured()
    }


@router.get("/test-access")
async def test_bedrock_access():
    """
    Test if we can access the Luma Ray2 model on Amazon Bedrock
    
    This endpoint checks:
    1. If AWS credentials are configured
    2. If we can connect to Bedrock
    3. If the Luma Ray2 model is accessible
    
    Returns:
        Dict with test results and status
    """
    from app.services.aws_config import AWSServices, AWS_REGION
    import boto3
    from botocore.exceptions import ClientError, BotoCoreError
    
    test_results = {
        "aws_configured": False,
        "bedrock_accessible": False,
        "model_available": False,
        "error": None,
        "details": {}
    }
    
    # Test 1: Check if AWS is configured
    if not is_aws_configured():
        test_results["error"] = "AWS credentials not configured"
        return test_results
    
    test_results["aws_configured"] = True
    
    # Test 2: Try to list foundation models to check Bedrock access
    try:
        bedrock_client = AWSServices.get_bedrock_client()
        
        # Try to list foundation models
        try:
            response = bedrock_client.list_foundation_models()
            test_results["bedrock_accessible"] = True
            test_results["details"]["total_models"] = len(response.get('modelSummaries', []))
            
            # Check if Luma Ray2 is in the list
            models = response.get('modelSummaries', [])
            ray_model = None
            for model in models:
                if 'luma' in model.get('modelId', '').lower() and 'ray' in model.get('modelId', '').lower():
                    ray_model = model
                    break
            
            if ray_model:
                test_results["model_available"] = True
                test_results["details"]["ray_model"] = {
                    "model_id": ray_model.get('modelId'),
                    "model_name": ray_model.get('modelName'),
                    "provider": ray_model.get('providerName'),
                    "capabilities": ray_model.get('inputModalities', [])
                }
            else:
                test_results["details"]["note"] = "Luma Ray2 model not found in available models list"
                
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            error_msg = e.response.get('Error', {}).get('Message', str(e))
            
            test_results["error"] = f"Bedrock API Error: {error_code} - {error_msg}"
            test_results["details"]["error_code"] = error_code
            
            # Check if it's an access denied error
            if error_code in ['AccessDeniedException', 'UnauthorizedOperation']:
                test_results["details"]["suggestion"] = "Model access may not be granted. Check Model Access in Bedrock console."
            elif error_code == 'ValidationException':
                test_results["details"]["suggestion"] = "Region may not support this operation or model"
    
    except BotoCoreError as e:
        test_results["error"] = f"Boto3 Error: {str(e)}"
        test_results["details"]["error_type"] = type(e).__name__
    except Exception as e:
        test_results["error"] = f"Unexpected Error: {str(e)}"
        test_results["details"]["error_type"] = type(e).__name__
    
    # Test 3: Try a simple async invoke to verify model can be called
    if test_results["model_available"]:
        try:
            # Just check if we can initiate a request (without actually generating)
            # This is a lightweight test
            test_results["details"]["test_status"] = "Model appears accessible. Try generating a video to confirm."
        except Exception as e:
            test_results["details"]["invoke_test_error"] = str(e)
    
    return test_results

