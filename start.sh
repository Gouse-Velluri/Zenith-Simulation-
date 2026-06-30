#!/bin/sh
set -e

echo "========================================="
echo "  Zenith Simulation — Starting Up"
echo "========================================="

# Use SQLite database inside Railway persistent volume
export DATABASE_URL="${DATABASE_URL:-file:/data/zenith.db}"

echo "[BOOT] DATABASE_URL = $DATABASE_URL"

# Create Prisma Client
echo "[BOOT] Generating Prisma Client..."
npx prisma generate

# Create/update database tables
echo "[BOOT] Running Prisma DB push..."
npx prisma db push || {
  echo "[BOOT] Prisma db push failed, trying with accept-data-loss..."
  npx prisma db push --accept-data-loss
}

echo "[BOOT] Database ready."

# Start backend/frontend services
echo "[BOOT] Starting services via supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf