import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.models import load_model
import os

# --------------------------
# Load synthetic dungeon dataset
# --------------------------
df = pd.read_csv("../training_dataset/synthetic_dungeon_dataset.csv")

# Map tile letters to numbers
tile_map = {" ": 0, "R": 1, "T": 2, "B": 3, "D": 4, "H": 5}

# Convert CSV to numeric array
numeric_data = df.applymap(lambda x: tile_map.get(x, 0)).values.astype("float32")
dungeon_data = numeric_data.reshape((-1, 10, 10, 1))  # Add channel dimension

# Normalize data (0-1 range)
dungeon_data = dungeon_data / 6.0

# Optional: conditional input (e.g., number of rooms)
use_condition = False
condition_dim = 1  # Example: number of rooms

# --------------------------
# Build Generator
# --------------------------
def build_generator(noise_dim=100):
    noise_input = layers.Input(shape=(noise_dim,))
    
    if use_condition:
        condition_input = layers.Input(shape=(condition_dim,))
        x = layers.Concatenate()([noise_input, condition_input])
    else:
        x = noise_input

    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dense(10 * 10, activation="relu")(x)
    x = layers.Reshape((10, 10, 1))(x)

    x = layers.Conv2DTranspose(64, kernel_size=3, strides=1, padding='same', activation="relu")(x)
    x = layers.Conv2DTranspose(32, kernel_size=3, strides=1, padding='same', activation="relu")(x)
    output = layers.Conv2D(1, kernel_size=3, padding='same', activation="sigmoid")(x)

    if use_condition:
        return keras.Model([noise_input, condition_input], output)
    else:
        return keras.Model(noise_input, output)

# --------------------------
# Build Discriminator
# --------------------------
def build_discriminator():
    dungeon_input = layers.Input(shape=(10, 10, 1))
    x = layers.Conv2D(32, kernel_size=3, strides=1, padding='same', activation="relu")(dungeon_input)
    x = layers.Conv2D(64, kernel_size=3, strides=1, padding='same', activation="relu")(x)
    x = layers.Flatten()(x)
    x = layers.Dense(128, activation="relu")(x)
    
    if use_condition:
        condition_input = layers.Input(shape=(condition_dim,))
        x = layers.Concatenate()([x, condition_input])

    output = layers.Dense(1, activation="sigmoid")(x)

    if use_condition:
        return keras.Model([dungeon_input, condition_input], output)
    else:
        return keras.Model(dungeon_input, output)

# --------------------------
# Load or initialize models
# --------------------------
if os.path.exists("dungeon_generator_checkpoint.h5"):
    generator = load_model("dungeon_generator_checkpoint.h5")
    print("✅ Loaded generator checkpoint")
else:
    generator = build_generator()
    print("⚠️ No generator checkpoint, starting from scratch")

discriminator = build_discriminator()
discriminator.compile(loss="binary_crossentropy", optimizer="adam", metrics=["accuracy"])
discriminator.trainable = False

# --------------------------
# Build GAN
# --------------------------
noise_dim = 100
if use_condition:
    noise_input = layers.Input(shape=(noise_dim,))
    condition_input = layers.Input(shape=(condition_dim,))
    fake_dungeon = generator([noise_input, condition_input])
    validity = discriminator([fake_dungeon, condition_input])
    gan = keras.Model([noise_input, condition_input], validity)
else:
    noise_input = layers.Input(shape=(noise_dim,))
    fake_dungeon = generator(noise_input)
    validity = discriminator(fake_dungeon)
    gan = keras.Model(noise_input, validity)

gan.compile(loss="binary_crossentropy", optimizer="adam")

# --------------------------
# Training Loop
# --------------------------
def train_gan(epochs=1000, batch_size=32):
    for epoch in range(epochs):
        # ----------------------
        # Train Discriminator
        # ----------------------
        idx = np.random.randint(0, dungeon_data.shape[0], batch_size)
        real_dungeons = dungeon_data[idx]

        noise = np.random.normal(0, 1, (batch_size, noise_dim))
        if use_condition:
            cond = np.random.rand(batch_size, condition_dim)
            generated_dungeons = generator.predict([noise, cond])
            d_loss_real = discriminator.train_on_batch([real_dungeons, cond], np.ones((batch_size, 1)))
            d_loss_fake = discriminator.train_on_batch([generated_dungeons, cond], np.zeros((batch_size, 1)))
        else:
            generated_dungeons = generator.predict(noise)
            d_loss_real = discriminator.train_on_batch(real_dungeons, np.ones((batch_size, 1)))
            d_loss_fake = discriminator.train_on_batch(generated_dungeons, np.zeros((batch_size, 1)))

        d_loss = 0.5 * (d_loss_real[0] + d_loss_fake[0])
        d_acc = 0.5 * (d_loss_real[1] + d_loss_fake[1])

        # ----------------------
        # Train Generator
        # ----------------------
        noise = np.random.normal(0, 1, (batch_size, noise_dim))
        if use_condition:
            cond = np.random.rand(batch_size, condition_dim)
            g_loss = gan.train_on_batch([noise, cond], np.ones((batch_size, 1)))
        else:
            g_loss = gan.train_on_batch(noise, np.ones((batch_size, 1)))

        # ----------------------
        # Print progress
        # ----------------------
        print(f"Epoch {epoch+1}/{epochs} | D Loss: {d_loss:.4f}, D Acc: {d_acc:.4f} | G Loss: {g_loss:.4f}")

        # ----------------------
        # Save checkpoint
        # ----------------------
        if (epoch + 1) % 500 == 0:
            generator.save("dungeon_generator_checkpoint.h5")
            print(f"💾 Generator checkpoint saved at epoch {epoch+1}")

    generator.save("dungeon_generator_model.h5")
    print("🎉 GAN training complete, model saved as 'dungeon_generator_model.h5'")

# --------------------------
# Start training
# --------------------------
train_gan()
