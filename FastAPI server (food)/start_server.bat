@echo off
REM FastAPI Server Startup Script for Windows

echo Starting Food and Nutrition FastAPI Server...

REM Check if .env file exists
if not exist ".env" (
    echo ❌ Error: .env file not found!
    echo Please copy .env.example to .env and configure your API keys
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
pip install -r requirements.txt

REM Start the server
echo 🚀 Starting FastAPI server on http://localhost:8000
echo 📖 API docs available at http://localhost:8000/docs
python main.py

pause
