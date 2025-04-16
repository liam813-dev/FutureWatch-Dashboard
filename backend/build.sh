#!/bin/bash
set -e

# Install requirements
pip install -r requirements.txt

# Print Python version for debugging
python --version

# Install any additional dependencies if needed
# pip install additional-dependencies

# Set up environment variables
echo "Build completed successfully" 