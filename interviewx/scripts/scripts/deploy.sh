#!/bin/bash

echo "🚀 Deploying InterviewX to Production"
echo "===================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Remove old images (optional)
read -p "Remove old Docker images? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Removing old images..."
    docker-compose down --rmi all
fi

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose up -d --build

# Show status
echo "📊 Checking service status..."
docker-compose ps

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🌍 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   MongoDB:  mongodb://admin:password123@localhost:27017/interviewx"
echo ""
echo "📧 Demo Login:"
echo "   Email:    demo@interviewx.com"
echo "   Password: demo123"
echo ""
echo "📊 Monitor logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"
