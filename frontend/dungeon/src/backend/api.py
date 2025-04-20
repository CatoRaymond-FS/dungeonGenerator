from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from tensorflow.keras.models import load_model
import json
import os

app = FastAPI()

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load AI model
try:
    model_path = "dungeon_generator_model.h5"
    generator = load_model(model_path)
except Exception as e:
    generator = None
    print(f"Failed to load model: {e}")

# Setup save directory
SAVE_DIR = "saved_dungeons"
os.makedirs(SAVE_DIR, exist_ok=True)

# Dungeon tile types
TILE_TYPES = [' ', 'R', 'T', 'B', 'D', 'H', 'W']

# Generate dungeon using AI model
def generate_dungeon(rows=10, cols=10):
    if generator is None:
        raise RuntimeError("AI model not loaded.")
    
    noise = np.random.normal(0, 1, (1, 100))
    raw_output = generator.predict(noise)

    if raw_output.size != 100:
        raise HTTPException(status_code=500, detail="Unexpected model output shape.")

    grid = raw_output.reshape(10, 10)

    dungeon = [
        [TILE_TYPES[int(cell * len(TILE_TYPES)) % len(TILE_TYPES)] for cell in row]
        for row in grid
    ]
    return dungeon


# Endpoint: Generate dungeon
@app.get("/generate_dungeon")
def get_dungeon(rows: int = 10, cols: int = 10):
    try:
        dungeon = generate_dungeon(rows, cols)
        return {"dungeon": dungeon}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint: Save dungeon
@app.post("/save_dungeon")
def save_dungeon(dungeon_data: dict):
    dungeon_id = len(os.listdir(SAVE_DIR)) + 1
    file_path = os.path.join(SAVE_DIR, f"dungeon_{dungeon_id}.json")

    with open(file_path, "w") as f:
        json.dump(dungeon_data, f)

    return {"message": "Dungeon saved successfully", "dungeon_id": dungeon_id}

# Endpoint: Load dungeon
@app.get("/load_dungeon/{dungeon_id}")
def load_dungeon(dungeon_id: int):
    file_path = os.path.join(SAVE_DIR, f"dungeon_{dungeon_id}.json")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Dungeon not found")

    with open(file_path, "r") as f:
        dungeon = json.load(f)

    return {"dungeon": dungeon}
