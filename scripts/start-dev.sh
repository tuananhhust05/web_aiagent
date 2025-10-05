#!/bin/bash

echo "🚀 Starting AgentVoice in Development Mode..."

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start development services
echo "🔨 Building and starting development services..."
docker-compose -f docker-compose.dev.yml up -d --build

echo "✅ Development services started!"
echo "📱 Frontend: https://4skale.com (with hot reload)"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
