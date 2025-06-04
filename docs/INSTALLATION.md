# 🚀 Руководство по установке

Подробная инструкция по установке и настройке Shawarma Bot на различных платформах.

---

## 📋 Предварительные требования

### Системные требования

- **Node.js** 18+
- **PostgreSQL** 13+
- **Redis** 6+ (опционально, для кэширования)
- **Docker & Docker Compose** (рекомендуется)

### Telegram Bot Token

Получите токен бота у [@BotFather](https://t.me/BotFather):

1. Отправьте `/newbot`
2. Следуйте инструкциям
3. Сохраните токен в формате `1234567890:ABCdefGHIjklmnoPQRstuvwxyz`

---

## 🚀 Установка

### Способ 1: Docker (рекомендуется)

#### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd food
```

#### 2. Настройка окружения

```bash
cp docker.env.example .env
nano .env
```

Заполните основные переменные:

```env
BOT_TOKEN=your_telegram_bot_token
NODE_ENV=development
DATABASE_URL=postgresql://shawarma_user:shawarma_pass@postgres:5432/shawarma_db
REDIS_URL=redis://redis:6379
```

#### 3. Запуск

```bash
# Запуск всех сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### Способ 2: Локальная установка

#### 1. Установка зависимостей

```bash
git clone <repository-url>
cd food
npm install
```

#### 2. Настройка базы данных

```bash
# Установка PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Создание базы данных
sudo -u postgres psql
```

```sql
CREATE DATABASE shawarma_db;
CREATE USER shawarma_user WITH PASSWORD 'shawarma_pass';
GRANT ALL PRIVILEGES ON DATABASE shawarma_db TO shawarma_user;
\q
```

```bash
# Инициализация схемы
psql -U shawarma_user -d shawarma_db -f init.sql
```

#### 3. Установка Redis (опционально)

```bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis

# Запуск
sudo systemctl start redis-server
```

#### 4. Настройка переменных окружения

```bash
cp .env.example .env
nano .env
```

```env
BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=postgresql://shawarma_user:shawarma_pass@localhost:5432/shawarma_db
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

#### 5. Запуск

```bash
# Режим разработки
npm run dev          # Бот
npm run dev:api      # API (в отдельном терминале)

# Production
npm run build
npm start           # Бот
npm run start:api   # API (в отдельном терминале)
```

---

## ⚙️ Конфигурация

### Основные переменные окружения

| Переменная              | Описание                      | Обязательная | Пример                   |
| ----------------------- | ----------------------------- | ------------ | ------------------------ |
| `BOT_TOKEN`             | Токен Telegram бота           | ✅           | `1234:ABC...`            |
| `DATABASE_URL`          | Строка подключения PostgreSQL | ✅           | `postgresql://...`       |
| `REDIS_URL`             | Строка подключения Redis      | ❌           | `redis://localhost:6379` |
| `NODE_ENV`              | Окружение                     | ❌           | `development/production` |
| `API_PORT`              | Порт API сервера              | ❌           | `3000`                   |
| `NOTIFICATIONS_CHAT_ID` | ID чата для уведомлений       | ❌           | `-1001234567890`         |
| `ADMIN_USER_IDS`        | ID администраторов            | ❌           | `123,456,789`            |

### Продвинутые настройки

```env
# Assets Configuration
ASSETS_BASE_URL=https://botgarden.store/assets

# Security
API_KEYS=admin-key-1,admin-key-2
CORS_ORIGINS=http://localhost:3000,https://admin.shawarma-bot.com

# Rate Limiting
RATE_LIMIT_PUBLIC=100
RATE_LIMIT_ADMIN=1000

# Cache
REDIS_CACHE_TTL=300
ENABLE_CACHE=true
```

---

## 📱 Настройка Telegram Bot

### 1. Команды бота

Установите команды через [@BotFather](https://t.me/BotFather):

```
start - Запуск бота и главное меню
```

### 2. Описание бота

```
Современный бот для заказа шаурмы с удобным интерфейсом и быстрой доставкой
```

### 3. Фото профиля

Загрузите логотип бота размером 512x512 пикселей.

---

## 🔧 Проверка установки

### 1. Статус сервисов

```bash
# Docker
docker-compose ps

# Локально
ps aux | grep node
```

### 2. Health checks

```bash
# API
curl http://localhost:3000/api/health

# Database
psql -U shawarma_user -d shawarma_db -c "SELECT version();"

# Redis
redis-cli ping
```

### 3. Тестирование бота

1. Найдите бота в Telegram по имени
2. Отправьте `/start`
3. Проверьте отображение главного меню
4. Попробуйте добавить товар в корзину

---

## 🛠️ Troubleshooting

### Проблемы с базой данных

```bash
# Проверка подключения
pg_isready -h localhost -p 5432

# Проверка пользователя
sudo -u postgres psql -c "\du"

# Перезапуск PostgreSQL
sudo systemctl restart postgresql
```

### Проблемы с Redis

```bash
# Проверка статуса
sudo systemctl status redis-server

# Проверка подключения
redis-cli ping

# Очистка кэша
redis-cli flushall
```

### Проблемы с Docker

```bash
# Пересборка контейнеров
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Просмотр логов
docker-compose logs -f bot
docker-compose logs -f api
```

### Проблемы с Telegram

- Проверьте корректность токена бота
- Убедитесь что бот не используется на другом сервере
- Проверьте интернет-соединение сервера

---

## 📈 Следующие шаги

После успешной установки:

1. **[Конфигурация](CONFIGURATION.md)** - детальная настройка проекта
2. **[Deployment](DEPLOYMENT.md)** - деплой на продакшен сервер
3. **[Monitoring](MONITORING.md)** - настройка мониторинга
4. **[Testing](TESTING_GUIDE.md)** - запуск тестов

---

**Возникли проблемы?** Проверьте [Troubleshooting](TROUBLESHOOTING.md) или создайте [Issue](https://github.com/your-repo/issues).
