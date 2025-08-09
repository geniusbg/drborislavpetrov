# 🚀 Deployment Guide

## Windows Development

```powershell
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Linux Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Docker Deployment (Linux)

### Development:
```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production (SECURE):
```bash
# Set environment variables first
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export POSTGRES_PASSWORD="your_secure_password"
export JWT_SECRET="your_very_long_random_secret"
export ADMIN_PASSWORD="strong_admin_password"

# Use production configuration
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## Manual Linux Deployment

```bash
# Make deployment script executable
chmod +x deploy-linux.sh

# Run deployment
./deploy-linux.sh
```

## Windows Production Deployment

```powershell
# Run PowerShell deployment script
.\deploy-windows.ps1
```

## Environment Variables

Create a `.env` file with:

```env
DATABASE_URL=postgresql://username:password@host:port/database
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_very_long_random_secret_key_here
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

## WebSocket Features

- ✅ Real-time booking updates
- ✅ Live notifications
- ✅ Multi-admin synchronization
- ✅ Cross-platform compatibility (Windows/Linux) 