#!/bin/bash
# ========================================================
# St. Michael Medium Clinic HMS - Database Restore Script
# ========================================================

set -e

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Error: Please specify the backup file path to restore."
  echo "Usage: ./restore-db.sh /path/to/backup.dump"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: Backup file '$BACKUP_FILE' does not exist."
  exit 1
fi

DB_USER="${POSTGRES_USER:-stm_admin}"
DB_NAME="${POSTGRES_DB:-st_michael_hms}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

echo "⚠️  WARNING: Restoring will overwrite existing data in $DB_NAME!"
read -p "Are you sure you want to proceed with restore? (y/N): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Restore aborted by user."
  exit 0
fi

echo "🔄 Restoring database $DB_NAME from $BACKUP_FILE..."
PGPASSWORD="$POSTGRES_PASSWORD" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c -v "$BACKUP_FILE"

echo "✅ Database restore completed successfully."

