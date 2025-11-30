#!/bin/bash

echo "🚀 Starting AgentVoice in Production Mode..."

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start production services
echo "🔨 Building and starting production services..."
docker-compose up -d --build

echo "✅ Production services started!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:5173:8000"
echo "📚 API Docs: http://localhost:5173:8000/docs"
