from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from tensorflow.keras.models import load_model
from collections import Counter
from math import log2
import os
import json
import asyncio

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
# Tile types and directories
# --------------------------
TILE_TYPES = [' ', 'R', 'T', 'B', 'D', 'H', 'W']
MODEL_PATH = "dungeon_generator_model.h5"
SAVE_DIR = "saved_dungeons"
os.makedirs(SAVE_DIR, exist_ok=True)

# --------------------------
# Load generator model
# --------------------------
if os.path.exists(MODEL_PATH):
    generator = load_model(MODEL_PATH)
    print(f"✅ Loaded generator from {MODEL_PATH}")
else:
    generator = None
    print("⚠️ No generator model found. AI dungeon generation disabled.")

# --------------------------
# Helpers
# --------------------------
def calculate_entropy(flat_grid):
    counts = Counter(flat_grid)
    total = len(flat_grid)
    entropy = -sum((count / total) * log2(count / total) for count in counts.values() if count > 0)
    return entropy

def map_to_tiles(output_grid):
    flat = output_grid.reshape(-1)
    indices = (flat * len(TILE_TYPES)).astype(int) % len(TILE_TYPES)
    tiles = [TILE_TYPES[i] for i in indices]
    dungeon = [tiles[i*10:(i+1)*10] for i in range(10)]
    return dungeon

def generate_dungeon_step():
    if generator is None:
        raise RuntimeError("AI generator model not loaded.")
    noise_dim = 100
    noise = np.random.normal(0, 1, (1, noise_dim))
    generated = generator.predict(noise)
    dungeon = map_to_tiles(generated[0])
    flat_grid = [cell for row in dungeon for cell in row]
    entropy = calculate_entropy(flat_grid)
    return dungeon, entropy, noise.tolist()

# --------------------------
# REST Endpoints
# --------------------------
@app.get("/generate_dungeon")
def get_dungeon():
    try:
        dungeon, entropy, _ = generate_dungeon_step()
        return {"dungeon": dungeon, "entropy": entropy}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/generate_dungeon_debug")
def get_dungeon_debug():
    try:
        dungeon, entropy, noise_sample = generate_dungeon_step()
        return {
            "dungeon": dungeon,
            "ai_info": {
                "model": MODEL_PATH,
                "entropy_estimate": entropy,
                "input_noise_sample": noise_sample[:10]
            }
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

# --------------------------
# WebSocket Endpoint for live AI generation
# --------------------------
@app.websocket("/ws/generate_dungeon")
async def websocket_generate(websocket: WebSocket):
    await websocket.accept()
    try:
        if generator is None:
            await websocket.send_json({"error": "AI generator model not loaded"})
            return

        total_steps = 5
        for step in range(total_steps):
            dungeon, entropy, noise = generate_dungeon_step()
            noise_sample = noise[0][:10] if isinstance(noise, list) else []

            await websocket.send_json({
                "step": step + 1,
                "total_steps": total_steps,
                "dungeon": dungeon,
                "ai_info": {
                    "model": MODEL_PATH,
                    "entropy_estimate": entropy,
                    "input_noise_sample": noise_sample
                }
            })
            await asyncio.sleep(0.5)  # simulate generation delay

        await websocket.send_json({"done": True})

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print("WebSocket error:", e)
        await websocket.close()
