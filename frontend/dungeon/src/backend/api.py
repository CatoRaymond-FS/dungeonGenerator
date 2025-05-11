from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from tensorflow.keras.models import load_model
import json
import os
from collections import Counter
from math import log2

app = FastAPI()

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dungeon tile types
TILE_TYPES = [' ', 'R', 'T', 'B', 'D', 'H', 'W']

# Load AI model
try:
    model_path = "dungeon_generator_model.h5"
    generator = load_model(model_path)
except Exception as e:
    generator = None
    print(f"Failed to load model: {e}")

# Directory for saved dungeons
SAVE_DIR = "saved_dungeons"
os.makedirs(SAVE_DIR, exist_ok=True)


# Entropy calculation helper
def calculate_entropy(flat_grid):
    counts = Counter(flat_grid)
    total = len(flat_grid)
    entropy = -sum((count / total) * log2(count / total) for count in counts.values())
    return entropy


# Generate dungeon
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

    flat_grid = [cell for row in dungeon for cell in row]
    entropy = calculate_entropy(flat_grid)

    return dungeon, entropy


@app.get("/generate_dungeon")
def get_dungeon(rows: int = 10, cols: int = 10):
    try:
        dungeon, entropy = generate_dungeon(rows, cols)
        return {
            "dungeon": dungeon,
            "entropy": entropy
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/save_dungeon")
def save_dungeon(dungeon_data: dict):
    dungeon_id = len(os.listdir(SAVE_DIR)) + 1
    file_path = os.path.join(SAVE_DIR, f"dungeon_{dungeon_id}.json")

    with open(file_path, "w") as f:
        json.dump(dungeon_data, f)

    return {"message": "Dungeon saved successfully", "dungeon_id": dungeon_id}


@app.get("/load_dungeon/{dungeon_id}")
def load_dungeon(dungeon_id: int):
    file_path = os.path.join(SAVE_DIR, f"dungeon_{dungeon_id}.json")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Dungeon not found")

    with open(file_path, "r") as f:
        dungeon = json.load(f)

    return {"dungeon": dungeon}
