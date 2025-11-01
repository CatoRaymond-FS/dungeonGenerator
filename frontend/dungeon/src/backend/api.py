from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import os
import json
import asyncio
from collections import Counter
from math import log2
from tensorflow.keras.models import load_model

app = FastAPI()

# --------------------------
# CORS config
# --------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------
# Tile types
# --------------------------
TILE_TYPES = [' ', 'R', 'T', 'B', 'D', 'H']  # corresponds to indices 0-5
tile_map = {i: t for i, t in enumerate(TILE_TYPES)}

SAVE_DIR = "saved_dungeons"
os.makedirs(SAVE_DIR, exist_ok=True)

# --------------------------
# Helpers
# --------------------------
def calculate_entropy(flat_grid):
    counts = Counter(flat_grid)
    total = len(flat_grid)
    entropy = -sum((count / total) * log2(count / total) for count in counts.values() if count > 0)
    return entropy

# --------------------------
# Load GAN generator
# --------------------------
GENERATOR_PATH = "dungeon_generator_checkpoint.h5"
if os.path.exists(GENERATOR_PATH):
    generator = load_model(GENERATOR_PATH)
    print("✅ Loaded GAN generator")
else:
    raise RuntimeError(f"Generator model not found at {GENERATOR_PATH}")

def generate_ai_dungeon():
    """Generate a 10x10 dungeon using the trained GAN"""
    noise = np.random.normal(0,1,(1,100))  # matches noise_dim
    pred = generator.predict(noise)[0,...,0]  # shape (10,10)
    # convert output 0-1 to 0-5 integer tile indices
    pred_int = np.clip((pred*6).astype(int), 0, 5)
    dungeon = [[tile_map[val] for val in row] for row in pred_int]
    return dungeon

# --------------------------
# REST Endpoints
# --------------------------
@app.get("/generate_dungeon")
def get_dungeon():
    try:
        dungeon = generate_ai_dungeon()
        flat_grid = [cell for row in dungeon for cell in row]
        entropy = calculate_entropy(flat_grid)
        return {"dungeon": dungeon, "entropy": entropy, "model": "GAN"}
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

# --------------------------
# WebSocket Endpoint for live generation
# --------------------------
@app.websocket("/ws/generate_dungeon")
async def websocket_generate(websocket: WebSocket):
    await websocket.accept()
    try:
        total_steps = 5
        for step in range(total_steps):
            dungeon = generate_ai_dungeon()
            flat_grid = [cell for row in dungeon for cell in row]
            entropy = calculate_entropy(flat_grid)
            noise_sample = np.random.normal(0,1,10).tolist()

            await websocket.send_json({
                "step": step + 1,
                "total_steps": total_steps,
                "dungeon": dungeon,
                "ai_info": {
                    "model": "GAN",
                    "entropy_estimate": entropy,
                    "input_noise_sample": noise_sample
                }
            })
            await asyncio.sleep(0.5)

        await websocket.send_json({"done": True})

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print("WebSocket error:", e)
        await websocket.close()