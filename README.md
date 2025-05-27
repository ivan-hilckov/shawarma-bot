# 🌯 Shawarma Bot

Production-ready Telegram бот для заказа шаурмы с полным функционалом корзины, системой заказов, REST API и автоматическим деплоем.

## ✨ Основные возможности

### 🤖 Telegram Bot

- 🛒 **Корзина товаров** - добавление, удаление, изменение количества
- 📋 **Система заказов** - оформление, отслеживание статуса
- 💰 **Расчет стоимости** - автоматический подсчет с учетом количества
- 👥 **Управление пользователями** - регистрация, профили
- 📊 **Статистика** - популярные товары, выручка
- 🔔 **Уведомления** - для персонала о новых заказах

### 🚀 REST API v1.0

- 📡 **Health API** - мониторинг состояния сервисов ✅
- 🍽️ **Menu API** - категории и товары меню ✅
- 📦 **Orders API** - управление заказами ✅
- 📊 **Analytics API** - статистика и аналитика (планируется)
- 📚 **Swagger UI** - автогенерируемая документация ✅
- 🔒 **Безопасность** - API ключи, rate limiting, CORS ✅
- ⚡ **Производительность** - Redis кэширование, connection pooling ✅

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Telegram Bot  │    │   REST API      │    │   Database      │
│                 │    │                 │    │                 │
│ • Handlers      │◄───┤ • Fastify       │◄───┤ • PostgreSQL    │
│ • Cart Logic    │    │ • Swagger UI    │    │ • Redis Cache   │
│ • Notifications │    │ • Rate Limiting │    │ • Connection    │
│                 │    │ • Auto Docs     │    │   Pooling       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- PostgreSQL 13+
- Redis 6+ (опционально)
- Docker & Docker Compose (для контейнеризации)

### Установка

1. **Клонирование репозитория**

```bash
git clone <repository-url>
cd food
```

2. **Установка зависимостей**

```bash
npm install
```

3. **Настройка окружения**

```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

4. **Настройка базы данных**

```bash
# Создание базы данных
psql -U postgres -c "CREATE DATABASE shawarma_db;"
psql -U postgres -c "CREATE USER shawarma_user WITH PASSWORD 'shawarma_pass';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE shawarma_db TO shawarma_user;"

# Инициализация схемы
psql -U shawarma_user -d shawarma_db -f init.sql
```

### Запуск

#### Режим разработки

```bash
# Запуск Telegram бота
npm run dev

# Запуск API сервера
npm run dev:api

# Запуск с автоперезагрузкой
npm run dev:watch          # Бот
npm run dev:api:watch       # API
```

#### Production режим

```bash
# Сборка проекта
npm run build

# Запуск бота
npm start

# Запуск API
npm run start:api
```

#### Docker

```bash
# Запуск всех сервисов (API + Bot + DB + Redis)
docker-compose up -d

# Просмотр логов
docker-compose logs -f bot    # Логи Telegram бота
docker-compose logs -f api    # Логи REST API
docker-compose logs -f        # Все логи

# Проверка состояния
./health-check.sh

# Остановка
docker-compose down
```

## 📡 API Документация

### Доступ к Swagger UI

После запуска API сервера документация доступна по адресу:

- **Development**: http://localhost:3000/api/docs
- **Production**: https://api.shawarma-bot.com/api/docs

### Основные endpoints

#### Health API

- `GET /api/health` - общий статус сервисов
- `GET /api/health/ready` - readiness probe
- `GET /api/health/live` - liveness probe

#### Menu API ✅

- `GET /api/menu/categories` - категории меню
- `GET /api/menu/items` - товары с фильтрацией
- `GET /api/menu/items/:id` - детали товара

**Примеры использования:**

```bash
# Получить все категории
curl http://localhost:3000/api/menu/categories

# Получить товары с фильтрацией
curl "http://localhost:3000/api/menu/items?category_id=1&limit=5"

# Получить товары в диапазоне цен
curl "http://localhost:3000/api/menu/items?min_price=200&max_price=300"

# Получить детали товара
curl http://localhost:3000/api/menu/items/1
```

#### Orders API ✅

- `GET /api/orders` - список заказов (админ)
- `GET /api/orders/:id` - детали заказа
- `GET /api/orders/stats` - статистика заказов

**Примеры использования:**

```bash
# Получить все заказы (требует API ключ)
curl -H "Authorization: Bearer admin-key-dev" http://localhost:3000/api/orders

# Получить заказы с фильтрацией
curl -H "Authorization: Bearer admin-key-dev" "http://localhost:3000/api/orders?status=pending&limit=5"

# Получить детали заказа
curl -H "Authorization: Bearer admin-key-dev" http://localhost:3000/api/orders/5

# Получить статистику заказов
curl -H "Authorization: Bearer admin-key-dev" http://localhost:3000/api/orders/stats
```

### Аутентификация

Для доступа к админским функциям используйте API ключ:

```bash
curl -H "Authorization: Bearer your-api-key" \
     http://localhost:3000/api/orders
```

## 🧪 Тестирование

```bash
# Запуск всех тестов
npm test

# Тесты с покрытием
npm run test:coverage

# Тесты API
npm run test:api

# Тесты в watch режиме
npm run test:watch
```

## 🔧 Конфигурация

### Переменные окружения

```env
# Telegram Bot
BOT_TOKEN=your_telegram_bot_token
NOTIFICATIONS_CHAT_ID=your_notifications_chat_id
ADMIN_USER_IDS=123456789,987654321

# Database
DATABASE_URL=postgresql://shawarma_user:shawarma_pass@localhost:5432/shawarma_db

# Redis
REDIS_URL=redis://localhost:6379

# API Configuration
API_PORT=3000
API_HOST=0.0.0.0
API_PREFIX=/api

# Security
API_KEYS=admin-key-1,admin-key-2
CORS_ORIGINS=http://localhost:3000,https://admin.shawarma-bot.com

# Rate Limiting
RATE_LIMIT_PUBLIC=100
RATE_LIMIT_ADMIN=1000

# Cache
REDIS_CACHE_TTL=300
ENABLE_CACHE=true

# Environment
NODE_ENV=development
```

## 📊 Мониторинг

### Health Checks

API предоставляет endpoints для мониторинга:

```bash
# Общий статус
curl http://localhost:3000/api/health

# Kubernetes readiness probe
curl http://localhost:3000/api/health/ready

# Kubernetes liveness probe
curl http://localhost:3000/api/health/live
```

### Логирование

- **Structured logging** с Winston
- **Request/Response логирование** в API
- **Error tracking** с stack traces в development

### Метрики

- Время ответа API
- Использование памяти и CPU
- Статус подключений к БД и Redis
- Rate limiting статистика

## 🚀 Деплой

### Автоматический деплой

```bash
# Деплой на сервер
./deploy.sh

# Настройка сервера
./setup-server.sh
```

### Docker Production

```bash
# Сборка образа
docker build -t shawarma-bot .

# Запуск в production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🛠️ Разработка

### Структура проекта

```
src/
├── api/                    # REST API
│   ├── server.ts          # Fastify сервер
│   ├── routes/            # API маршруты
│   ├── schemas/           # Zod схемы валидации
│   └── plugins/           # Fastify плагины
├── bot.ts                 # Telegram бот
├── handlers.ts            # Обработчики команд
├── database.ts            # Подключение к БД
├── cart.ts                # Логика корзины
└── types.ts               # TypeScript типы

__tests__/
├── api/                   # Тесты API
└── bot/                   # Тесты бота
```

### Код стайл

```bash
# Линтинг
npm run lint
npm run lint:fix

# Форматирование
npm run format
npm run format:check

# Проверка типов
npm run type-check
```

### Git Hooks

Настроены pre-commit хуки для:

- Линтинга кода
- Форматирования
- Проверки типов
- Запуска тестов

## 📈 Roadmap

### v2.2 - Orders API ✅

- ✅ Health API
- ✅ Menu categories и items
- ✅ Orders API с аутентификацией
- ✅ Статистика заказов
- ✅ Swagger документация
- ✅ Исправлены тесты Config интерфейса
- ✅ Все тесты проходят (262 passed)
- 🔄 Redis кэширование (отключено)

### v2.3 - Testing & Quality

- ✅ Исправлены тесты типов
- ✅ Полное покрытие тестами API (79.31%)
- ✅ Настроен ESLint с TypeScript
- ✅ Все тесты проходят (262 passed)
- ✅ **Исправлены проблемы линтера** - убраны неиспользуемые переменные, исправлены импорты
- ✅ **Обновлен tsconfig.json** - включены тесты в компиляцию
- 📋 Интеграционные тесты
- 🔍 E2E тестирование

### v2.3 - Analytics API

- 📈 Дашборд метрики
- 📊 Детальная аналитика
- 📉 Тренды продаж

### v2.4 - Cart API Migration ✅ **ЗАВЕРШЕНО**

- ✅ **Cart API** - полноценное API для корзины
- ✅ **API клиент** - `src/api-client.ts` для бота
- ✅ **Миграция handlers** - бот использует API вместо прямого доступа к Redis
- ✅ **Docker архитектура** - API и бот в отдельных контейнерах
- ✅ **Health checks** - мониторинг всех сервисов
- ✅ **Деплой готовность** - обновлены все конфигурации
- ✅ **TypeScript конфигурация** - исправлена сборка для Docker
- ✅ **Docker healthcheck** - оптимизированы таймауты

**Cart API endpoints:**

- `POST /api/cart/add` - добавить товар ✅
- `PUT /api/cart/update` - изменить количество ✅
- `DELETE /api/cart/remove/:userId/:itemId` - удалить товар ✅
- `DELETE /api/cart/clear/:userId` - очистить корзину ✅
- `GET /api/cart/:userId` - получить корзину ✅
- `GET /api/cart/:userId/total` - получить сумму ✅

**Архитектура v2.4:**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Telegram Bot  │───▶│   REST API      │───▶│   Database      │
│   (Port: N/A)   │    │   (Port: 3000)  │    │   (Port: 5432)  │
│                 │    │                 │    │                 │
│ • Bot Handlers  │    │ • Cart API      │    │ • PostgreSQL    │
│ • API Client    │    │ • Menu API      │    │ • Redis Cache   │
│ • Notifications │    │ • Orders API    │    │ • Health Checks │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### v3.0 - Advanced Features

- 🔄 WebSocket real-time updates
- 📁 Файловые загрузки
- 🔗 GraphQL endpoint
- 💳 Платежные интеграции

## 🤝 Участие в разработке

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) файл.

## 📞 Поддержка

- 📧 Email: support@shawarma-bot.com
- 📱 Telegram: @shawarma_support_bot
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

**Сделано с ❤️ для любителей шаурмы**
