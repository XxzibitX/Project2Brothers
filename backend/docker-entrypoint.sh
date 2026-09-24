#!/bin/sh
set -e

echo "Waiting for database migrations..."
npx prisma migrate deploy

if [ "${SEED_ON_START}" = "true" ]; then
  echo "Seeding database..."
  # ts-node is a devDependency; install temporarily for seed only
  npm install --no-save ts-node typescript >/dev/null 2>&1 || true
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
