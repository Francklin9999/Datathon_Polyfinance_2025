"""
Image Generation Router
Handles image generation using Amazon Bedrock Titan/Stable Diffusion
"""

from fastapi import APIRouter, HTTPException
from typing import Optional, Literal

from app.models.requests import VideoGenerationRequest  # Reuse existing request model or create new one
from app.services.image_generation_service import ImageGenerationService
from app.services.aws_config import is_aws_configured
from pydantic import BaseModel

router = APIRouter()


class ImageGenerationRequest(BaseModel):
    """Request model for image generation"""
    prompt: str  # Text description of the image to generate
    width: Optional[int] = 512  # Image width (512, 768, or 1024)
    height: Optional[int] = 512  # Image height (512, 768, or 1024)
    quality: Optional[Literal["standard", "premium"]] = "standard"  # Image quality
    model: Optional[str] = None  # "titan" or "stable-diffusion", None = auto-select


@router.post("/generate")
async def generate_image(request: ImageGenerationRequest):
    """
    Generate an image using Amazon Bedrock Titan Image Generator or Stable Diffusion
    
    Args:
        request: Image generation request with prompt and settings
    
    Returns:
        Dict with image_url, image_id, and metadata
    """
    try:
        result = ImageGenerationService.generate_image(
            prompt=request.prompt,
            width=request.width,
            height=request.height,
            quality=request.quality,
            model=request.model
        )
        
        if not result.get("success"):
            error_msg = result.get("error", "Unknown error")
            print(f"[IMAGE ROUTER] Image generation failed: {error_msg}")
            raise HTTPException(
                status_code=400 if "not configured" in error_msg else 500,
                detail=error_msg
            )
        
        return result
    except ValueError as e:
        print(f"[IMAGE ROUTER] ValueError: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = str(e).strip() if str(e).strip() else f"{type(e).__name__}: {repr(e)}"
        print(f"[IMAGE ROUTER] Unexpected error: {error_detail}")
        print(f"[IMAGE ROUTER] Exception type: {type(e).__name__}")
        print(f"[IMAGE ROUTER] Full traceback:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating image: {error_detail}")


@router.get("/supported-options")
async def get_supported_options():
    """
    Get supported image generation options
    
    Returns:
        Dict with supported sizes, qualities, and models
    """
    return {
        "sizes": ImageGenerationService.SUPPORTED_SIZES,
        "qualities": ImageGenerationService.SUPPORTED_QUALITIES,
        "models": ["titan", "stable-diffusion"],
        "defaults": {
            "width": ImageGenerationService.DEFAULT_WIDTH,
            "height": ImageGenerationService.DEFAULT_HEIGHT,
            "quality": ImageGenerationService.DEFAULT_QUALITY,
            "model": "titan"
        },
        "aws_configured": is_aws_configured()
    }

