# Food Image Classifier

An improved standalone food image classifier with efficient model loading, comprehensive error handling, and USDA nutrition data integration.

## 🚀 Features

- **Efficient Model Caching**: Load model once and reuse for multiple predictions
- **Comprehensive Error Handling**: Robust validation and error reporting
- **USDA Nutrition Integration**: Detailed nutrition data from official USDA database
- **Image Validation**: Format, size, and quality checks
- **Confidence Scoring**: Prediction confidence with threshold filtering
- **Detailed Logging**: Structured logging for debugging and analysis
- **Secure Configuration**: Environment variable-based API key management

## 📋 Requirements

- Python 3.8+
- PyTorch
- Transformers
- Pillow
- requests
- python-dotenv

## 🛠️ Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your USDA API key
   ```

3. **Get USDA API Key**:
   - Visit [USDA FoodData Central](https://fdc.nal.usda.gov/api-guide.html)
   - Sign up for free API access
   - Add your API key to `.env` file

## 🎯 Usage

### Command Line
```bash
python imageclassifier.py
```

### Programmatic Usage
```python
from imageclassifier import FoodClassifier

# Initialize classifier (model loads once)
classifier = FoodClassifier()

# Analyze an image
result = classifier.analyze_image("path/to/your/image.jpg")

if "error" not in result:
    print(f"Food: {result['predicted_food']}")
    print(f"Confidence: {result['confidence']:.1%}")
    print(f"Calories: {result['nutrition']['calories']}")
else:
    print(f"Error: {result['error']}")
```

## 📊 Sample Output

```
==================================================
FOOD CLASSIFICATION RESULTS
==================================================
🍽️  Predicted Food: chicken wings
🎯 Confidence: 87.3%
⚡ Processing Time: 0.156s

📊 NUTRITION INFORMATION:
   Description: Chicken, broilers or fryers, wing, meat and skin, cooked, roasted
   Calories: 203 kcal
   Protein: 30.5 g
   Fat: 8.1 g
   Carbohydrates: 0 g
   Fiber: 0 g
   Sodium: 82 mg
==================================================
```

## 🔧 Class Architecture

### FoodClassifier Class

```python
class FoodClassifier:
    def __init__(self):
        # Initialize with environment validation
        
    def load_model(self):
        # Efficient model loading with caching
        
    def validate_image_path(self, image_path):
        # Comprehensive image validation
        
    def get_nutrition_usda(self, food_name):
        # USDA API integration with error handling
        
    def analyze_image(self, image_path):
        # Main analysis method
```

## 🛡️ Error Handling

The classifier handles various scenarios:

### Image Validation
- File existence and accessibility
- Supported formats (JPEG, PNG, WebP, BMP)
- File size limits (max 10MB)
- Image dimensions (min 50x50px)
- Corrupted or invalid images

### Model Processing
- Model loading failures
- Inference errors
- Low confidence predictions (< 30%)
- Memory issues

### API Integration
- Network connectivity issues
- API key validation
- Rate limiting
- Invalid responses
- Timeout handling

## 📈 Performance Features

### Model Efficiency
- **Singleton Pattern**: Model loads once per session
- **Memory Optimization**: Efficient tensor operations
- **Batch Processing**: Ready for multiple image analysis
- **GPU Support**: Automatic GPU detection when available

### Caching Strategy
```python
# Model loads only once
classifier = FoodClassifier()  # Model loads here
result1 = classifier.analyze_image("image1.jpg")  # Uses cached model
result2 = classifier.analyze_image("image2.jpg")  # Uses cached model
```

## 🔍 Validation Features

### Image Quality Checks
- Minimum dimensions (50x50 pixels)
- Maximum file size (10MB)
- Format validation
- Corruption detection

### Confidence Thresholds
- Predictions below 30% confidence trigger warnings
- Low confidence predictions skip nutrition lookup
- Confidence scores included in results

## 📝 Logging and Debugging

### Log Levels
- **INFO**: Model loading, predictions, API calls
- **WARNING**: Low confidence, large images, rate limits
- **ERROR**: Model failures, API errors, file issues

### Log Format
```
2025-08-03 10:30:15,123 - INFO - Loading ViT model and processor...
2025-08-03 10:30:18,456 - INFO - Model loaded successfully in 3.33 seconds
2025-08-03 10:30:20,789 - INFO - Processing image: test_image.jpg
2025-08-03 10:30:21,012 - INFO - Prediction: chicken wings (confidence: 0.873, time: 0.156s)
```

## 🔄 Environment Configuration

### .env File Structure
```bash
# USDA API Key (required)
USDA_API_KEY=your_usda_api_key_here
```

### Environment Validation
- Checks for required API keys at startup
- Validates API key format
- Provides helpful error messages for missing configuration

## 📚 Advanced Usage

### Batch Processing
```python
classifier = FoodClassifier()
image_paths = ["img1.jpg", "img2.jpg", "img3.jpg"]

for path in image_paths:
    result = classifier.analyze_image(path)
    # Process result...
```

### Error Handling in Code
```python
classifier = FoodClassifier()
result = classifier.analyze_image("image.jpg")

if "error" in result:
    print(f"Analysis failed: {result['error']}")
    if "suggestion" in result:
        print(f"Suggestion: {result['suggestion']}")
else:
    # Process successful result
    confidence = result['confidence']
    food_name = result['predicted_food']
    nutrition = result['nutrition']
```

## 🆚 Comparison with Original

| Feature | Original | Improved |
|---------|----------|----------|
| Model Loading | Every run | Once per session |
| Error Handling | Basic | Comprehensive |
| API Keys | Hardcoded | Environment variables |
| Validation | None | Extensive |
| Logging | Print statements | Structured logging |
| Confidence | Not shown | Included with thresholds |
| Performance | Not tracked | Timing included |
| Nutrition API | Basic | Robust with fallbacks |
