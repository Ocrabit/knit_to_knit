#!/bin/bash

# Database Backup Script
# Backs up PostgreSQL database and uploads to S3

# Get cur dir
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env from cur dir
ENV_FILE="$SCRIPT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' $ENV_FILE | xargs)
fi

# Set variables with defaults from environment or fallback values
BACKUP_DIR="${BACKUP_DIR:-/home/ec2-user/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="backup_${TIMESTAMP}.sql.gz"
LATEST_FILE="$BACKUP_DIR/latest_backup.sql"
S3_BUCKET="${AWS_STORAGE_BUCKET_NAME}"
CONTAINER_NAME="${POSTGRES_CONTAINER}"
DB_NAME="${POSTGRES_DB}"
DB_USER="${POSTGRES_USER}"

# Validate required variables
if [ -z "$S3_BUCKET" ]; then
    echo "ERROR: S3_BUCKET environment variable is not set in .env"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "ERROR: AWS credentials not configured or invalid"
    echo "Run 'aws configure' to set up credentials"
    exit 1
fi

# Existence check
mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $(date)"

docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/$BACKUP_FILE"

if [ $? -ne 0 ]; then
    echo "ERROR: Database backup failed"
    exit 1
fi
echo "Database backup created: $BACKUP_FILE"

UPLOAD_NEEDED=true

if [ -f "$LATEST_FILE" ]; then
    # Compare checksums
    NEW_CHECKSUM=$(grep -v '^\\restrict' "$BACKUP_DIR/$BACKUP_FILE" | grep -v '^\\unrestrict' | md5sum | awk '{print $1}')
    OLD_CHECKSUM=$(grep -v '^\\restrict' "$LATEST_FILE" | grep -v '^\\unrestrict' | md5sum | awk '{print $1}')

    if [ "$NEW_CHECKSUM" == "$OLD_CHECKSUM" ]; then
          echo "No changes detected - skipping S3 upload"
          UPLOAD_NEEDED=false
          # Remove the duplicate backup
          rm "$BACKUP_DIR/$BACKUP_FILE"
      else
          echo "Changes detected - will upload to S3"
    fi
else
  echo "First backup - will upload to S3"
fi

# Upload to S3 if changes detected
if [ "$UPLOAD_NEEDED" = true ]; then
    gzip -c "$BACKUP_DIR/$BACKUP_FILE" > "$BACKUP_DIR/$BACKUP_FILE_GZ"

    aws s3 cp "$BACKUP_DIR/$BACKUP_FILE_GZ" "s3://$S3_BUCKET/database-backups/"

    if [ $? -eq 0 ]; then
        echo "Backup uploaded to S3 successfully"
        cp "$BACKUP_DIR/$BACKUP_FILE" "$LATEST_FILE"  # Update latest
        rm "$BACKUP_DIR/$BACKUP_FILE"  # clean up

        # Keep only last 7 days of timestamped local backups
        find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete
        echo "Cleaned up old local backups (older than 7 days)"
    else
        echo "ERROR: Failed to upload backup to S3"
        exit 1
    fi
fi

echo "Backup completed at $(date)"