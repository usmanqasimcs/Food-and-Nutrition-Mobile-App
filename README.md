# Food & Nutrition Mobile App

A high-quality mobile-ready system for food image recognition, nutrition lookup, and personalized recommendations.  
This repository contains a FastAPI backend for image-based food classification and nutrition lookup, a model image-classifier component, and supporting resources to plug into a mobile app frontend.

This README is ready to upload. It highlights what’s in the repo, how to run the services, what environment variables you should provide, and suggestions to make the project production-ready.

---

## Key highlights

- FastAPI backend optimized for image uploads and model inference
- Torch + Hugging Face transformers support for modern image-classification pipelines
- Simple, documented local development flow with reproducible dependency list
- Structured so you can swap in a mobile frontend (React Native / Flutter / Expo) or call the API directly

---

## Table of contents

- [Project overview](#project-overview)
- [Features](#features)
- [Repository layout](#repository-layout)
- [Tech stack](#tech-stack)
- [Quickstart — Ready-to-run (Local)](#quickstart---ready-to-run-local)
- [Environment variables (.env.example)](#environment-variables-envexample)
- [Model & classifier notes](#model--classifier-notes)
- [Production & deployment recommendations](#production--deployment-recommendations)
- [Testing & troubleshooting](#testing--troubleshooting)
- [Contributing](#contributing)
- [License & contact](#license--contact)
- [Observed requirements (verbatim)](#observed-requirements-verbatim)

---

## Project overview

This project provides a backend capable of accepting food images, performing model inference to identify the food item(s), and returning nutrition information or recommendations. It is built so the backend can be consumed by any mobile client (iOS/Android) or web client.

---

## Features

- Image upload endpoints (multipart/form-data)
- Model inference using PyTorch + transformers
- Nutrition lookup (external API integration friendly)
- Lightweight FastAPI server with UVicorn for high-performance async handling
- Example scripts and requirements for easy setup

---

## Repository layout (important files & folders)

- FastAPI server (food)/ — FastAPI backend (requirements.txt present)
- food-and-nutrition/FastAPI server (food)/ — duplicate requirements file (same contents)
- model image classifier/ — model files, weights and inference code (place model artifacts here)
- Other helper files or mobile frontend code (if present) should be co-located or connected via API calls

---

## Tech stack

- FastAPI (web framework)
- Uvicorn (ASGI server)
- Python (3.8+ recommended)
- PyTorch + torchvision (model inference)
- Transformers (Hugging Face model support)
- Pillow (image processing)
- python-multipart (file uploads)
- python-dotenv (env file loading)
- requests (HTTP client for external APIs)

---

## Quickstart — Ready-to-run (Local)

Follow these steps to get the backend up and running locally. Commands assume you have Python installed.

1. Clone the repository
```bash
git clone https://github.com/usmanqasimcs/Food-and-Nutrition-Mobile-App.git
cd Food-and-Nutrition-Mobile-App
```

2. Create & activate a virtual environment
- macOS / Linux:
```bash
python -m venv venv
source venv/bin/activate
```
- Windows (PowerShell):
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

3. Install dependencies (exact observed requirements file)
```bash
pip install -r "FastAPI server (food)/requirements.txt"
# or
cd "FastAPI server (food)"
pip install -r requirements.txt
```

4. Create a .env file based on the template below (see **Environment variables**)

5. Start the FastAPI server
- Typical development command (auto-reload):
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- If your entrypoint file is named differently (e.g. `app.py`), change `main:app` to `app:app` or the correct module:object path.

6. Open the API
- Default dev URL: http://localhost:8000
- If you have OpenAPI docs exposed (FastAPI default): http://localhost:8000/docs

---

## Environment variables (.env.example)

Create a `.env` file in the FastAPI server folder and populate these values (these names are conventional; confirm with your code):

.env.example (ready to copy)
```env
# Server / host
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000

# Inference / model
MODEL_PATH=./model image classifier/model.pt
DEVICE=cpu          # or cuda

# Optional: transformer/model identifiers
TRANSFORMER_MODEL=google/vit-base-patch16-224

# Secrets / app config
SECRET_KEY=replace_with_a_secure_value

# External APIs (nutrition lookups)
NUTRITION_API_URL=https://api.example.com/nutrition
NUTRITION_API_KEY=replace_with_api_key
```

Important: The exact env var names used by your FastAPI code may differ — search your FastAPI server files for `os.getenv`, `dotenv.load_dotenv`, or direct `os.environ[...]` access and update `.env` accordingly.

---

## Model & classifier notes

- Place model weights and any tokenizer/config files inside the `model image classifier/` folder.
- Set `MODEL_PATH` to point to your model artifact (e.g. `./model image classifier/model.pt`).
- If using GPU inference:
  - Install a torch wheel with CUDA support matching your drivers.
  - Set `DEVICE=cuda` and ensure GPU availability.
- Keep model files out of source control if large — store weights in an artifact registry or provide instructions to download.

---

## Production & deployment recommendations

- Containerize with Docker for consistent deployments:
  - Separate services: fastapi-server, model-worker (if heavy model loads), and optionally a Redis queue.
- Use GPU nodes for inference if using large models for low-latency responses.
- Use an ASGI server/proxy setup (e.g., gunicorn + uvicorn workers, or run uvicorn behind Nginx).
- Protect secret keys and external API keys using environment variables or secret stores (AWS Secrets Manager / HashiCorp Vault).
- Add monitoring & logging (structured logs, Sentry).
- For mobile clients, enable HTTPS & CORS only for expected origins.

---

## Testing & troubleshooting

- If `uvicorn` cannot find `main:app`, check for files that create the FastAPI instance (look for `FastAPI()`).
- Torch install errors: use CPU-only wheels if you don't have CUDA, or follow PyTorch install instructions for your CUDA version.
- If uploads fail, confirm client uses `multipart/form-data` and python-multipart is installed.
- If model loading fails, verify `MODEL_PATH` and file permissions.

---

## Contributing

- Fork → branch → implement → PR
- Add tests for new endpoints
- Keep model weights out of PRs — use download scripts or artifacts
- Include clear change descriptions and any model metadata (dataset, training recipe)

---

## License & contact

Owner: usmanqasimcs  
---
