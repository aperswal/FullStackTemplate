#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/apps/web
node scripts/migrate.cjs || {
  echo "ERROR: Database migration failed. Check DATABASE_URL and migration files."
  exit 1
}
echo "Migrations completed successfully."
cd /app

echo "Starting server..."
exec "$@"
