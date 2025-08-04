@echo off
REM Complete Food and Nutrition App Setup Script for Windows

echo 🍽️  Food and Nutrition Mobile App Setup
echo ========================================

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python is not installed. Please install Python first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Setup mobile app
echo.
echo 📱 Setting up React Native/Expo mobile app...
call npm install
echo ✅ Mobile app dependencies installed

REM Setup FastAPI server
echo.
echo 🚀 Setting up FastAPI server...
cd "FastAPI server (food)"

if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

echo 📥 Installing Python dependencies...
pip install -r requirements.txt

if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy "..\.env.example" ".env"
    echo ⚠️  Please edit .env file with your CalorieNinjas API key
)

cd ..

REM Setup image classifier
echo.
echo 🧠 Setting up image classifier...
cd "image classifier"

if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

echo 📥 Installing Python dependencies...
pip install -r requirements.txt

if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy "..\.env.example" ".env"
    echo ⚠️  Please edit .env file with your USDA API key
)

cd ..

echo.
echo 🎉 Setup complete!
echo.
echo 📋 Next steps:
echo 1. Get API keys:
echo    - CalorieNinjas: https://calorieninjas.com/api
echo    - USDA: https://fdc.nal.usda.gov/api-guide.html
echo.
echo 2. Update .env files in both server directories with your API keys
echo.
echo 3. Start the services:
echo    Mobile app: npm start
echo    FastAPI server: cd "FastAPI server (food)" ^&^& start_server.bat
echo    Image classifier: cd "image classifier" ^&^& python imageclassifier.py
echo.
echo 📖 Check README files in each directory for detailed instructions

pause
