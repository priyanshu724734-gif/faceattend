FROM python:3.9

# Set root for system installations
USER root

# Install system dependencies for OpenCV and InsightFace
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set up a new user named "user" with user ID 1000
RUN useradd -m -u 1000 user

# Switch to the new user
USER user

# Set environment variables
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Set working directory
WORKDIR /app

# Copy requirements and install as user
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy the rest of the application files
COPY --chown=user . .

# InsightFace downloads models to ~/.insightface. Provide a writable home.
RUN mkdir -p /home/user/.insightface

# Command to run the application
# Hugging Face Spaces provides the port via the PORT environment variable (default 7860)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
