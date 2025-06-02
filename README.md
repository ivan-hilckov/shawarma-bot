# 🌯 Shawarma Bot

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![Tests](https://img.shields.io/badge/tests-468%20passed-brightgreen.svg)
![Coverage](https://img.shields.io/badge/coverage-86%25-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

**Production-ready Telegram бот с REST API для заказа шаурмы** 🚀

## 📚 Документация

### ��️ Архитектура

- **[🎯 User Experience](docs/USER_EXPERIENCE.md)** - Пользовательский опыт и UX дизайн бота ✨
- **[🤖 Bot Architecture](docs/BOT_ARCHITECTURE.md)** - Детальная архитектура Telegram бота
- **[🚀 API Architecture](docs/API_ARCHITECTURE.md)** - Архитектура REST API на Fastify
- **[📱 Landing Pages](docs/LANDING_PAGES.md)** - Документация по лендинговым страницам
- **[🖥️ VPS Analysis](docs/VPS_ANALYSIS.md)** - Анализ инфраструктуры и сервера

### 📋 Руководства

- **[🚀 Deploy Checklist](DEPLOY_CHECKLIST.md)** - Чек-лист для деплоя
- **[🔄 Changelog](CHANGELOG.md)** - История изменений
- **[📝 Scripts Guide](SCRIPTS.md)** - Описание скриптов деплоя

## ✨ Основные возможности

### 🤖 Telegram Bot (обновленный UX v2.10)

- 🎯 **Упрощенное меню** - 5 кнопок вместо 8, снижение сложности на 37.5%
- 🛒 **Умная корзина** - полностью работающий переход в корзину из карточек товаров, кнопка без отвлекающих счетчиков
- 👤 **Централизованный профиль** - заказы и личная статистика в одном месте
- 📦 **Упрощенные карточки товаров** - убрана кнопка "Убрать все из корзины" для улучшения UX
- 📋 **Минималистичный список заказов** - упрощен интерфейс "Ваши заказы", убраны дополнительные кнопки
- 🛒 **Умное оформление заказа** - красивое сообщение об успехе с автоматическим переходом к заказам
- ⭐ **Система избранного** - сохранение любимых товаров для быстрого заказа
- 💰 **Прозрачное ценообразование** - автоматический подсчет с детализацией
- 🔔 **Умные уведомления** - для персонала о новых заказах с админ-панелью
- 📱 **Интегрированный Mini App** - доступ через раздел "О нас" без навязывания ✨

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
│ • Mini App URLs │    │ • Auto Docs     │    │   Pooling       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ▲                        ▲
        │                        │
        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│ Telegram Mini   │    │   Static Web    │
│ App (WebView)   │    │   Server        │
│ • Client Route  │◄───┤ • public/       │
│ • Telegram SDK  │    │ • nginx         │
│ • Hash Routing  │    │ • SSL Ready     │
│ • Theme Adapt   │    │ • 6 Domains     │
└─────────────────┘    └─────────────────┘
```

**Новая архитектура v2.7 с Mini App:**

- 🔄 **Отдельные Docker образы** - `Dockerfile.api` и `Dockerfile.bot`
- 📦 **Изолированные сборки** - `tsconfig.api.json` и `tsconfig.bot.json`
- 📱 **Telegram Mini App** - веб-приложение в Telegram WebView
- 🌐 **Статические страницы** - nginx обслуживает 6 доменов + Mini App
- ⚡ **Быстрые пересборки** - изменения в API не влияют на бота и наоборот
- 🎯 **Специфичные зависимости** - каждый контейнер содержит только нужные файлы
- 🔧 **Упрощенная диагностика** - проблемы изолированы по сервисам

> 📖 **Подробная документация по архитектуре:**
>
> - [🤖 Bot Architecture](docs/BOT_ARCHITECTURE.md) - Event Router, Handlers, Services
> - [🚀 API Architecture](docs/API_ARCHITECTURE.md) - Fastify Server, Routes, Validation

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

#### 🤖 Cursor Background Agents

Проект настроен для работы с **Cursor Background Agents** - запуск асинхронных агентов в удаленной среде:

```bash
# В Cursor Editor
Cmd + ' (или Ctrl + ') → "New Background Agent"
```

**Что настроено автоматически:**

- ✅ Node.js 18 + Docker + Docker Compose
- ✅ Установка npm зависимостей и сборка TypeScript
- ✅ Автозапуск PostgreSQL, Redis, pgAdmin
- ✅ Development режим API и Bot с auto-reload
- ✅ Готовая среда для тестирования

**4 терминала готовы к работе:**

- `docker-services` - PostgreSQL, Redis, pgAdmin
- `api-dev` - REST API с автоперезагрузкой
- `bot-dev` - Telegram Bot с автоперезагрузкой
- `test-runner` - терминал для тестов и отладки

📋 **Подробная документация:** [.cursor/README.md](.cursor/README.md)

> ⚠️ **Важно:** Добавьте ваш BOT_TOKEN в .env файл после первого запуска

## 📡 API Документация

### Доступ к Swagger UI

После запуска API сервера документация доступна по адресу:

- **Development**: http://localhost:3000/api/docs
- **Production**: https://api.shawarma-bot.com/api/docs

### 🌍 Доступные домены с лендинговыми страницами

Проект развернут на 6 доменах, каждый с уникальной индексовой страницей:

- 🏪 **botgarden.store** - основной магазин Shawarma Bot (production-ready)

  - Полнофункциональная страница с интеграцией API
  - Демонстрация возможностей бота и REST API
  - Ссылки на Swagger UI и health check

- 🛒 **botgarden.shop** - торговая площадка ботов (🚧 в разработке)

  - Концепция marketplace готовых Telegram ботов
  - Планы на кастомизацию и аналитику
  - Красивая страница с описанием будущего функционала

- 🔧 **botgarden.tech** - техническая документация (для разработчиков)

  - Терминальный дизайн с монопространным шрифтом
  - Анимированный индикатор статуса API
  - Ссылки на документацию и руководства

- 🌐 **botcraft.tech** - сервис крафт-ботов (🔮 концепт будущего)

  - Визуальный конструктор ботов drag & drop
  - Светящиеся анимации и 3D эффекты
  - Пошаговое описание процесса создания

- 🎮 **botgrover.fun** - игровые боты (🎯 планируется)

  - Яркий дизайн с множеством CSS анимаций
  - Интерактивная JavaScript мини-игра "Угадай число"
  - Карточки с описанием игровых ботов

- 🇷🇺 **botgrover.ru** - российская локализация (🛠️ в планах)
  - Дизайн с элементами российского флага
  - Описание интеграций с российскими сервисами
  - Соответствие законодательству РФ

**Доступ к API через любой домен:**

- http://botgarden.store/api/docs - Swagger UI
- http://botgarden.store/health - Health check
- http://botgarden.store/api/menu/categories - Menu API

**Автоматическое развертывание лендингов:**

При деплое автоматически настраиваются все веб-страницы:

```bash
cd deployment && ./deploy.sh  # Включает настройку лендингов
```

Подробная документация: [docs/LANDING_PAGES.md](docs/LANDING_PAGES.md)

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

# Новые команды тестирования v2.3+
npm run test:quiet     # Тесты без лишних логов
npm run test:verbose   # Подробный вывод тестов
npm run test:debug     # Дебаг режим (установите DEBUG_TESTS=1)
```

**Улучшения тестирования v2.3:**

- ✅ **Чистый вывод** - убраны предупреждения ts-jest и лишние логи
- ✅ **DEBUG режим** - установите `DEBUG_TESTS=1` для детального вывода логов
- ✅ **Быстрое выполнение** - оптимизированы таймауты и моки (выполнение за ~2s)
- ✅ **API тесты стабильны** - 25 passed (Cart, Orders, Menu, Health API)

**Новые тесты v2.7 - Telegram Mini App:**

- ✅ **Handlers тесты** - покрытие новых обработчиков `handleAboutMiniApp`, `handleBackToStart`
- ✅ **Mini App тесты** - тестирование клиентского JavaScript кода
- ✅ **WebApp SDK** - проверка инициализации и интеграции с Telegram
- ✅ **Навигация** - тестирование клиентского роутинга между страницами
- ✅ **UI взаимодействие** - тесты функций openCategory, testTelegramData, loadOrders

**Значительно улучшено покрытие API (v3.0):**

- 🎯 **API Schemas** - с 55.55% до **100%** покрытия
  - Полная валидация схем заказов (OrderStatsSchema, OrdersResponseSchema)
  - Тестирование схем пользователей (UserUpsertSchema, UserParamsSchema)
  - Проверка всех edge cases и граничных значений
- 🎯 **UserService** - с 0% до **100%** покрытия
  - Полные тесты всех методов (upsertUser, getUserById, getUserOrders, getUsers, getUserStats)
  - Тестирование error handling и edge cases
  - Проверка корректности SQL запросов и обработки результатов
- ✅ **Database Plugin** - базовые тесты инициализации и мокирования
- ✅ **Исправлены все failing тесты** - понимание реального поведения схем валидации

```bash
# Запуск тестов Mini App
npm test -- handlers.test.ts     # Тесты новых обработчиков бота
npm test -- miniapp.test.ts      # Тесты клиентского JavaScript кода

# Проверка всех тестов
npm test                          # Все тесты включая новые Mini App тесты
npm run test:coverage             # С покрытием кода
```

## 🔧 Конфигурация

### Переменные окружения

```env
# Telegram Bot
BOT_TOKEN=your_telegram_bot_token
NOTIFICATIONS_CHAT_ID=your_notifications_chat_id
ADMIN_USER_IDS=123456789,987654321

# Assets Configuration
ASSETS_BASE_URL=https://botgarden.store/assets

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
- 🌍 **Лендинговые страницы** - автоматическая настройка всех 6 доменов

### Исправленные проблемы деплоя v2.6

🔧 **Исправлены критические ошибки в deployment:**

1. **nginx.conf** - убраны недопустимые `break` директивы в `if` блоках

   - Использован `rewrite` вместо `try_files` внутри условий
   - Добавлен отдельный `location` блок для обработки HTML файлов
   - Конфигурация теперь проходит `nginx -t` проверку

2. **setup-landing-pages.sh** - исправлена команда `chmod` с wildcard
   - Заменено `chmod -R 644 "$WEB_DIR/public/*.html"`
   - На `find "$WEB_DIR/public" -name "*.html" -type f -exec chmod 644 {} \;`
   - Команда теперь корректно устанавливает права на HTML файлы

**Результат:** деплой проходит без ошибок, все 6 лендинговых страниц работают корректно.

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

public/                     # Лендинговые страницы доменов
├── index.html             # botgarden.store - основной магазин
├── shop.html              # botgarden.shop - торговая площадка
├── tech.html              # botgarden.tech - техническая документация
├── craft.html             # botcraft.tech - сервис крафт-ботов
├── fun.html               # botgrover.fun - игровые боты
└── ru.html                # botgrover.ru - российская локализация

deployment/                 # Скрипты деплоя и конфигурация
├── deploy.sh              # Автоматический деплой
├── setup-server.sh        # Настройка сервера
├── setup-landing-pages.sh # Настройка веб-страниц
├── health-check.sh        # Проверка состояния
├── quick-fix.sh           # Быстрое исправление
├── server-info.sh         # Анализ VPS сервера
├── nginx.conf             # Production конфигурация nginx
└── README.md              # Документация деплоя

docs/                       # Документация проекта
├── LANDING_PAGES.md       # Документация веб-страниц
├── VPS_ANALYSIS.md        # Анализ VPS сервера
├── SERVER_MONITORING.md   # Руководство по мониторингу
└── *.md                   # Другая документация

__tests__/
├── api/                   # Тесты API
└── unit/                  # Unit тесты
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

### v2.5.3 - Landing Pages ✅ **ЗАВЕРШЕНО**

- ✅ **6 уникальных лендинговых страниц** - индивидуальный дизайн для каждого домена
- ✅ **Автоматическое развертывание** - скрипт `setup-landing-pages.sh` интегрирован в деплой
- ✅ **Nginx конфигурация доменов** - условная логика для обслуживания разных страниц
- ✅ **Адаптивный дизайн** - все страницы работают на мобильных устройствах
- ✅ **Интерактивные элементы** - CSS анимации, JavaScript игра, API интеграция
- ✅ **Кросс-ссылки** - навигация между всеми доменами экосистемы
- ✅ **Production готовность** - автоматическая настройка прав доступа и nginx
- ✅ **Документация** - полное описание в `docs/LANDING_PAGES.md`

### v2.6 - UX Optimization ✅ **ЗАВЕРШЕНО**

- ✅ **Упрощение главного меню** - 8 кнопок → 5 кнопок (снижение сложности на 37.5%)
- ✅ **Централизованный профиль** - объединение заказов, избранного и рекомендаций
- ✅ **Улучшенные каталоги** - убраны отвлекающие быстрые кнопки, фокус на выборе товара
- ✅ **Умные карточки товаров** - адаптивные кнопки в зависимости от состояния корзины
- ✅ **Интеграция Mini App** - естественное размещение в разделе "О нас"
- ✅ **UX документация** - создан подробный гайд `docs/USER_EXPERIENCE.md`
- ✅ **Обновленная архитектура** - актуализация `docs/BOT_ARCHITECTURE.md`
- ✅ **Полное тестирование** - все 265 тестов обновлены и проходят успешно

**UX улучшения:**

- 🎯 **Простота:** интуитивно понятная навигация без когнитивной перегрузки
- 📱 **Мобильная оптимизация:** кнопки оптимального размера для касания
- 🧠 **Умное поведение:** интерфейс адаптируется под действия пользователя
- ⭐ **Персонализация:** статистика, избранное и рекомендации для каждого пользователя

### v2.7 - Critical Bug Fixes ✅ **ЗАВЕРШЕНО**

- ✅ **КОРНЕВАЯ ПРОБЛЕМА: Исправлен порядок callback роутинга** - длинные префиксы (`increase_from_item_`) теперь обрабатываются ПЕРЕД короткими (`increase_`)
- ✅ **Исправлена проблема с кнопками +/- на карточках товаров** - теперь корректно работают после добавления в корзину
- ✅ **Решена проблема с фото товаров** - `refreshItemDisplay` правильно обрабатывает как текстовые сообщения, так и фото
- ✅ **Устранены дублирующиеся сообщения** - удален вызов `handleItemSelection` из `handleAddToCart`
- ✅ **Улучшена обработка ошибок** - добавлено подробное логирование для отладки проблем
- ✅ **Атомарные операции с корзиной** - функция `updateCartItemAtomically` обеспечивает консистентность данных
- ✅ **Исправлено сообщение "Loading..."** - пользователи получают немедленную обратную связь при нажатии кнопок

**Технические исправления:**

- 🎯 **КРИТИЧНО:** Переставлен порядок callback обработчиков в `bot.ts` - специфичные префиксы перед общими
- 🔧 **refreshItemDisplay()** - проверка типа сообщения (фото vs текст) перед редактированием
- 🔧 **handleAddToCart()** - использует `refreshItemDisplay` вместо создания нового сообщения
- 🔧 **updateCartItemAtomically()** - подробное логирование всех операций с корзиной
- 🔧 **Error handling** - fallback сообщения при критических ошибках интерфейса

**Диагностика проблемы:**

- 🐛 Callback `increase_from_item_1` попадал в `handleIncreaseQuantity` вместо `handleIncreaseFromItem`
- 🔍 Причина: `increase_` проверялся ПЕРЕД `increase_from_item_` в if-else цепочке
- ✅ Решение: изменен порядок проверок в `bot.ts` - длинные префиксы первыми

### v2.9 - Interface Simplification ✅ **ЗАВЕРШЕНО**

- ✅ **Упрощен экран заказов** - убраны кнопки с номерами заказов "Заказ #number"
- ✅ **Минималистичный дизайн** - только информация о заказах и кнопка "Назад к профилю"
- ✅ **Убран обработчик деталей заказов** - удален `handleOrderDetails` и связанный роутинг
- ✅ **Упрощена кнопка корзины** - убран счетчик товаров, теперь всегда "🛒 Корзина"
- ✅ **Уведомления пользователю** - при изменении статуса заказа пользователю приходит дружелюбное уведомление
- ✅ **Оптимизирован код** - убрана неиспользуемая функциональность

**Причины упрощения:**

- 📊 **Фокус на ключевой информации** - пользователи видят статус и сумму заказа сразу
- 🚀 **Быстрая навигация** - меньше переходов, проще вернуться к основным функциям
- 📱 **Мобильная оптимизация** - лучше работает на небольших экранах
- 🎯 **Снижение когнитивной нагрузки** - меньше кнопок = проще выбор

### v2.10 - Checkout UX Enhancement ✅ **ЗАВЕРШЕНО**

- ✅ **Улучшено сообщение об успешном заказе** - красивое оформление с эмодзи и подробной информацией
- ✅ **Автоматический переход к заказам** - после оформления пользователь сразу попадает в "Мои заказы"
- ✅ **Детальное логирование** - полное отслеживание процесса оформления для диагностики
- ✅ **Устойчивая обработка ошибок** - fallback механизмы для отправки сообщений
- ✅ **Улучшенная обратная связь** - информативные уведомления на каждом этапе

**Что улучшено в оформлении заказа:**

- 📝 **Красивое сообщение об успехе** - структурированная информация с эмодзи
- 🔄 **Прямой переход к заказам** - пользователь сразу видит свой новый заказ
- 🛡️ **Надежность** - двойная проверка отправки сообщений с fallback
- 📊 **Мониторинг** - подробные логи для отслеживания процесса

### v2.11 - Analytics API (планируется)

- 📈 Дашборд метрики пользователей и заказов
- 📊 Детальная аналитика поведения в новом UX
- 📉 Тренды продаж и конверсии после упрощения меню
- 🎯 A/B тестирование UX решений

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

**Сделано с ❤️ для любителей шаурмы**

### 📱 Telegram Mini App ✨ НОВОЕ

**Полнофункциональное веб-приложение, интегрированное прямо в Telegram!**

#### 🚀 Основные возможности

- 🌯 **Клиентский роутинг** - навигация между страницами без перезагрузки
- 🎨 **Адаптивная тема** - автоматическое соответствие теме Telegram пользователя
- 🛒 **Корзина и заказы** - интерактивное управление через веб-интерфейс
- 📊 **Отслеживание заказов** - история и статусы в реальном времени
- 🚀 **Нативная интеграция** - использует официальный Telegram WebApp SDK
- 📱 **Мобильная оптимизация** - идеальная работа на всех устройствах

#### 🎯 Функционал

- **Главная страница** - меню категорий и информация о пользователе
- **Список заказов** - история заказов с детальной информацией
- **Навигация** - быстрое переключение между страницами
- **Тестирование данных** - проверка интеграции с Telegram

#### 🛠️ Технические особенности

- **HTML5 + CSS3 + Vanilla JS** - без сторонних фреймворков
- **CSS переменные Telegram** - использует официальную палитру
- **Hash routing** - поддержка браузерной навигации
- **Telegram Web App API** - полная интеграция с мессенджером
- **Graceful degradation** - работает и вне Telegram

#### 🚀 Запуск Mini App

1. **Отправьте /start боту** - получите кнопку запуска приложения
2. **Или нажмите "📱 Mini App" в меню** - быстрый доступ из основного меню
3. **Нажмите "🌯 Открыть Шаурма App"** - Mini App откроется в Telegram
4. **Используйте навигацию** - переключайтесь между страницами
5. **Проверьте данные** - кнопка покажет информацию о вашем профиле

#### 📝 Тестирование Mini App

Мини-приложение покрыто тестами:

```bash
# Тесты handlers для новых обработчиков
npm test -- handlers.test.ts

# Тесты Mini App функционала
npm test -- miniapp.test.ts
```

**Покрытие тестами:**

- ✅ Обработчики бота (`handleAboutMiniApp`, `handleBackToStart`)
- ✅ Инициализация Telegram WebApp SDK
- ✅ Навигация между страницами
- ✅ Функции взаимодействия с пользователем
- ✅ Загрузка и отображение данных

## ✨ Новое в версии 3.0.0

### 🎯 Улучшения пользовательского опыта

- ✅ **Уведомления о статусе заказа** - пользователи получают дружелюбные уведомления об изменениях статуса
- ✅ **Улучшенное оформление заказов** - структурированные сообщения с автоматическим переходом к заказам
- ✅ **Надежная обработка статусов** - корректные emoji и понятные тексты для всех статусов
- ✅ **Оптимизированная навигация** - плавные переходы между разделами

### 🛠️ Технические улучшения

- ✅ **Расширенное тестовое покрытие** - 450 тестов (+72%), покрытие 69.57%
- ✅ **Новые тесты для критических файлов** - api-client.ts (91%) и bot.ts (67%)
- ✅ **Исправлены критические баги** - надежность уведомлений и обработки заказов
- ✅ **Улучшенная архитектура** - dependency injection и централизованные сервисы
- ✅ **Production-ready** - полная готовность к высоким нагрузкам
