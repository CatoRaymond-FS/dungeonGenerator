import numpy as np
import pandas as pd
from collections import deque

# Dungeon parameters
NUM_SAMPLES = 1000
GRID_SIZE = (10, 10)
ROOM_MAX_SIZE = 4
ROOM_MIN_SIZE = 2
MAX_ROOMS = 3
NUM_FEATURES = 5

# Tile mapping (no walls)
TILE_MAPPING = {
    "EMPTY": ' ',
    "ROOM": 'R',
    "TRAP": 'T',
    "BOSS": 'B',
    "DOOR": 'D',
    "HALLWAY": 'H'
}

FEATURE_TILES = ['T', 'B', 'D']

# Generate dungeon with rooms
def generate_room_dungeon(grid_size=GRID_SIZE, max_rooms=MAX_ROOMS):
    dungeon = np.full(grid_size, TILE_MAPPING["EMPTY"], dtype=str)
    rooms = []

    for _ in range(max_rooms):
        w, h = np.random.randint(ROOM_MIN_SIZE, ROOM_MAX_SIZE+1, size=2)
        x, y = np.random.randint(0, grid_size[0]-w), np.random.randint(0, grid_size[1]-h)
        dungeon[x:x+w, y:y+h] = TILE_MAPPING["ROOM"]
        rooms.append((x, y, w, h))

    # Connect rooms with hallways
    room_centers = [(x + w//2, y + h//2) for (x, y, w, h) in rooms]
    for i in range(len(room_centers)-1):
        x1, y1 = room_centers[i]
        x2, y2 = room_centers[i+1]
        # Horizontal then vertical hallway
        for xx in range(min(x1, x2), max(x1, x2)+1):
            if dungeon[xx, y1] == TILE_MAPPING["EMPTY"]:
                dungeon[xx, y1] = TILE_MAPPING["HALLWAY"]
        for yy in range(min(y1, y2), max(y1, y2)+1):
            if dungeon[x2, yy] == TILE_MAPPING["EMPTY"]:
                dungeon[x2, yy] = TILE_MAPPING["HALLWAY"]

    return dungeon

# Add random features to room or hallway tiles
def add_features(dungeon, num_features=NUM_FEATURES):
    walkable = np.argwhere(np.isin(dungeon, [TILE_MAPPING["ROOM"], TILE_MAPPING["HALLWAY"]]))
    for _ in range(num_features):
        if len(walkable) == 0:
            break
        idx = np.random.randint(len(walkable))
        x, y = walkable[idx]
        dungeon[x, y] = np.random.choice(FEATURE_TILES)
    return dungeon

# Check connectivity
def is_fully_connected(dungeon):
    walkable = np.argwhere(np.isin(dungeon, [TILE_MAPPING["ROOM"], TILE_MAPPING["HALLWAY"]] + FEATURE_TILES))
    if len(walkable) == 0:
        return False

    start = tuple(walkable[0])
    visited = np.zeros(dungeon.shape, dtype=bool)
    queue = deque([start])
    visited[start] = True

    while queue:
        x, y = queue.popleft()
        for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
            nx, ny = x+dx, y+dy
            if 0 <= nx < dungeon.shape[0] and 0 <= ny < dungeon.shape[1]:
                if not visited[nx, ny] and dungeon[nx, ny] in [TILE_MAPPING["ROOM"], TILE_MAPPING["HALLWAY"]] + FEATURE_TILES:
                    visited[nx, ny] = True
                    queue.append((nx, ny))

    return np.all(visited[np.isin(dungeon, [TILE_MAPPING["ROOM"], TILE_MAPPING["HALLWAY"]] + FEATURE_TILES)])

# Generate a fully connected dungeon
def generate_connected_dungeon():
    while True:
        dungeon = generate_room_dungeon()
        dungeon = add_features(dungeon)
        if is_fully_connected(dungeon):
            return dungeon

# Generate dataset
def generate_dungeon_dataset(num_samples=NUM_SAMPLES):
    dataset = []
    for _ in range(num_samples):
        d = generate_connected_dungeon()
        dataset.append(d.tolist())
    return dataset

if __name__ == "__main__":
    dungeon_dataset = generate_dungeon_dataset()
    df = pd.DataFrame([np.array(d).flatten() for d in dungeon_dataset])
    df.to_csv("synthetic_dungeon_dataset.csv", index=False)
    print("Dungeon dataset saved as 'synthetic_dungeon_dataset.csv'. Tiles are compatible with App.js (no walls).")
