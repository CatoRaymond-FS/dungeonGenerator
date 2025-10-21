#!/bin/bash
# Move into the backend folder
cd frontend/dungeon/src/backend

# (Optional) create virtual environment if you want
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn api:app --host 0.0.0.0 --port 8000
