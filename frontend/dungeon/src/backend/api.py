from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import json
import os

app = FastAPI()

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained AI model
model_path = "dungeon_generator_model.h5"
generator = load_model(model_path)

# Directory for saving dungeons
SAVE_DIR = "saved_dungeons"
os.makedirs(SAVE_DIR, exist_ok=True)

# AI Dungeon Generator Function
def generate_dungeon(rows=10, cols=10):
    noise = np.random.normal(0, 1, (1, 100))
    dungeon_grid = generator.predict(noise).reshape(rows, cols)

    elements = [' ', 'R', 'T', 'B', 'D', 'H', 'W']
    dungeon = [[elements[int(cell * len(elements)) % len(elements)] for cell in row] for row in dungeon_grid]
    
    return dungeon

@app.get("/generate_dungeon")
def get_dungeon(rows: int = 10, cols: int = 10):
    dungeon = generate_dungeon(rows, cols)
    return {"dungeon": dungeon}

@app.post("/save_dungeon")
def save_dungeon(dungeon_data: dict):
    dungeon_id = len(os.listdir(SAVE_DIR)) + 1
    dungeon_path = os.path.join(SAVE_DIR, f"dungeon_{dungeon_id}.json")

    with open(dungeon_path, "w") as file:
        json.dump(dungeon_data, file)

    return {"message": "Dungeon saved successfully", "dungeon_id": dungeon_id}

@app.get("/load_dungeon/{dungeon_id}")
def load_dungeon(dungeon_id: int):
    dungeon_path = os.path.join(SAVE_DIR, f"dungeon_{dungeon_id}.json")

    if not os.path.exists(dungeon_path):
        raise HTTPException(status_code=404, detail="Dungeon not found")

    with open(dungeon_path, "r") as file:
        dungeon_data = json.load(file)

    return {"dungeon": dungeon_data}
