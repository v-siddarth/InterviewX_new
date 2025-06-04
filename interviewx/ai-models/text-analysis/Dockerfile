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
    # Build tools
    gcc \
    g++ \
    make \
    # Network tools
    curl \
    wget \
    # Additional utilities
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

# Download spaCy English model
RUN python -m spacy download en_core_web_sm

# Download NLTK data
RUN python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True); nltk.download('wordnet', quiet=True); nltk.download('averaged_perceptron_tagger', quiet=True); nltk.download('maxent_ne_chunker', quiet=True); nltk.download('words', quiet=True); nltk.download('omw-1.4', quiet=True)"

# Download TextBlob corpora
RUN python -c "import textblob; textblob.download_corpora()"

# Create necessary directories
RUN mkdir -p /app/models /app/utils /app/logs

# Copy application code
COPY text_analysis_service.py .
COPY utils/ ./utils/

# Create a non-root user
RUN useradd --create-home --shell /bin/bash interviewx && \
    chown -R interviewx:interviewx /app

# Switch to non-root user
USER interviewx

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5003/health || exit 1

# Expose port
EXPOSE 5003

# Set default environment variables
ENV HOST=0.0.0.0 \
    PORT=5003 \
    DEBUG=false \
    GEMINI_API_KEY=""

# Run the application
CMD ["python", "text_analysis_service.py"]