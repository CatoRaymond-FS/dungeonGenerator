# --------------------------
# Base image
# --------------------------
FROM python:3.11-slim

# --------------------------
# Install system dependencies
# --------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# --------------------------
# Set working directory
# --------------------------
WORKDIR /app

# --------------------------
# Copy backend code
# --------------------------
COPY frontend/dungeon/src/backend ./backend
COPY frontend/dungeon/src/backend/requirements.txt ./backend/requirements.txt

# ✅ NEW: Copy your training dataset into the container
COPY frontend/dungeon/src/training_dataset ./training_dataset

# --------------------------
# Upgrade pip and install dependencies
# --------------------------
RUN pip install --upgrade pip setuptools wheel

# Install TensorFlow CPU + FastAPI dependencies
RUN pip install "tensorflow-cpu>=2.15.0" uvicorn[standard] fastapi numpy pandas

# Install other Python dependencies from requirements.txt
RUN pip install -r backend/requirements.txt

# --------------------------
# Expose FastAPI port
# --------------------------
EXPOSE 8000

# --------------------------
# Start FastAPI
# --------------------------
WORKDIR /app/backend
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]