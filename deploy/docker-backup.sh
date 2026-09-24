#!/usr/bin/env bash
# Внутри docker-сервиса `backup`: дамп MySQL + архив uploads раз в сутки.
set -euo pipefail

MYSQL_HOST="${MYSQL_HOST:-mysql}"
MYSQL_DATABASE="${MYSQL_DATABASE:-project2brothers}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
# по умолчанию раз в 24 часа; первый прогон через 2 минуты после старта
INTERVAL_SEC="${BACKUP_INTERVAL_SEC:-86400}"
FIRST_DELAY_SEC="${BACKUP_FIRST_DELAY_SEC:-120}"

mkdir -p /backups

if [[ -z "${MYSQL_ROOT_PASSWORD:-}" ]]; then
  echo "ERROR: MYSQL_ROOT_PASSWORD is empty" >&2
  exit 1
fi

run_backup() {
  local stamp out_db out_up
  stamp="$(date +%Y%m%d_%H%M%S)"
  out_db="/backups/db_${stamp}.sql.gz"
  out_up="/backups/uploads_${stamp}.tar.gz"

  echo "[$(date -Iseconds)] Dumping ${MYSQL_DATABASE} → ${out_db}"
  mysqldump \
    -h"$MYSQL_HOST" \
    -uroot \
    -p"$MYSQL_ROOT_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    "$MYSQL_DATABASE" | gzip -c > "$out_db"
  echo "[$(date -Iseconds)] OK db $(du -h "$out_db" | awk '{print $1}')"

  if [[ -d /uploads/products ]]; then
    echo "[$(date -Iseconds)] Archiving uploads → ${out_up}"
    tar -C /uploads -czf "$out_up" . || true
    if [[ -s "$out_up" ]]; then
      echo "[$(date -Iseconds)] OK uploads $(du -h "$out_up" | awk '{print $1}')"
    else
      rm -f "$out_up"
    fi
  fi

  find /backups -type f \( -name 'db_*.sql.gz' -o -name 'uploads_*.tar.gz' \) \
    -mtime "+${KEEP_DAYS}" -print -delete 2>/dev/null || true
}

echo "[$(date -Iseconds)] Backup worker started (interval ${INTERVAL_SEC}s, keep ${KEEP_DAYS}d)"
sleep "$FIRST_DELAY_SEC"

while true; do
  if run_backup; then
    echo "[$(date -Iseconds)] Backup finished"
  else
    echo "[$(date -Iseconds)] Backup FAILED" >&2
  fi
  sleep "$INTERVAL_SEC"
done
