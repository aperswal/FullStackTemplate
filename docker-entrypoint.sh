#!/bin/sh
set -e

echo "Running database migrations..."
if command -v npx > /dev/null 2>&1; then
  npx drizzle-kit migrate --config apps/web/drizzle.config.ts || {
    echo "ERROR: Database migration failed. Check DATABASE_URL and migration files."
    exit 1
  }
  echo "Migrations completed successfully."
else
  echo "ERROR: npx not available in this build. Ensure drizzle-kit is included in production dependencies or run migrations separately."
  exit 1
fi

if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding database..."
  if command -v npx > /dev/null 2>&1; then
    npx tsx apps/web/lib/db/seed.ts || {
      echo "ERROR: Database seeding failed."
      exit 1
    }
    echo "Seeding completed successfully."
  else
    echo "ERROR: npx not available for seeding. Run seed manually."
    exit 1
  fi
fi

echo "Starting server..."
exec "$@"
