# Use a lightweight Python image
FROM python:3.11-slim

# Set working directory inside container
WORKDIR /app

# Copy your backend code into the container
COPY frontend/dungeon/src/backend ./backend

# Copy your requirements.txt (adjust path if necessary)
COPY frontend/dungeon/src/backend/requirements.txt ./backend/requirements.txt

# Install dependencies
RUN pip install --upgrade pip
RUN pip install -r backend/requirements.txt

# Expose the port for FastAPI
EXPOSE 8000

# Set the working directory to backend
WORKDIR /app/backend

# Start the FastAPI app
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
