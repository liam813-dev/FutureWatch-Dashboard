#!/bin/bash

# Set error handling
set -e

# Use Anaconda Python
PYTHON="/Users/liam/anaconda3/bin/python"
echo "Using Anaconda Python"

# Start the FastAPI server
echo "Starting FastAPI server..."
cd backend
$PYTHON -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload --log-level info 