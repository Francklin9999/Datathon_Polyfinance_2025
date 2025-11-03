"""
Image Generation Service
Creates images using Amazon Bedrock Titan Image Generator or Stable Diffusion
Much faster than video generation (seconds vs minutes)
"""

import json
import os
import uuid
import base64
import requests
from typing import Dict, Optional
from datetime import datetime

from app.services.aws_config import AWSServices, is_aws_configured, S3_BUCKET_NAME, AWS_REGION, AWS_BEARER_TOKEN_BEDROCK
from app.services.aws_s3_service import S3Service


class ImageGenerationService:
    """Service for generating images using Amazon Bedrock"""
    
    # Supported models - try Stable Diffusion first (more reliable), fallback to Titan
    TITAN_MODEL_ID = "amazon.titan-image-generator-v1"
    STABLE_DIFFUSION_XL_MODEL_ID = "stability.stable-diffusion-xl-v1:0"
    # Alternative Stable Diffusion models
    STABLE_IMAGE_ULTRA_MODEL_ID = "stability.stable-image-ultra-v1:0"
    STABLE_DIFFUSION_3_5_MODEL_ID = "stability.stable-diffusion-3-large-v1:0"
    
    # Default image settings
    DEFAULT_WIDTH = 512
    DEFAULT_HEIGHT = 512
    DEFAULT_QUALITY = "standard"  # "standard" or "premium"
    
    # Supported options
    SUPPORTED_SIZES = [(512, 512), (768, 768), (1024, 1024)]
    SUPPORTED_QUALITIES = ["standard", "premium"]
    
    # S3 prefix for image storage
    S3_IMAGE_PREFIX = "images/"
    
    @staticmethod
    def generate_image(
        prompt: str,
        width: int = DEFAULT_WIDTH,
        height: int = DEFAULT_HEIGHT,
        quality: str = DEFAULT_QUALITY,
        model: Optional[str] = None
    ) -> Dict:
        """
        Generate an image using Amazon Bedrock Titan Image Generator or Stable Diffusion
        
        Args:
            prompt: Text description of the image to generate
            width: Image width (512, 768, or 1024)
            height: Image height (512, 768, or 1024)
            quality: Image quality ("standard" or "premium")
            model: Model to use (None = auto-select, "titan" or "stable-diffusion")
        
        Returns:
            Dict with image_url, image_id, and metadata
        """
        if not is_aws_configured():
            return {
                "success": False,
                "error": "AWS credentials not configured",
                "image_url": None
            }
        
        # Validate parameters
        if (width, height) not in ImageGenerationService.SUPPORTED_SIZES:
            raise ValueError(f"Size must be one of {ImageGenerationService.SUPPORTED_SIZES}")
        if quality not in ImageGenerationService.SUPPORTED_QUALITIES:
            raise ValueError(f"Quality must be one of {ImageGenerationService.SUPPORTED_QUALITIES}")
        
        # Try multiple models in order if one fails
        models_to_try = []
        if model and model.lower() == "titan":
            models_to_try = [(ImageGenerationService.TITAN_MODEL_ID, True)]
        else:
            # Try Stable Diffusion models in order (most common first)
            models_to_try = [
                (ImageGenerationService.STABLE_DIFFUSION_XL_MODEL_ID, False),
                (ImageGenerationService.STABLE_IMAGE_ULTRA_MODEL_ID, False),
                (ImageGenerationService.STABLE_DIFFUSION_3_5_MODEL_ID, False),
                (ImageGenerationService.TITAN_MODEL_ID, True)  # Fallback to Titan
            ]
        
        bedrock_runtime = AWSServices.get_bedrock_runtime_client()
        bearer_token = AWSServices.get_bedrock_bearer_token() or AWS_BEARER_TOKEN_BEDROCK
        region = AWS_REGION or "us-east-1"
        
        last_error = None
        image_base64 = None
        used_model_id = None
        
        for model_id, is_titan in models_to_try:
            try:
                print(f"[IMAGE] Trying model: {model_id}")
                
                # Prepare request body based on model
                if is_titan:
                    # Titan Image Generator v1 format (correct format per AWS docs)
                    body = {
                        "taskType": "TEXT_IMAGE",
                        "textToImageParams": {
                            "text": prompt
                        },
                        "imageGenerationConfig": {
                            "numberOfImages": 1,
                            "quality": quality,
                            "height": height,
                            "width": width
                        }
                    }
                else:
                    # Stable Diffusion XL format
                    body = {
                        "text_prompts": [
                            {
                                "text": prompt,
                                "weight": 1.0
                            }
                        ],
                        "cfg_scale": 7,
                        "height": height,
                        "width": width,
                        "seed": 0,
                        "steps": 20  # Reduced steps for faster generation
                    }
                
                # Invoke model - try boto3 first (more reliable), fallback to HTTP
                try:
                    # Use boto3 client (preferred method)
                    response = bedrock_runtime.invoke_model(
                        modelId=model_id,
                        contentType="application/json",
                        accept="application/json",
                        body=json.dumps(body)
                    )
                    response_data = json.loads(response['body'].read())
                    print(f"[IMAGE DEBUG] Successfully invoked model via boto3: {model_id}")
                except Exception as boto3_error:
                    # Fallback to HTTP if boto3 fails
                    if bearer_token:
                        print(f"[IMAGE DEBUG] Boto3 failed, trying HTTP with bearer token: {str(boto3_error)}")
                        endpoint_url = f"https://bedrock-runtime.{region}.amazonaws.com/model/{model_id}/invoke"
                        
                        headers = {
                            'Content-Type': 'application/json',
                            'Authorization': f'Bearer {bearer_token}',
                            'Accept': 'application/json'
                        }
                        
                        http_response = requests.post(
                            endpoint_url,
                            headers=headers,
                            json=body,
                            timeout=60  # Image generation can take up to 60 seconds
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
                        print(f"[IMAGE DEBUG] Successfully invoked model via HTTP: {model_id}")
                    else:
                        # No bearer token and boto3 failed - try next model
                        raise Exception(f"Failed to invoke model via boto3: {str(boto3_error)}")
                
                # Extract image data based on model
                if is_titan:
                    # Titan returns images as base64 strings in an array
                    # Response format: {"images": [{"image": "base64..."}]}
                    if 'images' in response_data and len(response_data['images']) > 0:
                        image_obj = response_data['images'][0]
                        # Titan might return {"image": "base64..."} or just "base64..." string
                        if isinstance(image_obj, dict) and 'image' in image_obj:
                            image_base64 = image_obj['image']
                        elif isinstance(image_obj, str):
                            image_base64 = image_obj
                        else:
                            raise Exception("Unexpected Titan response format")
                    else:
                        raise Exception("No image returned from Titan model")
                else:
                    # Stable Diffusion returns artifacts with base64 image
                    if 'artifacts' in response_data and len(response_data['artifacts']) > 0:
                        image_base64 = response_data['artifacts'][0].get('base64')
                        if not image_base64:
                            raise Exception("No image data in Stable Diffusion response")
                    else:
                        raise Exception("No artifacts returned from Stable Diffusion model")
                
                # If we got here, we successfully generated an image
                used_model_id = model_id
                print(f"[IMAGE] Successfully generated image using {model_id}")
                break
                
            except Exception as model_error:
                print(f"[IMAGE] Model {model_id} failed: {str(model_error)}")
                last_error = model_error
                # Try next model
                continue
        
        # If we got here without breaking, all models failed
        if not image_base64:
            error_msg = "All image generation models failed."
            if last_error:
                error_msg += f" Last error: {str(last_error)}"
            return {
                "success": False,
                "error": error_msg,
                "image_url": None
            }
        
        # Generate unique ID for this image
        image_id = str(uuid.uuid4())
        
        # Save to S3 and get URL
        try:
            # Decode base64 to bytes
            image_bytes = base64.b64decode(image_base64)
            
            # Upload to S3
            s3_result = S3Service.upload_file(
                file_content=image_bytes,
                filename=f"{image_id}.png",
                prefix=ImageGenerationService.S3_IMAGE_PREFIX
            )
            
            image_url = s3_result.get("url")
            s3_key = s3_result.get("s3_key")
        except Exception as s3_error:
            print(f"[IMAGE] Warning: Could not upload to S3: {s3_error}")
            # Fallback: return base64 data URL
            image_url = f"data:image/png;base64,{image_base64}"
            s3_key = None
        
        return {
            "success": True,
            "image_id": image_id,
            "image_url": image_url,
            "s3_key": s3_key,
            "model": used_model_id,
            "prompt": prompt,
            "width": width,
            "height": height,
            "quality": quality,
            "created_at": datetime.now().isoformat()
        }
