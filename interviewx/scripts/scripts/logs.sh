#!/bin/bash

echo "📊 InterviewX Application Logs"
echo "============================="

case $1 in
    "frontend"|"f")
        echo "📱 Frontend Logs:"
        docker-compose logs -f frontend
        ;;
    "backend"|"b")
        echo "🔧 Backend Logs:"
        docker-compose logs -f backend
        ;;
    "mongodb"|"db"|"m")
        echo "🗄️ MongoDB Logs:"
        docker-compose logs -f mongodb
        ;;
    "nginx"|"n")
        echo "🌐 Nginx Logs:"
        docker-compose logs -f nginx
        ;;
    *)
        echo "🔍 All Service Logs:"
        docker-compose logs -f
        ;;
esac
