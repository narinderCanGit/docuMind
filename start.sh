#!/bin/bash

# Kill any processes using ports 3000 and 5173
echo "Stopping any existing servers..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Start the backend server
echo "Starting backend server on port 3000..."
node api/index.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start the frontend with VITE_API_URL explicitly set
echo "Starting frontend server on port 5173..."
VITE_API_URL=http://localhost:3000 pnpm run dev &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
  echo "Shutting down servers..."
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  exit 0
}

# Set up trap for script termination
trap cleanup SIGINT SIGTERM

# Keep script running
echo "Servers are running. Press Ctrl+C to stop."
wait
