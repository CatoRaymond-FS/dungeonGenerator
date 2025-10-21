#!/bin/sh
# --------------------------
# Ensure script is executable: chmod +x start.sh
# --------------------------

# Install Python3 and pip if not already available
if ! command -v python3 >/dev/null 2>&1; then
    echo "Installing Python3..."
    apk add --no-cache python3 py3-pip  # for Alpine-based containers
fi

# Navigate to backend folder
cd frontend/dungeon/src/backend || exit

# Install dependencies
if [ -f requirements.txt ]; then
    pip3 install --no-cache-dir -r requirements.txt
fi

# Run FastAPI app
uvicorn api:app --host 0.0.0.0 --port 8000
