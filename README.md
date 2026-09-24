# 2Brothers

Онлайн-заказы шаурмы: меню, корзина, личный кабинет клиента и панель менеджера/владельца. Уведомления о заказах уходят в Telegram.

```text
Браузер → Nginx (:80)
            ├─ /        → frontend (Vite build)
            └─ /api/*   → NestJS API + Telegram-бот
                            └─ MySQL
```

---

## Возможности

| Для гостей | Для персонала |
|------------|---------------|
| Каталог и корзина | Заказы: активные / завершённые / архив |
| Доставка и оплата курьеру | Смена статуса (сайт + кнопки в Telegram) |
| Регистрация / вход по телефону | Меню, допы, категории |
| История своих заказов | Контакты кафе на сайте |
| Юридические страницы | Юридические документы (владелец) |
| | Сотрудники, статус системы, Telegram (владелец) |

---

## Стек

- **Frontend:** React 19, Vite, TanStack Query, Tailwind CSS 4  
- **Backend:** NestJS 11, Prisma 5, MySQL 8  
- **Auth:** JWT в httpOnly-cookie  
- **Деплой:** Docker Compose (MySQL + API + Nginx)

---

## Структура репозитория

```text
Project2Brothers/
├── frontend/          # клиентский сайт
├── backend/           # NestJS API
├── deploy/            # Nginx, Dockerfile фронта, бэкапы
├── docker-compose.yml # продакшен-стек
├── .env.example       # шаблон переменных для VPS
├── DEPLOY.md          # подробный деплой и troubleshooting
└── README.md          # этот файл
```

Один репозиторий на весь проект — так проще клонировать и поднимать на сервере.

---

## Быстрый старт (локально)

Нужны **Node.js 20+**, **npm** и **Docker** (для MySQL).

### 1. База данных

```bash
cd backend
docker compose up -d
```

Поднимается MySQL на `localhost:3306`.

### 2. Backend

```bash
cd backend
cp .env.example .env
# при необходимости поправь DATABASE_URL

npm install
npm run db:setup      # миграции + сид (меню и демо-пользователи)
npm run start:dev     # http://localhost:8080/api
```

### 3. Frontend

В другом терминале:

```bash
cd frontend
cp .env.example .env   # VITE_API_BASE_URL=/api, прокси на backend :8080
npm install
npm run dev            # http://localhost:3000
```

В `backend/.env` укажи `CORS_ORIGIN=http://localhost:3000`.

### Демо-аккаунты (после сида)

| Роль | Телефон | Пароль |
|------|---------|--------|
| Клиент | `+79991234567` | `123456` |
| Владелец | `+79990000000` | `123456` |
| Менеджер | `+79990000001` | `123456` |

---

## Деплой на VPS (Docker)

Подходит для демо на слабом VPS (1 CPU / 1 GB). Рекомендуется **swap 2 GB**.

### Требования

- Ubuntu/Debian (или аналог)
- Docker + Docker Compose plugin
- Открыт порт **80** (и **443**, если будет HTTPS)
- С сервера должен открываться `https://api.telegram.org` (для бота)

### 1. Swap (на 1 GB RAM — обязательно)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Docker

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER
# выйди из SSH и зайди снова
```

### 3. Код и env

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/YOUR_USER/Project2Brothers.git
cd Project2Brothers
sudo chown -R $USER:$USER .

cp .env.example .env
nano .env
```

Минимум в `.env`:

| Переменная | Что поставить |
|------------|----------------|
| `MYSQL_ROOT_PASSWORD` | сильный пароль |
| `JWT_SECRET` | длинная случайная строка |
| `CORS_ORIGIN` | `http://IP_СЕРВЕРА` или `https://домен.ru` |
| `HTTP_PORT` | `80` |
| `SEED_ON_START` | `true` при первом запуске |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_IDS` | опционально |

### 4. Запуск

```bash
docker compose up -d --build
```

Первая сборка на слабом VPS может занять **10–20 минут**.

### 5. Проверка

```bash
curl -s http://127.0.0.1/api/health
# {"status":"ok","db":true,"telegram":true|false,...}

# в браузере:
# http://IP_СЕРВЕРА
```

После успешного первого старта:

```bash
# в .env
SEED_ON_START=false

docker compose up -d api
```

### Обновление после правок в Git

```bash
cd /var/www/project2brothers   # или путь к клону
git pull
docker compose up -d --build
```

Миграции Prisma применяются автоматически при старте контейнера `api`.

### Полезные команды

```bash
docker compose ps
docker compose logs -f api
docker compose logs -f web
docker compose down              # остановить
docker compose down -v           # остановить и УДАЛИТЬ БД
```

Подробнее (HTTPS, бэкапы, типичные ошибки): **[DEPLOY.md](./DEPLOY.md)**.

---

## Telegram

1. Создай бота у [@BotFather](https://t.me/BotFather).  
2. Напиши боту `/start` или `/chatid` — получи chat id.  
3. Пропиши в `.env` (на VPS) или в панели владельца → **Настройки**:

```env
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_IDS=5124192112
```

4. Перезапусти API: `docker compose up -d api`.

Заказ сначала сохраняется в MySQL; если Telegram недоступен, outbox досылает уведомление позже. В панели владельца блок **«Система»** показывает связь с Telegram и очередь «ожидают отправки».

---

## Проверки здоровья

| URL | Назначение |
|-----|------------|
| `GET /api/health` | API + БД (+ флаг Telegram) |
| Панель → Настройки → Система | Реальный ping Telegram, очередь outbox |

---

## Безопасность

- Не коммить `.env` (уже в `.gitignore`).
- На проде смени все пароли и `JWT_SECRET`.
- Смени пароли демо-пользователей после первого входа.
- Для HTTPS см. [DEPLOY.md](./DEPLOY.md) — cookie auth требует `secure` в production.

---

## Лицензия

Проект для кафе 2Brothers. Использование и распространение — по договорённости с владельцем.
