#!/bin/bash

# Script to upload missing PWA files to production server
# Usage: ./upload-missing-files.sh

echo "📤 Uploading missing PWA files to production server"
echo "=================================================="

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

# Check if public directory exists
if [ ! -d "public" ]; then
    echo "❌ public directory not found in $PROJECT_DIR"
    echo "💡 Make sure you're in the correct project directory"
    exit 1
fi

echo "✅ Found public directory"

# Copy manifest files
echo "📝 Copying manifest files..."
cp public/manifest.json ./
cp public/admin-manifest.json ./

# Copy favicon files
echo "🎨 Copying favicon files..."
cp public/favicon.ico ./
cp public/favicon-16x16.png ./
cp public/favicon-32x32.png ./

# Copy icon files
echo "🖼️ Copying icon files..."
cp public/icon-192.png ./
cp public/icon-512.png ./

# Set proper permissions
echo "🔐 Setting permissions..."
chmod 644 manifest.json admin-manifest.json favicon.ico favicon-16x16.png favicon-32x32.png icon-192.png icon-512.png

echo ""
echo "✅ All PWA files uploaded successfully!"
echo ""
echo "📋 Uploaded files:"
echo "- manifest.json"
echo "- admin-manifest.json"
echo "- favicon.ico"
echo "- favicon-16x16.png"
echo "- favicon-32x32.png"
echo "- icon-192.png"
echo "- icon-512.png"
echo ""
echo "🚀 Next steps:"
echo "1. Restart your web server (nginx/apache)"
echo "2. Clear browser cache"
echo "3. Test PWA functionality"
echo ""
echo "🧪 Test URLs:"
echo "- Main manifest: https://drpetrov.bg/manifest.json"
echo "- Admin manifest: https://drpetrov.bg/admin-manifest.json"
echo "- Favicon: https://drpetrov.bg/favicon.ico"
