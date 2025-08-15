#!/bin/bash

echo "🚀 Building AgentVoice Frontend for Production..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Install dependencies
echo "📦 Installing dependencies..."
npm install --omit=dev

# Build for production
echo "🔨 Building application..."
npm run build:prod

# Check build size
echo "📊 Build completed!"
echo "📁 Build directory: dist/"
echo "📏 Build size:"
du -sh dist/

echo "✅ Production build ready!"
echo "🚀 To start production: docker-compose up -d"
echo "📱 Access at: http://localhost:5173"
echo "⚡ Using Vite preview server (no nginx required)"
