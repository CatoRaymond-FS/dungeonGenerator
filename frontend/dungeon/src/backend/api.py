from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model

app = FastAPI()

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend URL for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained AI model
model_path = "dungeon_generator_model.h5"
generator = load_model(model_path)

# AI Dungeon Generator Function
def generate_dungeon(rows=10, cols=10):
    noise = np.random.normal(0, 1, (1, 100))  # Generate random noise input
    dungeon_grid = generator.predict(noise).reshape(rows, cols)  # Get AI-generated dungeon

    # Convert dungeon grid values into readable symbols
    elements = [' ', 'R', 'T', 'B', 'D', 'H', 'W']  # Empty, Room, Trap, Boss, Door, Hallway, Wall
    dungeon = [[elements[int(cell * len(elements)) % len(elements)] for cell in row] for row in dungeon_grid]

    return dungeon

@app.get("/generate_dungeon")
def get_dungeon(rows: int = 10, cols: int = 10):
    dungeon = generate_dungeon(rows, cols)
    return {"dungeon": dungeon}

print("✅ AI-powered Dungeon API is running!")
