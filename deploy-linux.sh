#!/bin/bash

# Linux deployment script for WebSocket-enabled app

echo "🚀 Starting Linux deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🔨 Building application..."
npm run build

# Set production environment
export NODE_ENV=production

# Start the server
echo "🌐 Starting server..."
npm start 