# Base image
FROM python:3.12-slim AS django

WORKDIR /app

# Install system dependencies and Python dependencies
RUN apt-get update && apt-get install -y build-essential gcc libpq-dev bash

# Copy the requirements file and install dependencies
COPY requirements/prod.txt ./requirements/dev.txt
# Use a development-specific requirements file
RUN pip install -r ./requirements/dev.txt

# Add a debugging step to verify Django is installed
RUN pip show Django
RUN pip list  # Debugging step to check installed packages

# Set PYTHONPATH explicitly to ensure Python can find Django
ENV PYTHONPATH=/app

# Copy the Django app (this includes manage.py)
COPY . .

# Expose Django port
EXPOSE 8000

# Command to run the Django development server in development mode
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]