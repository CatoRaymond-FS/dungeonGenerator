#!/bin/sh
# Ensure script is executable: chmod +x start.sh

# Update and install Python3 and pip if not available
if ! command -v python3 >/dev/null 2>&1; then
    echo "Installing Python3..."
    apt-get update
    apt-get install -y python3 python3-pip
fi

# Navigate to backend folder
cd frontend/dungeon/src/backend || exit

# Install dependencies
if [ -f requirements.txt ]; then
    pip3 install --no-cache-dir -r requirements.txt
fi

# Run FastAPI app
uvicorn api:app --host 0.0.0.0 --port 8000
