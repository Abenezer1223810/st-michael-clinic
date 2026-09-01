#!/bin/bash
# ========================================================
# St. Michael Medium Clinic HMS - Database Backup Script
# ========================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/stm_hms_backup_$TIMESTAMP.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

DB_USER="${POSTGRES_USER:-stm_admin}"
DB_NAME="${POSTGRES_DB:-st_michael_hms}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

echo "📦 Starting St. Michael HMS Database Backup at $(date)..."
echo "Target database: $DB_NAME on $DB_HOST:$DB_PORT (User: $DB_USER)"

# Execute pg_dump with gzip compression
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -F c -b -v -f "$FILENAME" "$DB_NAME"

echo "✅ Backup successfully created: $FILENAME"

# Prune backups older than retention days
find "$BACKUP_DIR" -type f -name "stm_hms_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -exec rm {} +
echo "🧹 Pruned backups older than $RETENTION_DAYS days."

