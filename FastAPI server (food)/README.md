# Food and Nutrition API Server

An improved FastAPI server for food image classification and nutrition analysis with comprehensive error handling, security features, and efficient model loading.

## 🚀 Features

- **Secure API Key Management**: Environment variable-based configuration
- **Comprehensive Error Handling**: Detailed error messages and logging
- **Efficient Model Loading**: Singleton pattern with startup loading
- **Input Validation**: File type, size, and format validation
- **Rate Limiting Protection**: Graceful handling of API rate limits
- **Health Checks**: Endpoints for monitoring server and model status
- **CORS Support**: Ready for mobile app integration
- **Detailed Logging**: Comprehensive logging for debugging and monitoring

## 📋 Requirements

- Python 3.8+
- FastAPI
- PyTorch
- Transformers
- Pillow
- python-dotenv
- uvicorn

## 🛠️ Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your CalorieNinjas API key
   ```

3. **Run the Server**:
   
   **Linux/Mac**:
   ```bash
   chmod +x start_server.sh
   ./start_server.sh
   ```
   
   **Windows**:
   ```bash
   start_server.bat
   ```
   
   **Manual**:
   ```bash
   python main.py
   ```

## 📡 API Endpoints

### `GET /`
Health check endpoint
```json
{
  "message": "Food and Nutrition API is running",
  "status": "healthy",
  "model_loaded": true
}
```

### `GET /health`
Detailed health check
```json
{
  "status": "healthy",
  "model_loaded": true,
  "api_key_configured": true
}
```

### `POST /analyze`
Analyze food image
- **Input**: Multipart form with image file
- **Supported formats**: JPEG, PNG, WebP
- **Max file size**: 10MB
- **Returns**: Food prediction with nutrition data

**Success Response**:
```json
{
  "predicted_food": "pizza",
  "confidence": 0.95,
  "nutrition": {
    "calories_per_100g": 266,
    "protein_g": 11.1,
    "carbohydrates_total_g": 33.0,
    "fat_total_g": 10.1
  },
  "inference_time": 0.234
}
```

**Error Response**:
```json
{
  "error": "Unsupported image type. Supported types: image/jpeg, image/png, image/webp"
}
```

## 🔧 Configuration

### Environment Variables (.env)

```bash
# CalorieNinjas API Key
NUTRITION_API_KEY=your_api_key_here
```

### API Key Setup

1. **Get CalorieNinjas API Key**:
   - Visit [CalorieNinjas API](https://calorieninjas.com/api)
   - Sign up for free account
   - Copy your API key to `.env` file

## 🛡️ Security Features

- **Environment-based secrets**: No hardcoded API keys
- **Input validation**: File type and size restrictions
- **Error handling**: Secure error messages without exposing internals
- **Rate limiting**: Graceful handling of API quota limits

## 📊 Performance Optimizations

- **Model caching**: Load model once at startup
- **Singleton pattern**: Efficient memory usage
- **Async processing**: Non-blocking file operations
- **Confidence thresholds**: Skip API calls for low-confidence predictions

## 🔍 Monitoring

- **Structured logging**: JSON-formatted logs for analysis
- **Performance metrics**: Inference time tracking
- **Health endpoints**: Easy integration with monitoring tools
- **Error tracking**: Comprehensive error logging

## 🚨 Error Handling

The server handles various error scenarios:

- Invalid image formats
- Corrupted images
- Network timeouts
- API rate limits
- Large file uploads
- Missing API keys
- Model loading failures

## 📝 Logging

Logs include:
- Request processing times
- Model predictions and confidence scores
- API call results
- Error details and stack traces
- Performance metrics

## 🔄 Development

To run in development mode with auto-reload:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📚 API Documentation

Once running, visit:
- **Interactive docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
