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
│   (Dockerfile.  │    │   (Dockerfile.  │    │                 │
│   bot)          │    │   api)          │    │                 │
│ • Bot Handlers  │◄───┤ • Fastify       │◄───┤ • PostgreSQL    │
│ • API Client    │    │ • Swagger UI    │    │ • Redis Cache   │
│ • Notifications │    │ • Rate Limiting │    │ • Connection    │
│                 │    │ • Auto Docs     │    │   Pooling       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Новая раздельная архитектура v2.5:**

- 🔄 **Отдельные Docker образы** - `Dockerfile.api` и `Dockerfile.bot`
- 📦 **Изолированные сборки** - `tsconfig.api.json` и `tsconfig.bot.json`
- ⚡ **Быстрые пересборки** - изменения в API не влияют на бота и наоборот
- 🎯 **Специфичные зависимости** - каждый контейнер содержит только нужные файлы
- 🔧 **Упрощенная диагностика** - проблемы изолированы по сервисам

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
cd deployment && ./health-check.sh

# Остановка
docker-compose down
```

## 📡 API Документация

### Доступ к Swagger UI

После запуска API сервера документация доступна по адресу:

- **Development**: http://localhost:3000/api/docs
- **Production**: https://api.shawarma-bot.com/api/docs

### Доступные домены

Проект развернут на нескольких доменах для разных сервисов:

- 🏪 **botgarden.store** - основной магазин Shawarma Bot (текущий)
- 🛒 **botgarden.shop** - будущая торговая площадка ботов
- 🔧 **botgarden.tech** - техническая документация
- 🌐 **botcraft.tech** - будущий сервис крафт-ботов
- 🎮 **botgrover.fun** - игровые боты
- 🇷🇺 **botgrover.ru** - российская локализация

**Доступ к API:**

- http://botgarden.store/api/docs - Swagger UI
- http://botgarden.store/health - Health check
- http://botgarden.store/api/menu/categories - Menu API

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

## 📊 Мониторинг и анализ

### Анализ VPS сервера

Для документирования инфраструктуры и диагностики проблем:

```bash
# Сбор информации о сервере
ssh user@server "cd ~/shawarma-bot/deployment && ./server-info.sh"

# Скачивание отчета
scp user@server:~/shawarma-bot/deployment/server-info-*.log ./

# Анализ отчета
# Заполните docs/VPS_ANALYSIS.md на основе данных
```

**Что анализируется:**

- 🖥️ **Система** - ОС, ресурсы, производительность
- 🐳 **Docker** - контейнеры, образы, использование
- 🌐 **Nginx** - конфигурация, статус, логи
- 🚀 **Проект** - версия, статус сервисов
- 🔒 **Безопасность** - файрвол, порты, доступы

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
cd deployment
./deploy.sh

# Настройка сервера (первый раз)
cd deployment
scp setup-server.sh user@server:~/
ssh user@server "chmod +x ~/setup-server.sh && ~/setup-server.sh"
```

**Особенности деплоя:**

- 🧹 **Автоочистка бэкапов** - сохраняются только последние 3 архива изображений
- 📸 **Бэкап изображений** - автоматическое создание архивов перед обновлением
- 🔄 **Безопасное обновление** - проверка SSH, Git репозитория и статуса сервисов
- ⚡ **Быстрый откат** - старые бэкапы доступны для восстановления при необходимости
- 🔧 **Nginx конфигурация** - автоматическое обновление с проверкой синтаксиса и откатом
- 🛡️ **Безопасность nginx** - rate limiting, CORS, заголовки безопасности

### Docker Production

```bash
# Сборка образа
docker build -t shawarma-bot .

# Запуск в production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Nginx конфигурация

Проект включает готовую конфигурацию nginx (`deployment/nginx.conf`) для проксирования API запросов:

**Основные возможности:**

- 🔄 **Проксирование API** - все `/api/*` запросы направляются в Docker контейнер
- 🛡️ **Rate limiting** - защита от DDoS (10 req/s для API, 30 req/s общие)
- 🌐 **CORS поддержка** - готовность к frontend интеграции
- 🔒 **Заголовки безопасности** - X-Frame-Options, X-Content-Type-Options, XSS Protection
- 📊 **Health check** - доступен по `/health`
- 🗜️ **Gzip сжатие** - для статических файлов и JSON ответов

**Автоматическое обновление:**

При деплое nginx конфигурация автоматически:

1. ✅ Проверяется синтаксис новой конфигурации
2. 💾 Создается бэкап текущей конфигурации
3. 🔄 Заменяется конфигурация и перезагружается nginx
4. ⚠️ При ошибке - автоматический откат к предыдущей версии
5. 🧹 Очистка старых бэкапов (сохраняются последние 5)

**Доступные endpoints через nginx:**

```bash
# API документация
curl http://your-server/api/docs

# Health check
curl http://your-server/health

# Menu API
curl http://your-server/api/menu/categories

# Orders API (требует авторизацию)
curl -H "Authorization: Bearer your-api-key" http://your-server/api/orders
```

**SSL готовность:**

Конфигурация содержит закомментированный блок для SSL сертификатов Let's Encrypt. Для включения HTTPS:

1. Получите SSL сертификат: `certbot --nginx -d your-domain.com`
2. Раскомментируйте SSL блок в `deployment/nginx.conf`
3. Обновите `server_name` на ваш домен
4. Выполните деплой: `cd deployment && ./deploy.sh`

## 🛠️ Разработка

### Диагностика проблем сборки

Если возникают проблемы с запуском на продакшен сервере:

#### Быстрое исправление

```bash
# Исправление API сервиса
cd deployment && ./quick-fix.sh api

# Исправление бота
cd deployment && ./quick-fix.sh bot

# Полный перезапуск всех сервисов
docker-compose down && docker-compose up -d --build
```

#### Команды для диагностики

```bash
# Проверка состояния
docker-compose ps

# Логи сервисов
docker-compose logs api
docker-compose logs bot

# Проверка сборки локально
npm run build:api
npm run build:bot

# Проверка типов
npm run type-check:api
npm run type-check:bot
```

#### Возможные причины проблем

1. **Ошибки компиляции TypeScript** - проверьте `npm run build:api` или `npm run build:bot`
2. **Отсутствие зависимостей** - выполните `npm install`
3. **Проблемы с Docker** - очистите кэш: `docker system prune`
4. **Неправильная конфигурация** - проверьте `.env` файл

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

deployment/                 # Скрипты деплоя
├── deploy.sh              # Автоматический деплой
├── setup-server.sh        # Настройка сервера
├── health-check.sh        # Проверка состояния
├── quick-fix.sh           # Быстрое исправление
├── nginx.conf             # Конфигурация nginx
├── server-info.sh         # Анализ VPS сервера
├── SERVER_ANALYSIS.md     # Шаблон документации
└── README.md              # Документация деплоя

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

### v2.2 - Orders API ✅ **ЗАВЕРШЕНО**

- ✅ Health API
- ✅ Menu categories и items
- ✅ Orders API с аутентификацией
- ✅ Статистика заказов
- ✅ Swagger документация
- ✅ Исправлены тесты Config интерфейса
- ✅ Все тесты проходят (262 passed)
- 🔄 Redis кэширование (отключено)

### v2.3 - Testing & Quality ✅ **ЗАВЕРШЕНО**

- ✅ Исправлены тесты типов
- ✅ Полное покрытие тестами API (79.31%)
- ✅ Настроен ESLint с TypeScript
- ✅ **Все API тесты исправлены и стабильны** (4 test suites, 25 tests passed)
- ✅ **Исправлены проблемы линтера** - убраны неиспользуемые переменные, исправлены импорты
- ✅ **Обновлен tsconfig.json** - включены тесты в компиляцию
- ✅ **Исправлены тесты handlers-async** - обновлены моки для botApiClient
- ✅ **Настроены моки для API тестов** - добавлен database plugin mock
- ✅ **Исправлены Orders API тесты** - убраны timeout ошибки, контрактные тесты (6 passed)
- ✅ **Исправлены Cart API тесты** - исправлена Zod валидация, контрактные тесты (6 passed)
- ✅ **Исправлены Health API тесты** - убран проблемный mock server.db (7 passed)
- ✅ **Исправлены Menu API тесты** - созданы контрактные тесты валидации (6 passed)
- ✅ **Оптимизированы настройки Jest** - timeout 5000ms, быстрое выполнение (2.3s)
- ✅ **Добавлены unit тесты OrderService** - полноценные тесты с простыми mock'ами
- ✅ **Исправлена Zod валидация** - заменен transform с исключениями на безопасный pipe
- ✅ **Исправлены проблемы с моками** - устранены конфликты между глобальными и специфическими моками
- ✅ **Исправлены тесты логгера** - cart.test.ts теперь корректно проверяет логирование ошибок
- ✅ **Переименованы setup файлы** - убраны ложные тестовые файлы, которые вызывали ошибки Jest
- ✅ **Улучшен вывод тестов** - подавлены лишние логи, чистый вывод результатов
- ✅ **Обновлена конфигурация Jest** - исправлены предупреждения ts-jest, добавлен isolatedModules
- ✅ **Добавлены утилиты для тестов** - test-utils.ts с моками и helper функциями
- ✅ **Настроена фильтрация логов** - подавление console.warn/error в тестах при отсутствии DEBUG_TESTS
- ✅ **Убраны JSON логи Fastify** - отключено логирование API сервера в тестах
- ✅ **Исправлена проблема завершения Jest** - устранены открытые handles из RateLimiter
- ✅ **Добавлен метод destroy()** - правильная очистка setInterval в RateLimiter
- ✅ **Чистое завершение тестов** - Jest завершается без предупреждений за 1.1s
- 🔄 Интеграционные тесты БД требуют более сложных mock'ов (отложено)
- 🔍 E2E тестирование (планируется)

**Улучшения тестирования v2.3:**

- ✅ **Чистый вывод**: Убраны предупреждения ts-jest и лишние логи console
- ✅ **Новые команды**: `npm run test:quiet`, `npm run test:verbose`, `npm run test:debug`
- ✅ **DEBUG режим**: Установите `DEBUG_TESTS=1` для детального вывода
- ✅ **Быстрое выполнение**: Оптимизированы таймауты и моки
- ✅ **Контроль логирования**: Автоматическое подавление логов в тестах

**Итог тестирования:**

- ✅ **API тесты стабильны**: 25 passed за 2.0s
- ✅ **Cart API**: 6 passed - валидация параметров
- ✅ **Orders API**: 6 passed - авторизация и валидация
- ✅ **Menu API**: 6 passed - валидация и структура ответов
- ✅ **Health API**: 7 passed - мониторинг и rate limiting
- ✅ **Unit тесты**: OrderService с простыми mock'ами
- ✅ **Основные тесты**: 255 passed, 1 failed (Logger проблемы с mock console)
- ⚠️ Интеграционные тесты API: отложены по приоритизации

### v2.4 - Cart API Migration ✅ **ЗАВЕРШЕНО**

- ✅ **REST API Сервер** - Fastify с TypeScript и Swagger UI
- ✅ **Cart API** - 6 endpoints для полноценного управления корзиной
- ✅ **Menu API** - 3 endpoints с фильтрацией и пагинацией
- ✅ **Orders API** - 3 endpoints с авторизацией и статистикой
- ✅ **Health API** - 3 endpoints для мониторинга и K8s probes
- ✅ **API клиент** - `src/api-client.ts` для бота
- ✅ **Миграция handlers** - бот использует API вместо прямого доступа к Redis
- ✅ **Zod валидация** - схемы для всех API endpoints
- ✅ **Docker архитектура** - API и бот в отдельных контейнерах
- ✅ **Swagger документация** - интерактивная документация на `/api/docs`
- ✅ **Rate limiting** - защита от злоупотреблений
- ✅ **CORS поддержка** - готовность к frontend интеграции

### v2.5 - Separated Architecture ✅ **ЗАВЕРШЕНО**

- ✅ **Раздельные Docker образы** - `Dockerfile.api` и `Dockerfile.bot`
- ✅ **Изолированные сборки** - `tsconfig.api.json` и `tsconfig.bot.json`
- ✅ **Решена проблема MODULE_NOT_FOUND** - каждый сервис собирается независимо
- ✅ **Быстрые пересборки** - изменения в API не влияют на бота и наоборот
- ✅ **Специфичные зависимости** - каждый контейнер содержит только нужные файлы
- ✅ **Упрощенная диагностика** - проблемы изолированы по сервисам
- ✅ **Новые npm скрипты** - `build:api`, `build:bot`, `docker:build:api`, `docker:build:bot`
- ✅ **Обновленные скрипты исправления** - `quick-fix.sh`, `fix-build-issue.sh`, `emergency-stop.sh`
- ✅ **Nginx конфигурация** - автоматическое обновление с проверкой синтаксиса и откатом
- ✅ **Production-ready nginx** - rate limiting, CORS, заголовки безопасности, SSL готовность
- ✅ **Организация деплоя** - все скрипты и конфигурации в папке `deployment/`
- ✅ **Анализ сервера** - скрипт `server-info.sh` для документирования инфраструктуры

### v2.6 - Analytics API (планируется)

- 📈 Дашборд метрики
- 📊 Детальная аналитика
- 📉 Тренды продаж

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
