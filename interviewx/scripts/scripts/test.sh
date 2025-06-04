#!/bin/bash

echo "🧪 Running InterviewX Tests"
echo "==========================="

# Test backend
echo "🔧 Testing Backend..."
cd backend
npm test

# Test frontend
echo "⚛️ Testing Frontend..."
cd ../frontend
npm test

echo "✅ All tests completed!"
