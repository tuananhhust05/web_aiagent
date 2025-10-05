#!/bin/bash

echo "🚀 Starting AgentVoice in Production Mode..."

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start production services
echo "🔨 Building and starting production services..."
docker-compose up -d --build

echo "✅ Production services started!"
echo "📱 Frontend: https://4skale.com"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
