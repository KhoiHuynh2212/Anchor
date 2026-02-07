#!/bin/bash

echo "🚀 Anchor Quickstart"
echo "==================="

# Check prerequisites
command -v python3 >/dev/null 2>&1 || { echo "❌ Python not found"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "⚠️  Docker not found (needed for MongoDB)"; }

# Start MongoDB with Docker
echo -e "\n📦 Starting MongoDB..."
docker run -d -p 27017:27017 --name anchor-mongo mongo:latest 2>/dev/null || \
  docker start anchor-mongo 2>/dev/null || \
  echo "⚠️  MongoDB container failed, ensure Docker is running"

sleep 2

# Start backend
echo -e "\n🔧 Starting backend..."
cd backend
if [ ! -d "venv" ]; then
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
else
  source venv/bin/activate
fi

# Check .env exists
if [ ! -f ".env" ]; then
  echo "❌ .env file missing! Create it from .env.example"
  exit 1
fi

# Start backend in background
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

sleep 3

# Test backend
curl -s http://localhost:8000/health | jq || echo "⚠️  Backend health check failed"

# Start frontend
echo -e "\n📱 Starting frontend..."
cd ../frontend
npm install
npx expo start &
FRONTEND_PID=$!

echo -e "\n✅ Services started!"
echo "Backend:  http://localhost:8000/docs"
echo "Frontend: Expo Dev Tools should open in browser"
echo ""
echo "To stop: kill $BACKEND_PID $FRONTEND_PID"
echo "         docker stop anchor-mongo"
