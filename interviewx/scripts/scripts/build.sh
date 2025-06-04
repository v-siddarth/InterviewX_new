#!/bin/bash

echo "🏗️  Building InterviewX for Production"
echo "===================================="

# Build frontend
echo "⚛️ Building Frontend..."
cd frontend
npm run build

# Copy build to backend public folder
echo "📦 Copying build files..."
mkdir -p ../backend/public
cp -r dist/* ../backend/public/

echo "✅ Production build completed!"
echo "📦 Files are ready in backend/public/"

cd ..
