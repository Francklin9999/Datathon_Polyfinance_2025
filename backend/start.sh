#!/bin/bash

# Quick start script for IntelliRisk Backend

echo "🚀 Starting IntelliRisk Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies if not already installed
if [ ! -f "venv/.installed" ]; then
    echo "📥 Installing dependencies..."
    pip install -r requirements.txt
    touch venv/.installed
fi

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Start the server
echo "✅ Starting FastAPI server..."
echo "📍 API available at: http://localhost:8000"
echo "📚 Documentation at: http://localhost:8000/docs"
echo ""
python main.py

