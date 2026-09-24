#!/bin/sh
set -e

echo "Waiting for database migrations..."
npx prisma migrate deploy

if [ "${SEED_ON_START}" = "true" ]; then
  echo "Seeding database..."
  # seed.js is plain Node (no ts-node) — works in production image
  npx prisma db seed || echo "Seed skipped or failed (non-fatal)"
fi

if [ -f dist/main.js ]; then
  exec node dist/main.js
fi

if [ -f dist/src/main.js ]; then
  exec node dist/src/main.js
fi

echo "Cannot find Nest entrypoint under dist/"
ls -la dist || true
exit 1
