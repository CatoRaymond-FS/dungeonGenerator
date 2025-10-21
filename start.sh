#!/bin/sh
# --------------------------
# Make executable: chmod +x start.sh
# --------------------------

# Navigate to backend folder
cd frontend/dungeon/src/backend || exit

# Create a virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

# Activate the virtual environment
. .venv/bin/activate

# Upgrade pip inside the venv
pip install --upgrade pip

# Install dependencies
if [ -f requirements.txt ]; then
    pip install --no-cache-dir -r requirements.txt
fi

# Run FastAPI app with uvicorn
exec uvicorn api:app --host 0.0.0.0 --port 8000
