#!/bin/bash

# Set error handling
set -e

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "Starting Neo Future Dashboard Backend..."

# Use system Python
PYTHON="python3"
echo "Using system Python"

# Check if Python is available
if ! command -v $PYTHON &> /dev/null; then
    echo "Error: Python not found. Please install Python 3."
    exit 1
fi

# Start the FastAPI server
echo "Starting FastAPI server..."
$PYTHON -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload --log-level info

# This point is only reached if the server stops
echo "Server stopped"
