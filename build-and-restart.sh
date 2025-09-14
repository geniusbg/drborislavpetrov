#!/bin/bash

echo "🔨 Building and restarting application"
echo "======================================"

# Default project directory
PROJECT_DIR="/var/www/html/drpetrov"

# Allow custom directory as argument
if [ ! -z "$1" ]; then
    PROJECT_DIR="$1"
fi

echo "📁 Project directory: $PROJECT_DIR"

# Check if directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    echo "💡 Usage: $0 [project_directory]"
    exit 1
fi

# Navigate to project directory
cd "$PROJECT_DIR"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in $PROJECT_DIR"
    echo "💡 Make sure you're in the correct project directory"
    exit 1
fi

echo "✅ Found package.json"

# Show current .env Whisper settings
if [ -f ".env" ]; then
    echo ""
    echo "📋 Current Whisper settings in .env:"
    grep -E "(WHISPER_|CUDA_|OMP_)" .env || echo "No Whisper settings found"
    echo ""
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Restart PM2
    echo "🚀 Restarting PM2..."
    pm2 restart dr-borislav-petrov
    
    # Show PM2 status
    echo ""
    echo "📊 PM2 Status:"
    pm2 status
    
    echo ""
    echo "✅ Application restarted successfully!"
    echo "📋 Check logs with: pm2 logs dr-borislav-petrov"
    echo "🧪 Test STT API at: https://drpetrov.bg/api/stt"
    
else
    echo "❌ Build failed!"
    echo "💡 Check the error messages above"
    exit 1
fi
