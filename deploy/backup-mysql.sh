#!/usr/bin/env bash
# Бэкап MySQL (+ опционально uploads) для Project2Brothers.
# Запуск из корня репозитория:
#   ./deploy/backup-mysql.sh
# Cron (ежедневно в 3:15):
#   15 3 * * * cd /var/www/project2brothers && ./deploy/backup-mysql.sh >> /var/log/p2b-backup.log 2>&1

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "ERROR: .env not found in $ROOT" >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a
# shellcheck source=/dev/null
source .env
set +a

MYSQL_DATABASE="${MYSQL_DATABASE:-project2brothers}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"

if [[ -z "${MYSQL_ROOT_PASSWORD:-}" ]]; then
  echo "ERROR: MYSQL_ROOT_PASSWORD is empty" >&2
  exit 1
fi

OUT_DB="$BACKUP_DIR/db_${STAMP}.sql.gz"
echo "Dumping MySQL → $OUT_DB"

docker compose exec -T mysql \
  mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" \
  --single-transaction --routines --triggers \
  "$MYSQL_DATABASE" | gzip -c > "$OUT_DB"

echo "OK db $(du -h "$OUT_DB" | awk '{print $1}')"

# Архив загруженных картинок (если volume смонтирован в api)
OUT_UPLOADS="$BACKUP_DIR/uploads_${STAMP}.tar.gz"
if docker compose exec -T api test -d /app/uploads/products 2>/dev/null; then
  echo "Archiving uploads → $OUT_UPLOADS"
  docker compose exec -T api tar -C /app -czf - uploads > "$OUT_UPLOADS" || true
  if [[ -s "$OUT_UPLOADS" ]]; then
    echo "OK uploads $(du -h "$OUT_UPLOADS" | awk '{print $1}')"
  else
    rm -f "$OUT_UPLOADS"
  fi
fi

find "$BACKUP_DIR" -type f \( -name 'db_*.sql.gz' -o -name 'uploads_*.tar.gz' \) \
  -mtime "+$KEEP_DAYS" -print -delete 2>/dev/null || true

echo "Done. Keep ${KEEP_DAYS} days in $BACKUP_DIR"
echo "IMPORTANT: copy backups off this VPS (scp/rsync to another disk)."
