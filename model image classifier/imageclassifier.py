from transformers import ViTImageProcessor, ViTForImageClassification
from PIL import Image
import torch
import requests

# Model loading
model = ViTForImageClassification.from_pretrained("nateraw/vit-base-food101")
processor = ViTImageProcessor.from_pretrained("nateraw/vit-base-food101")

# USDA API
API_KEY = "UOFCFtRS0bt015m1WIzpMhprrhkcQiewyyOlY5nh"

def get_nutrition(food_name):
    url = "https://api.nal.usda.gov/fdc/v1/foods/search"
    params = {
        "query": food_name,
        "api_key": API_KEY,
        "pageSize": 1
    }
    response = requests.get(url, params=params)
    data = response.json()

    if not data.get("foods"):
        return {"error": "No nutrition data found."}

    food = data["foods"][0]
    nutrients = {n['nutrientName']: n['value'] for n in food.get('foodNutrients', [])}

    return {
        "label": food["description"],
        "calories": nutrients.get("Energy", "N/A"),
        "protein": nutrients.get("Protein", "N/A"),
        "fat": nutrients.get("Total lipid (fat)", "N/A"),
        "carbs": nutrients.get("Carbohydrate, by difference", "N/A")
    }

def analyze_image(image_path):
    image = Image.open(image_path)
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        predicted_class_idx = logits.argmax(-1).item()
        label = model.config.id2label[predicted_class_idx]
    readable_label = label.replace("_", " ")
    nutrition_info = get_nutrition(readable_label)
    return {
        "predicted_food": readable_label,
        "nutrition": nutrition_info
    }

# Example usage
result = analyze_image("f:/food-and-nutrition/image classifier/test_image.jpg")

print(result)
