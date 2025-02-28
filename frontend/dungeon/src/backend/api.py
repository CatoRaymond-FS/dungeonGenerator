from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import random

app = FastAPI()

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific origin (e.g., "http://localhost:3000") for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AI Dungeon Generator
def generate_dungeon(rows=10, cols=10):
    elements = ['R', 'T', 'B', 'D', 'H', 'W', ' ']
    dungeon = [[random.choice(elements) for _ in range(cols)] for _ in range(rows)]
    return dungeon

@app.get("/generate_dungeon")
def get_dungeon(rows: int = 10, cols: int = 10):
    dungeon = generate_dungeon(rows, cols)
    return {"dungeon": dungeon}
