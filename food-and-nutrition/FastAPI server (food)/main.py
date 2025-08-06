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
        api_key = NUTRITION_API_KEY
        # 1. Search for food item
        search_url = f"https://api.nal.usda.gov/fdc/v1/foods/search?query={clean_label}&api_key={api_key}"
        search_resp = requests.get(search_url, timeout=10)
        if search_resp.status_code == 401:
            logger.error("Invalid API key for USDA FoodData Central")
            return {"error": "Nutrition API authentication failed"}
        if search_resp.status_code == 429:
            logger.warning("Rate limit exceeded for USDA API")
            return {"error": "Rate limit exceeded. Please try again later"}
        if search_resp.status_code != 200:
            logger.warning(f"USDA API returned status {search_resp.status_code}")
            return {"error": f"Nutrition API error: {search_resp.status_code}"}
        search_data = search_resp.json()
        foods = search_data.get("foods", [])
        if not foods:
            # Fallback: try first word
            fallback_label = clean_label.split()[0] if len(clean_label.split()) > 1 else clean_label
            logger.info(f"Trying fallback nutrition lookup: {fallback_label}")
            fallback_url = f"https://api.nal.usda.gov/fdc/v1/foods/search?query={fallback_label}&api_key={api_key}"
            fallback_resp = requests.get(fallback_url, timeout=10)
            fallback_data = fallback_resp.json() if fallback_resp.status_code == 200 else None
            fallback_foods = fallback_data.get("foods", []) if fallback_data else []
            if fallback_foods:
                foods = fallback_foods
            else:
                logger.warning(f"USDA fallback also failed for: {fallback_label}")
                return {
                    "error": "No nutrition data found",
                    "searched_term": clean_label,
                    "suggestion": "Try taking a clearer photo, a different angle, or a more common food name."
                }
        # 2. Get nutrition info for the first food found
        food = foods[0]
        # Map USDA fields to expected output
        def get_nutrient(nutrients, name):
            for n in nutrients:
                if name.lower() in n.get("nutrientName", "").lower():
                    return n.get("value", 0)
            return 0
        nutrients = food.get("foodNutrients", [])
        return {
            "calories": get_nutrient(nutrients, "Energy"),
            "protein_g": get_nutrient(nutrients, "Protein"),
            "carbohydrates_total_g": get_nutrient(nutrients, "Carbohydrate"),
            "fat_total_g": get_nutrient(nutrients, "Total lipid"),
            "fiber_g": get_nutrient(nutrients, "Fiber"),
            "sugar_g": get_nutrient(nutrients, "Sugars"),
            "sodium_mg": get_nutrient(nutrients, "Sodium"),
            "food_name": food.get("description", "")
        }
    except requests.exceptions.Timeout:
        logger.error("Timeout when calling USDA API")
        return {"error": "Nutrition API timeout. Please try again"}
    except requests.exceptions.ConnectionError:
        logger.error("Connection error when calling USDA API")
        return {"error": "Cannot connect to nutrition API"}
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error when calling USDA API: {e}")
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

        # Validate image dimensions and resize if necessary
        max_dimension = 2000  # Reduced from 4000 for better performance
        if image.size[0] > max_dimension or image.size[1] > max_dimension:
            # Calculate new size maintaining aspect ratio
            ratio = min(max_dimension / image.size[0], max_dimension / image.size[1])
            new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
            logger.info(f"Resized image from {image.size} to {new_size}")
        
        if image.size[0] < 50 or image.size[1] < 50:
            return {"error": "Image too small. Minimum size: 50x50 pixels"}

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

@app.post("/test-upload")
async def test_upload(file: UploadFile = File(...)):
    """Test endpoint for file upload debugging"""
    logger.info(f"Test upload: filename={file.filename}, content_type={file.content_type}, size={file.size}")
    try:
        content = await file.read()
        return {
            "filename": file.filename,
            "content_type": file.content_type,
            "size": file.size,
            "bytes_read": len(content),
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Test upload failed: {e}")
        return {"error": str(e), "status": "failed"}

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    """Analyze uploaded food image and return nutrition information"""
    try:
        logger.info(f"Received file upload: filename={file.filename}, content_type={file.content_type}, size={file.size}")
        
        # Validate file
        validate_image(file)
        
        # Read image bytes
        try:
            image_bytes = await file.read()
            logger.info(f"Successfully read {len(image_bytes)} bytes from uploaded file")
        except Exception as e:
            logger.error(f"Failed to read uploaded file: {e}")
            raise HTTPException(status_code=400, detail="Failed to read uploaded file")
        
        if len(image_bytes) == 0:
            logger.error("Empty file uploaded")
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Process image and get results
        result = predict_food_and_nutrition(image_bytes)
        
        # Check for errors in result
        if "error" in result:
            logger.warning(f"Analysis error: {result['error']}")
            return JSONResponse(
                status_code=400,
                content=result
            )
        
        logger.info(f"Analysis successful: {result.get('predicted_food', 'unknown')}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in analyze endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)