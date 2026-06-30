#!/bin/sh
set -e

echo "========================================="
echo "  Zenith Simulation — Starting Up"
echo "========================================="

# Ensure DATABASE_URL points to the persistent volume
export DATABASE_URL="${DATABASE_URL:-file:/data/zenith.db}"

echo "[BOOT] DATABASE_URL = $DATABASE_URL"

# Run Prisma schema push (creates/updates tables)
echo "[BOOT] Running Prisma DB push..."
npx prisma db push --skip-generate 2>&1 || {
  echo "[BOOT] Prisma db push failed, trying with accept-data-loss..."
  npx prisma db push --skip-generate --accept-data-loss 2>&1
}
echo "[BOOT] Database ready."

# Start all services via supervisord
echo "[BOOT] Starting services via supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf