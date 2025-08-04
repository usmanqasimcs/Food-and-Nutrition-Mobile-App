from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from transformers import ViTImageProcessor, ViTForImageClassification
from PIL import Image, UnidentifiedImageError
import torch
import requests
import io
import os
import logging
from dotenv import load_dotenv
from typing import Dict, Any, Optional
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Food and Nutrition API",
    description="API for food image classification and nutrition analysis",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and processor
model: Optional[ViTForImageClassification] = None
processor: Optional[ViTImageProcessor] = None

# API configuration
NUTRITION_API_KEY = os.getenv("NUTRITION_API_KEY")
if not NUTRITION_API_KEY:
    logger.error("NUTRITION_API_KEY not found in environment variables")
    raise ValueError("NUTRITION_API_KEY must be set in environment variables")

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
SUPPORTED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}

class ModelManager:
    """Singleton class to manage model loading and inference"""
    _instance = None
    _model = None
    _processor = None
    _is_loaded = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
        return cls._instance

    def load_model(self):
        """Load model and processor if not already loaded"""
        if not self._is_loaded:
            try:
                logger.info("Loading ViT model and processor...")
                self._model = ViTForImageClassification.from_pretrained("nateraw/vit-base-food101")
                self._processor = ViTImageProcessor.from_pretrained("nateraw/vit-base-food101")
                self._is_loaded = True
                logger.info("Model and processor loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
                raise HTTPException(status_code=500, detail="Failed to load AI model")

    @property
    def model(self):
        if not self._is_loaded:
            self.load_model()
        return self._model

    @property
    def processor(self):
        if not self._is_loaded:
            self.load_model()
        return self._processor

# Initialize model manager
model_manager = ModelManager()

def validate_image(file: UploadFile) -> None:
    """Validate uploaded image file"""
    if file.content_type not in SUPPORTED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported image type. Supported types: {', '.join(SUPPORTED_IMAGE_TYPES)}"
        )
    
    if file.size and file.size > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"Image too large. Maximum size: {MAX_IMAGE_SIZE / (1024*1024):.1f}MB"
        )

def get_nutrition_data(food_label: str) -> Dict[str, Any]:
    """Fetch nutrition data from CalorieNinjas API with error handling"""
    try:
        # Clean the food label for better API results
        clean_label = food_label.replace("_", " ").strip()
        
        response = requests.get(
            f"https://api.calorieninjas.com/v1/nutrition?query={clean_label}",
            headers={"X-Api-Key": NUTRITION_API_KEY},
            timeout=10  # Add timeout
        )
        
        if response.status_code == 401:
            logger.error("Invalid API key for CalorieNinjas")
            return {"error": "Nutrition API authentication failed"}
        
        if response.status_code == 429:
            logger.warning("Rate limit exceeded for CalorieNinjas API")
            return {"error": "Rate limit exceeded. Please try again later"}
        
        if response.status_code != 200:
            logger.warning(f"CalorieNinjas API returned status {response.status_code}")
            return {"error": f"Nutrition API error: {response.status_code}"}
        
        nutrition_data = response.json()
        
        if not nutrition_data.get("items"):
            logger.info(f"No nutrition data found for: {clean_label}")
            return {
                "error": "No nutrition data found",
                "searched_term": clean_label,
                "suggestion": "Try taking a clearer photo or a different angle"
            }
        
        return nutrition_data["items"][0]
        
    except requests.exceptions.Timeout:
        logger.error("Timeout when calling CalorieNinjas API")
        return {"error": "Nutrition API timeout. Please try again"}
    except requests.exceptions.ConnectionError:
        logger.error("Connection error when calling CalorieNinjas API")
        return {"error": "Cannot connect to nutrition API"}
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error when calling CalorieNinjas API: {e}")
        return {"error": "Nutrition API request failed"}
    except Exception as e:
        logger.error(f"Unexpected error in nutrition API call: {e}")
        return {"error": "Unexpected error occurred"}

def predict_food_and_nutrition(image_bytes: bytes) -> Dict[str, Any]:
    """Predict food and get nutrition information with comprehensive error handling"""
    try:
        # Ensure model is loaded
        model_manager.load_model()  # Always call load_model to ensure model and processor are loaded
            
        # Load and validate image
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except UnidentifiedImageError:
            return {"error": "Invalid image format or corrupted image"}
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            return {"error": "Failed to process image"}

        # Validate image dimensions
        if image.size[0] < 50 or image.size[1] < 50:
            return {"error": "Image too small. Minimum size: 50x50 pixels"}
        
        if image.size[0] > 4000 or image.size[1] > 4000:
            return {"error": "Image too large. Maximum size: 4000x4000 pixels"}

        # Process image and make prediction
        try:
            start_time = time.time()
            inputs = model_manager.processor(images=image, return_tensors="pt") # type: ignore
            
            with torch.no_grad():
                logits = model_manager.model(**inputs).logits # type: ignore
                predicted_idx = logits.argmax(-1).item()
                confidence = torch.softmax(logits, dim=-1).max().item()
                label = model_manager.model.config.id2label[predicted_idx] # type: ignore
            
            inference_time = time.time() - start_time
            logger.info(f"Food prediction: {label} (confidence: {confidence:.3f}, time: {inference_time:.3f}s)")
            
            # Check confidence threshold
            if confidence < 0.3:
                return {
                    "predicted_food": label.replace("_", " "),
                    "confidence": round(confidence, 3),
                    "warning": "Low confidence prediction. Consider taking a clearer photo",
                    "nutrition": {"error": "Skipped nutrition lookup due to low confidence"}
                }
            
        except Exception as e:
            logger.error(f"Model inference error: {e}")
            return {"error": "Failed to analyze image with AI model"}

        # Get nutrition data
        nutrition_info = get_nutrition_data(label)
        
        return {
            "predicted_food": label.replace("_", " "),
            "confidence": round(confidence, 3),
            "nutrition": nutrition_info,
            "inference_time": round(inference_time, 3)
        }
        
    except Exception as e:
        logger.error(f"Unexpected error in prediction: {e}")
        return {"error": "An unexpected error occurred during analysis"}

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    logger.info("Starting Food and Nutrition API...")
    model_manager.load_model()
    logger.info("API ready to serve requests")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Food and Nutrition API is running",
        "status": "healthy",
        "model_loaded": model_manager._is_loaded
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_loaded": model_manager._is_loaded,
        "api_key_configured": bool(NUTRITION_API_KEY)
    }

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    """Analyze uploaded food image and return nutrition information"""
    try:
        # Validate file
        validate_image(file)
        
        # Read image bytes
        try:
            image_bytes = await file.read()
        except Exception as e:
            logger.error(f"Failed to read uploaded file: {e}")
            raise HTTPException(status_code=400, detail="Failed to read uploaded file")
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Process image and get results
        result = predict_food_and_nutrition(image_bytes)
        
        # Check for errors in result
        if "error" in result:
            return JSONResponse(
                status_code=400,
                content=result
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in analyze endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)