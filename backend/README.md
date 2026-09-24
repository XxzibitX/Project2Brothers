# Backend (NestJS + Prisma + MySQL)

API для фронтенда 2Brothers. Контракт совпадает с `frontend/src/api/*`.

## Стек

- NestJS 11
- Prisma 5 + MySQL
- JWT в httpOnly-cookie (+ токен в теле login/register)

## Быстрый старт

1. Подними MySQL (Docker):

```bash
docker compose up -d
```

Или свой MySQL и БД `project2brothers`.

2. Скопируй env и поправь `DATABASE_URL` при необходимости:

```bash
cp .env.example .env
```

3. Миграции и сид:

```bash
npm install
npm run db:setup
```

4. Запуск:

```bash
npm run start:dev
```

API: `http://localhost:8080/api/v1/...`

## Демо-аккаунты

| Роль | Телефон | Пароль |
|------|---------|--------|
| user (клиент) | `+79991234567` | `123456` |
| manager | `+79990000000` | `123456` |

В API `AuthUser.role` = `"user" | "manager"`. В БД Prisma: `CUSTOMER` / `MANAGER`.

Менеджерские операции вынесены в `/api/v1/manager/*` и защищены `JwtAuthGuard` + `RolesGuard('manager')`.

## Эндпоинты

| Method | Path | Auth | Описание |
|--------|------|------|----------|
| POST | `/api/v1/auth/login` | — | Вход (cookie) |
| POST | `/api/v1/auth/register` | — | Регистрация (cookie) |
| GET | `/api/v1/auth/me` | cookie | Текущий пользователь |
| POST | `/api/v1/auth/logout` | — | Выход (очистка cookie) |
| GET | `/api/v1/products` | — | Список (`?category=`) |
| GET | `/api/v1/products/:id` | — | Товар |
| GET | `/api/v1/orders` | user | Свои заказы |
| GET | `/api/v1/orders/:id` | user | Свой заказ (чужой → 403) |
| POST | `/api/v1/orders` | user | Создать заказ |
| GET | `/api/v1/manager/orders` | manager | Все заказы |
| GET | `/api/v1/manager/orders/:id` | manager | Заказ |
| PATCH | `/api/v1/manager/orders/:id/status` | manager | Сменить статус |
| GET | `/api/v1/config` | — | Конфиг |

Сессия: JWT в httpOnly-cookie. Фронт берёт пользователя через `GET /me` (`useAuth` + React Query), без localStorage.

## Фронтенд

В `frontend/.env`:

```
VITE_API_BASE_URL=/api
VITE_PROXY_TARGET=http://localhost:8080
VITE_USE_API_MOCK=false
```

Vite проксирует `/api` на бэкенд без rewrite — префикс `api` уже есть на Nest.

## Telegram-бот заказов

Бэкенд шлёт новые заказы в Telegram и позволяет менять статус прямо из чата.

1. Создай бота у [@BotFather](https://t.me/BotFather), скопируй токен.
2. Напиши боту `/start` или `/chatid` — он ответит твоим chat id.
3. В `.env`:

```
TELEGRAM_BOT_TOKEN="123456:ABC..."
TELEGRAM_CHAT_IDS="123456789"
```

Несколько чатов через запятую: `TELEGRAM_CHAT_IDS="111,222"`.

4. Перезапусти бэкенд. При новом заказе придёт сообщение с составом, клиентом и кнопками статусов (Принят → Готовится → Готов → У курьера → Выдан / Отменить). Смена статуса в менеджерке тоже обновляет сообщение в Telegram.

Без токена/chat id бот просто выключен — API работает как раньше.

## Деплой на VPS

См. корневой [DEPLOY.md](../DEPLOY.md): `docker compose up -d --build` поднимает MySQL + API + Nginx.
