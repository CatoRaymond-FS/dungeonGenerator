# Use a lightweight Python image
FROM python:3.11-slim

# Install build dependencies (some Python packages need this)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside container
WORKDIR /app

# Copy your backend code into the container
COPY frontend/dungeon/src/backend ./backend

# Copy your requirements.txt
COPY frontend/dungeon/src/backend/requirements.txt ./backend/requirements.txt

# Upgrade pip and install dependencies
RUN pip install --upgrade pip
RUN pip install -r backend/requirements.txt

# Expose the port for FastAPI
EXPOSE 8000

# Set working directory to backend
WORKDIR /app/backend

# Start the FastAPI app with proper flags for Railway WebSocket support
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
