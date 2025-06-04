# Use Python 3.9 slim as base image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # Audio processing dependencies
    libsndfile1 \
    libsndfile1-dev \
    libffi-dev \
    libssl-dev \
    # PortAudio for pyaudio
    portaudio19-dev \
    libportaudio2 \
    # ALSA for audio
    libasound2-dev \
    # FFmpeg for audio conversion
    ffmpeg \
    # Build tools
    gcc \
    g++ \
    make \
    pkg-config \
    # PocketSphinx dependencies
    libpulse-dev \
    swig \
    # Additional audio libraries
    libflac-dev \
    libogg-dev \
    libvorbis-dev \
    libopus-dev \
    # Utilities
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

# Download NLTK data for TextBlob
RUN python -c "import nltk; nltk.download('punkt'); nltk.download('brown')"

# Create necessary directories
RUN mkdir -p /app/models /app/temp_uploads /app/utils /app/logs

# Copy application code
COPY audio_analysis_service.py .
COPY utils/ ./utils/

# Create a non-root user
RUN useradd --create-home --shell /bin/bash interviewx && \
    chown -R interviewx:interviewx /app

# Switch to non-root user
USER interviewx

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5002/health || exit 1

# Expose port
EXPOSE 5002

# Set default environment variables
ENV HOST=0.0.0.0 \
    PORT=5002 \
    DEBUG=false

# Run the application
CMD ["python", "audio_analysis_service.py"]