#!/bin/bash
# Complete Food and Nutrition App Setup Script

echo "🍽️  Food and Nutrition Mobile App Setup"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup mobile app
echo ""
echo "📱 Setting up React Native/Expo mobile app..."
cd "$(dirname "$0")"
npm install
echo "✅ Mobile app dependencies installed"

# Setup FastAPI server
echo ""
echo "🚀 Setting up FastAPI server..."
cd "FastAPI server (food)"

if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "🔧 Activating virtual environment..."
source venv/bin/activate

echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp ../.env.example .env
    echo "⚠️  Please edit .env file with your CalorieNinjas API key"
fi

cd ..

# Setup image classifier
echo ""
echo "🧠 Setting up image classifier..."
cd "image classifier"

if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "🔧 Activating virtual environment..."
source venv/bin/activate

echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp ../.env.example .env
    echo "⚠️  Please edit .env file with your USDA API key"
fi

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Get API keys:"
echo "   - CalorieNinjas: https://calorieninjas.com/api"
echo "   - USDA: https://fdc.nal.usda.gov/api-guide.html"
echo ""
echo "2. Update .env files in both server directories with your API keys"
echo ""
echo "3. Start the services:"
echo "   Mobile app: npm start"
echo "   FastAPI server: cd 'FastAPI server (food)' && ./start_server.sh"
echo "   Image classifier: cd 'image classifier' && python imageclassifier.py"
echo ""
echo "📖 Check README files in each directory for detailed instructions"
