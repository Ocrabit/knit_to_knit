# Base image
FROM python:3.12-slim AS base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements/prod.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]

# Copy application code
COPY . .

# Collect static files
# Check if the .env file is present
# Add this debug step to check the .env file
RUN echo "Checking .env file..." && \
    ls -l /app/.env && \
    cat /app/.env || echo ".env not found" \


# Collect static files
RUN python manage.py collectstatic --noinput
# Ensure the STATIC_ROOT directory exists and is writable
RUN mkdir -p /app/staticfiles && chmod -R 755 /app/staticfiles

# Expose port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Entry point
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]