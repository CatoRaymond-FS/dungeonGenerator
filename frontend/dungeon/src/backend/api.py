import os
import json
import asyncio
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.models import load_model
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from collections import Counter
from math import log2

# --------------------------
# FastAPI setup
# --------------------------
app = FastAPI()
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
TILE_TYPES = [' ', 'R', 'T', 'B', 'D', 'H']  # removed 'W'
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

def generate_connected_dungeon(rows=10, cols=10):
    dungeon = [[' ' for _ in range(cols)] for _ in range(rows)]

    def carve_path(x, y, visited):
        visited.add((x, y))
        dungeon[y][x] = 'R' if np.random.rand() < 0.7 else 'H'
        directions = [(0,1),(1,0),(0,-1),(-1,0)]
        np.random.shuffle(directions)
        for dx, dy in directions:
            nx, ny = x+dx, y+dy
            if 0 <= nx < cols and 0 <= ny < rows and (nx, ny) not in visited:
                dungeon[ny][nx] = 'H'
                carve_path(nx, ny, visited)

    carve_path(0, 0, set())

    # Random doors, traps, boss
    for _ in range(max(1, rows*cols // 20)):
        x, y = np.random.randint(0, cols), np.random.randint(0, rows)
        dungeon[y][x] = np.random.choice(['D','T','B'], p=[0.5,0.4,0.1])

    return dungeon

def resize_dungeon(dungeon_tensor, target_rows, target_cols):
    dungeon_tensor = tf.expand_dims(dungeon_tensor, 0)  # add batch dim
    dungeon_tensor = tf.image.resize(dungeon_tensor, (target_rows, target_cols), method='nearest')
    return tf.squeeze(dungeon_tensor, 0).numpy().tolist()

# --------------------------
# Load synthetic dataset (safe path handling)
# --------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "../training_dataset/synthetic_dungeon_dataset.csv")

if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(f"Training dataset not found at {DATA_PATH}")

df = pd.read_csv(DATA_PATH)

tile_map = {" ": 0, "R": 1, "T": 2, "B": 3, "D": 4, "H": 5}
numeric_data = df.applymap(lambda x: tile_map.get(x, 0)).values.astype("float32")
dungeon_data = numeric_data.reshape((-1, 10, 10, 1)) / 6.0  # normalized

# --------------------------
# Build flexible GAN generator
# --------------------------
def build_generator_conv(noise_dim=100, channels=1):
    noise_input = layers.Input(shape=(noise_dim,))
    x = layers.Dense(128*4*4, activation="relu")(noise_input)
    x = layers.Reshape((4, 4, 128))(x)

    # Upsample layers
    x = layers.Conv2DTranspose(128, 4, strides=2, padding='same', activation="relu")(x)  # 8x8
    x = layers.Conv2DTranspose(64, 4, strides=2, padding='same', activation="relu")(x)   # 16x16
    x = layers.Conv2DTranspose(32, 4, strides=2, padding='same', activation="relu")(x)   # 32x32

    output = layers.Conv2D(channels, 3, padding='same', activation="sigmoid")(x)
    return keras.Model(noise_input, output)

# --------------------------
# Load or build GAN
# --------------------------
generator_path = "dungeon_generator_checkpoint.h5"
if os.path.exists(generator_path):
    generator = load_model(generator_path, compile=False)
    print("✅ Loaded GAN generator")
else:
    generator = build_generator_conv()
    print("⚠️ No generator checkpoint, starting from scratch")

# --------------------------
# REST Endpoints
# --------------------------
@app.get("/generate_dungeon")
def get_dungeon(rows: int = 10, cols: int = 10):
    try:
        dungeon = generate_connected_dungeon(rows, cols)
        flat_grid = [cell for row in dungeon for cell in row]
        entropy = calculate_entropy(flat_grid)
        return {"dungeon": dungeon, "entropy": entropy}
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
# WebSocket for live GAN generation
# --------------------------
@app.websocket("/ws/generate_dungeon")
async def websocket_generate(websocket: WebSocket, rows: int = Query(10), cols: int = Query(10)):
    await websocket.accept()
    try:
        total_steps = 5
        for step in range(total_steps):
            noise = np.random.normal(0, 1, (1, 100))
            dungeon_tensor = generator.predict(noise)[0, :, :, 0]

            # Resize and discretize
            dungeon_resized = resize_dungeon(dungeon_tensor, rows, cols)
            dungeon_discrete = []
            for row in dungeon_resized:
                dungeon_row = []
                for val in row:
                    idx = min(int(val * len(TILE_TYPES)), len(TILE_TYPES) - 1)
                    dungeon_row.append(TILE_TYPES[idx])
                dungeon_discrete.append(dungeon_row)

            flat_grid = [cell for row in dungeon_discrete for cell in row]
            entropy = calculate_entropy(flat_grid)

            await websocket.send_json({
                "step": step + 1,
                "total_steps": total_steps,
                "dungeon": dungeon_discrete,
                "ai_info": {
                    "model": "gan_flexible",
                    "entropy_estimate": entropy,
                    "input_noise_sample": noise[0].tolist()
                }
            })
            await asyncio.sleep(0.5)

        await websocket.send_json({"done": True})

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print("WebSocket error:", e)
        await websocket.close()
