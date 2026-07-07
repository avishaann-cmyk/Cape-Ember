#!/bin/bash

# Cape Ember Coffee Co. - Backup Script
# Backs up MongoDB database to a timestamped archive

set -e

# Configuration
BACKUP_DIR="${1:-.}/backups"
RETENTION_DAYS="${2:-30}"
ENVIRONMENT="${3:-production}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="cape-ember-backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup to ${BACKUP_PATH}..."

# Backup MongoDB
docker exec cape-ember-mongodb-prod mongodump \
    --authenticationDatabase admin \
    -u ${MONGO_USER} \
    -p ${MONGO_PASSWORD} \
    --out "${BACKUP_PATH}" \
    2>&1

# Compress backup
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Compressing backup..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"

# Calculate size
BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completed: ${BACKUP_SIZE}"

# Clean old backups
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "cape-ember-backup_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup finished successfully"
