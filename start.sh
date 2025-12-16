#!/bin/bash

echo "🚀 Starting AgentVoice Platform..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build and start all services
echo "📦 Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "✅ AgentVoice Platform is starting up!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: https://forskale.com"
echo "   Backend API: https://forskale.com:8000"
echo "   API Documentation: https://forskale.com:8000/docs"
echo ""
echo "📝 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose down"
echo ""
echo "🔄 To restart services:"
echo "   docker-compose restart" 