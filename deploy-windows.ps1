# Windows deployment script for WebSocket-enabled app

Write-Host "🚀 Starting Windows deployment..." -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm ci

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run build

# Set production environment
$env:NODE_ENV = "production"

# Start the server
Write-Host "🌐 Starting server..." -ForegroundColor Yellow
npm start 