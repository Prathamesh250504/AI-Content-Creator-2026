#!/bin/bash
# Build script for AI Content Creator
# This script prepares the application for deployment

echo "🏗️  AI Content Creator - Build Script"
echo "======================================"

# Check if we're in the right directory
if [ ! -d "react-frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Clean up unnecessary files
echo ""
echo "🧹 Cleaning up unnecessary files..."
python cleanup.py

# Build frontend
echo ""
echo "📦 Building React frontend..."
cd react-frontend

# Install dependencies
echo "Installing dependencies..."
npm install

# Build production bundle
echo "Creating production build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
    echo "📁 Build output: react-frontend/build/"
else
    echo "❌ Frontend build failed!"
    exit 1
fi

cd ..

# Check backend dependencies
echo ""
echo "🐍 Checking Python dependencies..."
pip install -r requirements.txt --quiet

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed!"
else
    echo "❌ Failed to install backend dependencies!"
    exit 1
fi

# Run basic tests
echo ""
echo "🧪 Running basic checks..."

# Check if backend can import
python -c "import sys; sys.path.insert(0, 'backend'); import api_server" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend imports successfully!"
else
    echo "⚠️  Warning: Backend import check failed"
fi

echo ""
echo "======================================"
echo "✨ Build complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review the build output in react-frontend/build/"
echo "2. Test locally before deploying"
echo "3. Follow DEPLOYMENT.md for deployment instructions"
echo ""
echo "🚀 Ready to deploy!"
