#!/bin/sh
# --------------------------
# Ensure script is executable: chmod +x start.sh
# --------------------------

# Navigate to backend folder
cd frontend/dungeon/src/backend || exit

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

# Activate virtual environment
. .venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
if [ -f requirements.txt ]; then
    pip install --no-cache-dir -r requirements.txt
fi

# Run FastAPI app
.venv/bin/uvicorn api:app --host 0.0.0.0 --port 8000
