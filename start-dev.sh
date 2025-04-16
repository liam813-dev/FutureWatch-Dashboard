#!/bin/bash
cd backend
./start.sh &
BACKEND_PID=$!

cd ../frontend
npm run dev

# When frontend is stopped, kill the backend
kill $BACKEND_PID
