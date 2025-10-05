#!/bin/bash

echo "🚀 Installing CKEditor for AgentVoice Frontend"
echo "=============================================="

# Navigate to frontend directory
cd frontend

echo "📦 Installing CKEditor packages..."
npm install @ckeditor/ckeditor5-react@^6.2.0 @ckeditor/ckeditor5-build-classic@^39.0.0

echo "✅ CKEditor installation completed!"
echo ""
echo "📝 Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Navigate to /emails/create"
echo "3. Toggle 'HTML Editor' checkbox to use CKEditor"
echo ""
echo "🎉 CKEditor is now integrated into the email creation form!"
