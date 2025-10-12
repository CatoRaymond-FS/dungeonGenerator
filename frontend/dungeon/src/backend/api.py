from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import os
import json
import asyncio
from collections import Counter
from math import log2

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

    # Create a simple spanning path using DFS or randomized walk
    def carve_path(x, y, visited):
        visited.add((x, y))
        dungeon[y][x] = 'R' if np.random.rand() < 0.7 else 'H'  # mostly rooms
        directions = [(0,1),(1,0),(0,-1),(-1,0)]
        np.random.shuffle(directions)
        for dx, dy in directions:
            nx, ny = x + dx, y + dy
            if 0 <= nx < cols and 0 <= ny < rows and (nx, ny) not in visited:
                dungeon[ny][nx] = 'H'
                carve_path(nx, ny, visited)

    carve_path(0, 0, set())

    # Place doors, traps, and boss randomly
    for _ in range(max(1, rows * cols // 20)):
        x, y = np.random.randint(0, cols), np.random.randint(0, rows)
        dungeon[y][x] = np.random.choice(['D','T','B'], p=[0.5,0.4,0.1])

    return dungeon

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
# WebSocket Endpoint for live generation
# --------------------------
@app.websocket("/ws/generate_dungeon")
async def websocket_generate(websocket: WebSocket):
    await websocket.accept()
    try:
        total_steps = 5
        for step in range(total_steps):
            dungeon = generate_connected_dungeon()
            flat_grid = [cell for row in dungeon for cell in row]
            entropy = calculate_entropy(flat_grid)
            noise_sample = np.random.normal(0, 1, 10).tolist()  # simulate first 10 noise values

            await websocket.send_json({
                "step": step + 1,
                "total_steps": total_steps,
                "dungeon": dungeon,
                "ai_info": {
                    "model": "procedural_connected",
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
