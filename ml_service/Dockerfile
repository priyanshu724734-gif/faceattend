FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies for OpenCV and InsightFace
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create a home directory for InsightFace models and set permissions
# Hugging Face Spaces runs as user 1000
RUN mkdir -p /home/user/.insightface && \
    chmod -R 777 /home/user

# Command to run the application
# We use port 7860 which is the default for Hugging Face Spaces
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
