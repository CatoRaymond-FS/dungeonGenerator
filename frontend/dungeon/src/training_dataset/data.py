import numpy as np
import pandas as pd

# Define dungeon parameters
num_samples = 1000  # Number of dungeons to generate
grid_size = (10, 10)
elements = [0, 1, 2, 3, 4, 5, 6]  # Dungeon features

# Function to generate a random dungeon
def generate_random_dungeon():
    return np.random.choice(elements, size=grid_size, replace=True)

# Generate dataset
dungeon_dataset = np.array([generate_random_dungeon().flatten() for _ in range(num_samples)])

# Save as CSV
df = pd.DataFrame(dungeon_dataset)
df.to_csv("synthetic_dungeon_dataset.csv", index=False)

print("Synthetic dungeon dataset generated and saved as 'synthetic_dungeon_dataset.csv'.")