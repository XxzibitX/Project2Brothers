# Деплой 2Brothers на VPS

Одной командой поднимаются **MySQL + API (Nest) + Nginx (фронт)**.

```text
Браузер → :80 (nginx)
            ├─ /        → статика frontend/dist
            └─ /api/*   → api:8080 (Nest + Telegram-бот)
                            └─ mysql:3306
```

## Требования

- Docker + Docker Compose plugin (`docker compose version`)
- Открыт порт **80** (и **443**, если будешь вешать HTTPS)
- С VPS должен открываться `https://api.telegram.org` (для бота)

## Быстрый старт

```bash
# 1. Код на сервере
git clone <твой-репо> /var/www/project2brothers
cd /var/www/project2brothers

# 2. Env
cp .env.example .env
nano .env   # обязательно смени пароли и секреты
```

Минимум в `.env`:

| Переменная | Пример |
|------------|--------|
| `MYSQL_ROOT_PASSWORD` | сильный пароль |
| `JWT_SECRET` | длинная случайная строка |
| `CORS_ORIGIN` | `http://IP_СЕРВЕРА` или `https://домен.ru` |
| `HTTP_PORT` | `80` |
| `SEED_ON_START` | `true` при первом запуске |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_IDS` | опционально |

```bash
# 3. Поднять всё
docker compose up -d --build
```

Проверка:

```bash
curl -s http://127.0.0.1/api/health
# {"status":"ok","db":true,"telegram":true|false,...}

curl -s http://127.0.0.1/api/v1/config
# открой в браузере http://IP_СЕРВЕРА
```

Демо после сида:

| Роль | Телефон | Пароль |
|------|---------|--------|
| клиент | `+79991234567` | `123456` |
| владелец | `+79990000000` | `123456` |
| менеджер | `+79990000001` | `123456` |

После первого успешного старта поставь `SEED_ON_START=false` и пересоздай api (иначе сид будет пытаться запускаться снова):

```bash
# в .env
SEED_ON_START=false
docker compose up -d api
```

## Полезные команды

```bash
# Логи
docker compose logs -f
docker compose logs -f api
docker compose logs -f web

# Статус
docker compose ps

# Пересборка после git pull
git pull
docker compose up -d --build

# Остановить
docker compose down

# Остановить и удалить БД (осторожно!)
docker compose down -v
```

## HTTPS (Let's Encrypt)

Compose слушает HTTP. HTTPS проще повесить снаружи:

**Вариант A — Certbot + Nginx на хосте** (прокси на `127.0.0.1:80`):

1. В `.env` поставь `HTTP_PORT=8080` (или другой свободный), `CORS_ORIGIN=https://домен.ru`
2. `docker compose up -d --build`
3. На хосте Nginx/Caddy проксирует `443 → 127.0.0.1:8080` и выдаёт сертификат

Пример Caddy:

```caddy
твой-домен.ru {
    reverse_proxy 127.0.0.1:8080
}
```

**Вариант B — Cloudflare Tunnel / панель хостинга** — аналогично: TLS снаружи, внутрь HTTP на `HTTP_PORT`.

После включения HTTPS обязательно:

```env
CORS_ORIGIN=https://твой-домен.ru
NODE_ENV=production   # уже задан в compose для api
```

Cookie auth использует `secure` в production — без HTTPS логин в браузере не сохранится.

## Telegram

1. Бот у [@BotFather](https://t.me/BotFather)
2. Напиши боту `/start` → получи chat id
3. В `.env`:

```env
TELEGRAM_BOT_TOKEN=123:ABC...
TELEGRAM_CHAT_IDS=5124192112
```

4. `docker compose up -d api`

Если в логах `ENOTFOUND api.telegram.org` — с VPS нет доступа к Telegram (часто нужен VPN/прокси на сервере). API сайта при этом работает.

## Структура файлов деплоя

| Файл | Назначение |
|------|------------|
| `docker-compose.yml` | mysql + api + web |
| `.env.example` | шаблон переменных |
| `backend/Dockerfile` | сборка Nest |
| `backend/docker-entrypoint.sh` | migrate (+ optional seed) → start |
| `deploy/Dockerfile.web` | сборка Vite + Nginx |
| `deploy/nginx.conf` | статика + proxy `/api` + кэш uploads |
| `deploy/backup-mysql.sh` | ручной mysqldump с хоста |
| `deploy/docker-backup.sh` | автобэкап внутри compose-сервиса `backup` |

Локальная разработка по-прежнему: MySQL из `backend/docker-compose.yml`, `npm run start:dev` в backend/frontend — см. `backend/README.md`.

## Обновление версии

```bash
cd /var/www/project2brothers
git pull
docker compose up -d --build
```

Миграции Prisma применяются автоматически при старте контейнера `api`.

## Надёжность заказов и бэкапы

В коде уже есть:

- заказ сначала в MySQL, Telegram после (сбой бота не откатывает заказ);
- `idempotencyKey` — повторный POST после таймаута не создаёт второй заказ;
- атомарный счётчик `ORD-N`;
- outbox каждые 30 с досылает в Telegram заказы без `telegramNotifiedAt` (до 48 ч);
- `GET /api/health` + healthcheck контейнера `api`;
- rate limit на auth и создание заказа.

### Бэкап БД (обязательно на проде)

В `docker compose` сервис **`backup`** сам пишет дампы раз в сутки в volume `backups_data`:

```bash
# посмотреть файлы
docker compose exec backup ls -lah /backups

# скопировать на хост
docker compose cp backup:/backups ./backups-export
```

Скопируй дампы **вне VPS** (`scp`/`rsync`). Volume переживает рестарт, но не смерть диска.

Ручной бэкап с хоста (если compose запущен):

```bash
chmod +x deploy/backup-mysql.sh
./deploy/backup-mysql.sh
```

Восстановление (перезапишет БД):

```bash
gunzip -c path/to/db_YYYYMMDD_HHMMSS.sql.gz | docker compose exec -T mysql \
  mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"
```

## Типичные проблемы

**`CORS` / не логинится** — `CORS_ORIGIN` должен совпадать с URL в браузере (`http://IP` ≠ `http://IP:80` обычно ок, но `https` и `http` — разные).

**Белый экран / 404 на роутах** — проверь, что открываешь через nginx (`HTTP_PORT`), не порт api напрямую.

**api unhealthy / migrate fail** — смотри `docker compose logs api`; часто MySQL ещё не готов или неверный пароль в `.env`.

**Порт 80 занят** — смени `HTTP_PORT=8080` в `.env`.
