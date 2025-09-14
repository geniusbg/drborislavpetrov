#!/bin/bash

echo "📝 Updating .env file for Whisper STT"
echo "===================================="

# Default project directory
PROJECT_DIR="/var/www/html/drpetrov"

# Allow custom directory as argument
if [ ! -z "$1" ]; then
    PROJECT_DIR="$1"
fi

echo "🔍 Looking for project in: $PROJECT_DIR"

# Check if directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    echo "💡 Usage: $0 [project_directory]"
    echo "   Example: $0 /var/www/html/drpetrov"
    exit 1
fi

# Navigate to project directory
cd "$PROJECT_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found in $PROJECT_DIR"
    echo "Creating .env file..."
    touch .env
fi

# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "📋 .env backup created"

# Remove old Whisper settings
echo "🧹 Removing old Whisper settings..."
sed -i '/WHISPER_/d' .env
sed -i '/CUDA_VISIBLE_DEVICES/d' .env
sed -i '/OMP_NUM_THREADS/d' .env
sed -i '/STT_FALLBACK/d' .env

# Add new Whisper settings
echo "📝 Adding new Whisper settings..."
echo "" >> .env
echo "# Whisper STT Configuration" >> .env
echo "WHISPER_MODEL=base" >> .env
echo "WHISPER_CLI=whisper" >> .env
echo "CUDA_VISIBLE_DEVICES=\"\"" >> .env
echo "OMP_NUM_THREADS=4" >> .env

echo ""
echo "✅ .env file updated successfully!"
echo ""
echo "📋 Added settings:"
echo "WHISPER_MODEL=base"
echo "WHISPER_CLI=whisper"
echo "CUDA_VISIBLE_DEVICES=\"\""
echo "OMP_NUM_THREADS=4"
echo ""
echo "🚀 Next steps:"
echo "1. Build the application: npm run build"
echo "2. Restart PM2: pm2 restart dr-borislav-petrov"
echo "3. Check logs: pm2 logs dr-borislav-petrov"
