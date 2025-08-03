from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from transformers import ViTImageProcessor, ViTForImageClassification
from PIL import Image
import torch
import requests
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and processor once
model = ViTForImageClassification.from_pretrained("nateraw/vit-base-food101")
processor = ViTImageProcessor.from_pretrained("nateraw/vit-base-food101")

NUTRITION_API_KEY = "UOFCFtRS0bt015m1WIzpMhprrhkcQiewyyOlY5nh"

def predict_food_and_nutrition(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        logits = model(**inputs).logits
        predicted_idx = logits.argmax(-1).item()
        label = model.config.id2label[predicted_idx]

    response = requests.get(
        f"https://api.calorieninjas.com/v1/nutrition?query={label}",
        headers={"X-Api-Key": NUTRITION_API_KEY}
    )
    nutrition_data = response.json()
    return {
        "predicted_food": label,
        "nutrition": nutrition_data["items"][0] if nutrition_data["items"] else {}
    }

@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    result = predict_food_and_nutrition(image_bytes)
    return result