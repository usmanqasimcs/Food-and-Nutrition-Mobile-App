import os
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from transformers import ViTImageProcessor, ViTForImageClassification
from PIL import Image, UnidentifiedImageError
import torch
import requests
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class FoodClassifier:
    """Efficient food classifier with model caching and error handling"""
    
    def __init__(self):
        self.model: Optional[ViTForImageClassification] = None
        self.processor: Optional[ViTImageProcessor] = None
        self.is_loaded = False
        self.api_key = os.getenv("USDA_API_KEY")
        
        if not self.api_key:
            logger.error("USDA_API_KEY not found in environment variables")
            raise ValueError("USDA_API_KEY must be set in .env file")
    
    def load_model(self) -> None:
        """Load model and processor if not already loaded"""
        if not self.is_loaded:
            try:
                logger.info("Loading ViT model and processor...")
                start_time = time.time()
                
                self.model = ViTForImageClassification.from_pretrained("nateraw/vit-base-food101")
                self.processor = ViTImageProcessor.from_pretrained("nateraw/vit-base-food101")
                
                load_time = time.time() - start_time
                self.is_loaded = True
                logger.info(f"Model loaded successfully in {load_time:.2f} seconds")
                
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
                raise RuntimeError(f"Model loading failed: {e}")
    
    def validate_image_path(self, image_path: str) -> None:
        """Validate image file path and accessibility"""
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found: {image_path}")
        
        if not os.path.isfile(image_path):
            raise ValueError(f"Path is not a file: {image_path}")
        
        # Check file size
        file_size = os.path.getsize(image_path)
        if file_size == 0:
            raise ValueError("Image file is empty")
        
        if file_size > 10 * 1024 * 1024:  # 10MB limit
            raise ValueError(f"Image file too large: {file_size / (1024*1024):.1f}MB (max 10MB)")
        
        # Check file extension
        valid_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
        file_ext = os.path.splitext(image_path)[1].lower()
        if file_ext not in valid_extensions:
            raise ValueError(f"Unsupported image format: {file_ext}. Supported: {valid_extensions}")
    
    def get_nutrition_usda(self, food_name: str) -> Dict[str, Any]:
        """Fetch nutrition data from USDA API with comprehensive error handling"""
        try:
            # Clean the food name for better API results
            clean_name = food_name.replace("_", " ").strip()
            
            url = "https://api.nal.usda.gov/fdc/v1/foods/search"
            params = {
                "query": clean_name,
                "api_key": self.api_key,
                "pageSize": 1,
                "dataType": ["Foundation", "SR Legacy"]  # Focus on more reliable data
            }
            
            logger.info(f"Searching USDA database for: {clean_name}")
            response = requests.get(url, params=params, timeout=15)
            
            if response.status_code == 403:
                logger.error("Invalid API key for USDA")
                return {"error": "USDA API authentication failed - check API key"}
            
            if response.status_code == 429:
                logger.warning("Rate limit exceeded for USDA API")
                return {"error": "USDA API rate limit exceeded. Please try again later"}
            
            if response.status_code != 200:
                logger.warning(f"USDA API returned status {response.status_code}")
                return {"error": f"USDA API error: {response.status_code}"}
            
            data = response.json()
            
            if not data.get("foods"):
                logger.info(f"No nutrition data found in USDA database for: {clean_name}")
                return {
                    "error": "No nutrition data found in USDA database",
                    "searched_term": clean_name,
                    "suggestion": "Try a more generic food name or check spelling"
                }
            
            food = data["foods"][0]
            food_nutrients = food.get('foodNutrients', [])
            
            # Create a more robust nutrient mapping
            nutrient_map = {
                'Energy': ['Energy', 'Calories'],
                'Protein': ['Protein'],
                'Total lipid (fat)': ['Total lipid (fat)', 'Fat, total'],
                'Carbohydrate, by difference': ['Carbohydrate, by difference', 'Carbohydrates'],
                'Fiber, total dietary': ['Fiber, total dietary', 'Dietary fiber'],
                'Sugars, total including NLEA': ['Sugars, total including NLEA', 'Sugars'],
                'Sodium, Na': ['Sodium, Na', 'Sodium']
            }
            
            nutrients = {}
            for nutrient in food_nutrients:
                nutrient_name = nutrient.get('nutrientName', '')
                nutrient_value = nutrient.get('value', 0)
                nutrient_unit = nutrient.get('unitName', '')
                
                # Map nutrients to standardized names
                for standard_name, variations in nutrient_map.items():
                    if any(var.lower() in nutrient_name.lower() for var in variations):
                        nutrients[standard_name] = f"{nutrient_value} {nutrient_unit}"
                        break
            
            result = {
                "food_description": food.get("description", clean_name),
                "data_source": food.get("dataType", "Unknown"),
                "fdc_id": food.get("fdcId"),
                "nutrients": nutrients
            }
            
            # Add basic nutrients with fallback values
            basic_nutrients = {
                "calories": nutrients.get("Energy", "N/A"),
                "protein": nutrients.get("Protein", "N/A"),
                "fat": nutrients.get("Total lipid (fat)", "N/A"),
                "carbs": nutrients.get("Carbohydrate, by difference", "N/A"),
                "fiber": nutrients.get("Fiber, total dietary", "N/A"),
                "sodium": nutrients.get("Sodium, Na", "N/A")
            }
            
            result.update(basic_nutrients)
            logger.info(f"Successfully retrieved nutrition data for: {food['description']}")
            return result
            
        except requests.exceptions.Timeout:
            logger.error("Timeout when calling USDA API")
            return {"error": "USDA API timeout. Please try again"}
        except requests.exceptions.ConnectionError:
            logger.error("Connection error when calling USDA API")
            return {"error": "Cannot connect to USDA API. Check internet connection"}
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error when calling USDA API: {e}")
            return {"error": f"USDA API request failed: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error in USDA API call: {e}")
            return {"error": f"Unexpected error occurred: {str(e)}"}
    
    def analyze_image(self, image_path: str) -> Dict[str, Any]:
        """Analyze image and return food prediction with nutrition information"""
        try:
            # Ensure model is loaded
            if not self.is_loaded:
                self.load_model()
            
            # Validate image path
            self.validate_image_path(image_path)
            
            # Load and validate image
            try:
                logger.info(f"Processing image: {image_path}")
                image = Image.open(image_path)
                
                # Convert to RGB if necessary
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Validate image dimensions
                width, height = image.size
                if width < 50 or height < 50:
                    return {"error": "Image too small. Minimum size: 50x50 pixels"}
                
                if width > 4000 or height > 4000:
                    logger.warning(f"Large image detected: {width}x{height}. Consider resizing for faster processing")
                
            except UnidentifiedImageError:
                return {"error": "Invalid or corrupted image file"}
            except Exception as e:
                logger.error(f"Error loading image: {e}")
                return {"error": f"Failed to load image: {str(e)}"}
            
            # Perform prediction
            try:
                start_time = time.time()
                inputs = self.processor(images=image, return_tensors="pt") # type: ignore
                
                with torch.no_grad():
                    outputs = self.model(**inputs) # type: ignore
                    logits = outputs.logits
                    predicted_class_idx = logits.argmax(-1).item()
                    confidence = torch.softmax(logits, dim=-1).max().item()
                    label = self.model.config.id2label[predicted_class_idx] # type: ignore
                
                inference_time = time.time() - start_time
                readable_label = label.replace("_", " ")
                
                logger.info(f"Prediction: {readable_label} (confidence: {confidence:.3f}, time: {inference_time:.3f}s)")
                
                # Check confidence threshold
                if confidence < 0.3:
                    return {
                        "predicted_food": readable_label,
                        "confidence": round(confidence, 3),
                        "warning": "Low confidence prediction. Consider using a clearer image",
                        "nutrition": {"error": "Skipped nutrition lookup due to low confidence"},
                        "inference_time": round(inference_time, 3)
                    }
                
            except Exception as e:
                logger.error(f"Model inference error: {e}")
                return {"error": f"Failed to analyze image: {str(e)}"}
            
            # Get nutrition information
            logger.info("Fetching nutrition information...")
            nutrition_info = self.get_nutrition_usda(readable_label)
            
            result = {
                "predicted_food": readable_label,
                "confidence": round(confidence, 3),
                "nutrition": nutrition_info,
                "inference_time": round(inference_time, 3),
                "image_info": {
                    "path": image_path,
                    "dimensions": f"{width}x{height}",
                    "mode": image.mode
                }
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Unexpected error in image analysis: {e}")
            return {"error": f"Analysis failed: {str(e)}"}

def main():
    """Main function for command-line usage"""
    try:
        # Initialize classifier
        classifier = FoodClassifier()
        
        # Example usage with the test image
        test_image_path = os.path.join(os.path.dirname(__file__), "test_image.jpg")
        
        if not os.path.exists(test_image_path):
            logger.warning(f"Test image not found: {test_image_path}")
            logger.info("Please provide a valid image path")
            return
        
        logger.info("Starting food classification analysis...")
        result = classifier.analyze_image(test_image_path)
        
        # Print results in a formatted way
        print("\n" + "="*50)
        print("FOOD CLASSIFICATION RESULTS")
        print("="*50)
        
        if "error" in result:
            print(f"❌ Error: {result['error']}")
        else:
            print(f"🍽️  Predicted Food: {result['predicted_food']}")
            print(f"🎯 Confidence: {result['confidence']:.1%}")
            print(f"⚡ Processing Time: {result['inference_time']}s")
            
            if "warning" in result:
                print(f"⚠️  Warning: {result['warning']}")
            
            nutrition = result.get('nutrition', {})
            if "error" in nutrition:
                print(f"❌ Nutrition Error: {nutrition['error']}")
            else:
                print("\n📊 NUTRITION INFORMATION:")
                print(f"   Description: {nutrition.get('food_description', 'N/A')}")
                print(f"   Calories: {nutrition.get('calories', 'N/A')}")
                print(f"   Protein: {nutrition.get('protein', 'N/A')}")
                print(f"   Fat: {nutrition.get('fat', 'N/A')}")
                print(f"   Carbohydrates: {nutrition.get('carbs', 'N/A')}")
                print(f"   Fiber: {nutrition.get('fiber', 'N/A')}")
                print(f"   Sodium: {nutrition.get('sodium', 'N/A')}")
        
        print("="*50)
        
    except Exception as e:
        logger.error(f"Application error: {e}")
        print(f"❌ Application failed: {e}")

if __name__ == "__main__":
    main()
