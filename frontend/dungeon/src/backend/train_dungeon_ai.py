import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.models import load_model
import os

# Load synthetic dungeon dataset
df = pd.read_csv("../training_dataset/synthetic_dungeon_dataset.csv")
dungeon_data = df.values.reshape((-1, 10, 10))  # Reshape into 10x10 grids

# Normalize data (0-1 range)
dungeon_data = dungeon_data / 6.0

# Define Generator Model
def build_generator():
    model = keras.Sequential([
        layers.Input(shape=(100,)),
        layers.Dense(128, activation="relu"),
        layers.Dense(256, activation="relu"),
        layers.Dense(512, activation="relu"),
        layers.Dense(10 * 10, activation="sigmoid"),
        layers.Reshape((10, 10))
    ])
    return model

# Define Discriminator Model
def build_discriminator():
    model = keras.Sequential([
        layers.Input(shape=(10, 10)),
        layers.Flatten(),
        layers.Dense(512, activation="relu"),
        layers.Dense(256, activation="relu"),
        layers.Dense(1, activation="sigmoid")
    ])
    return model

# Load existing model if it exists, otherwise create a new one
if os.path.exists("dungeon_generator_checkpoint.h5"):
    generator = load_model("dungeon_generator_checkpoint.h5")
    print("✅ Loaded model checkpoint, resuming training...")
else:
    generator = build_generator()
    print("⚠️ No checkpoint found, training from scratch.")

# Create Discriminator
discriminator = build_discriminator()

# Compile Discriminator FIRST
discriminator.compile(loss="binary_crossentropy", optimizer="adam", metrics=["accuracy"])

# THEN Set Discriminator as non-trainable
discriminator.trainable = False

# Build GAN Model
gan_input = keras.Input(shape=(100,))
generated_map = generator(gan_input)
validity = discriminator(generated_map)
gan = keras.Model(gan_input, validity)
gan.compile(loss="binary_crossentropy", optimizer="adam")

# Training Function with Checkpoints
def train_gan(epochs=1000, batch_size=32):
    for epoch in range(epochs):
        # Select random real dungeons
        idx = np.random.randint(0, dungeon_data.shape[0], batch_size)
        real_dungeons = dungeon_data[idx]

        # Generate fake dungeons
        noise = np.random.normal(0, 1, (batch_size, 100))
        generated_dungeons = generator.predict(noise)

        # Train Discriminator
        d_loss_real = discriminator.train_on_batch(real_dungeons, np.ones((batch_size, 1)))
        d_loss_fake = discriminator.train_on_batch(generated_dungeons, np.zeros((batch_size, 1)))
        d_loss = [0.5 * (d_loss_real[0] + d_loss_fake[0]), 0.5 * (d_loss_real[1] + d_loss_fake[1])]

        # Train Generator
        noise = np.random.normal(0, 1, (batch_size, 100))
        g_loss = gan.train_on_batch(noise, np.ones((batch_size, 1)))

        print(f"Epoch {epoch}/{epochs} | D Loss: {d_loss[0]:.4f}, D Acc: {d_loss[1]:.4f} | G Loss: {g_loss[0]:.4f}")

        # ✅ Save model every 500 epochs
        if epoch % 500 == 0 and epoch > 0:
            generator.save("dungeon_generator_checkpoint.h5")
            print(f"💾 Checkpoint saved at epoch {epoch}")

    # Save final model
    generator.save("dungeon_generator_model.h5")
    print("🎉 Final model training complete and saved as 'dungeon_generator_model.h5'")

# Train the GAN
train_gan()
