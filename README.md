# 🥙 Шаурма Бот

Production-ready Telegram-бот для заказа шаурмы с полным функционалом корзины, системой заказов, уведомлениями персонала и автоматическим деплоем.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](./CHANGELOG.md)
[![Tests](https://img.shields.io/badge/tests-227%20passed-green.svg)](./docs/COVERAGE.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](./tsconfig.json)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](./docker-compose.yml)

> **🎉 Бот уже запущен и работает!**  
> Найдите [@SaurmaOtRayhanaBot](https://t.me/SaurmaOtRayhanaBot) в Telegram и отправьте `/start`

## 🎯 Ключевые особенности

- ✅ **Полный функционал заказов** - корзина, оформление, история
- ✅ **Уведомления персонала** - автоматические оповещения о заказах
- ✅ **Фотографии блюд** - визуальное представление товаров
- ✅ **Архитектурные улучшения** - логирование, валидация, DI, rate limiting
- ✅ **Оптимизация производительности** - устранены N+1 запросы
- ✅ **CI/CD Pipeline** - автоматические тесты на main ветке
- ✅ **Качество кода** - ESLint, Prettier, 227 тестов
- ✅ **Production-ready** - Docker, health checks, мониторинг

## 🚀 Быстрый запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка бота

1. Создайте бота у [@BotFather](https://t.me/BotFather) в Telegram
2. Получите токен бота
3. Создайте файл `.env`:

```bash
BOT_TOKEN=ваш_токен_от_BotFather
NODE_ENV=production
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql://shawarma_user:shawarma_pass@postgres:5432/shawarma_db

# Для уведомлений персонала (опционально)
NOTIFICATIONS_CHAT_ID=-1001234567890
ADMIN_USER_IDS=123456789,987654321

# Для автоматического деплоя (опционально)
DEPLOY_SERVER_HOST=your-server.com
DEPLOY_SERVER_PORT=22
DEPLOY_SERVER_USER=root
DEPLOY_SERVER_PATH=~/shawarma-bot
```

### 3. Запуск

#### 🐳 Docker (рекомендуется)

```bash
# Быстрый старт с PostgreSQL, Redis и pgAdmin
npm run docker:up

# Проверка логов
npm run docker:logs

# Сервисы доступны на портах:
# - PostgreSQL: localhost:5433
# - Redis: localhost:6380
# - pgAdmin: localhost:8080
```

#### 💻 Локальная разработка

```bash
# Разработка
npm run dev

# Продакшн
npm run build && npm start
```

#### 🧪 Тестирование

```bash
# Все тесты
npm test

# С покрытием кода
npm test -- --coverage

# В режиме наблюдения
npm run test:watch
```

## 🛠️ Технологический стек

- **Runtime:** Node.js + TypeScript
- **Telegram API:** node-telegram-bot-api
- **Database:** PostgreSQL 15 (в Docker)
- **Cache:** Redis 7 (для корзины покупок)
- **Containerization:** Docker + Docker Compose
- **Testing:** Jest (154 теста)
- **Code Quality:** ESLint + Prettier + Husky

## 📁 Структура проекта

```
food/
├── src/                      # TypeScript исходники
│   ├── bot.ts               # Главный файл бота
│   ├── handlers.ts          # Обработчики команд
│   ├── notifications.ts     # Уведомления персонала
│   ├── database.ts          # PostgreSQL
│   ├── cart.ts              # Redis корзина
│   ├── menu.ts              # Данные меню
│   └── types.ts             # TypeScript типы
├── assets/                   # Фотографии блюд
├── docs/                     # Документация
├── __tests__/                # Тесты (154 теста)
├── docker-compose.yml        # Docker оркестрация
├── deploy.sh                 # Скрипт деплоя
├── setup-server.sh           # Настройка сервера
└── CHANGELOG.md              # История изменений
```

## 📋 Функционал

### 🛒 Корзина покупок

- Добавление/удаление товаров
- Изменение количества (➕/➖)
- Просмотр с общей суммой
- Автоочистка через 1 час

### 📦 Система заказов

- Оформление из корзины
- Сохранение в PostgreSQL
- История заказов
- Статусы заказов

### 🔔 Уведомления персонала

- Автоматические оповещения о новых заказах
- Кнопки управления для администраторов
- Изменение статусов заказов
- Проверка прав доступа

### 🖼️ Фотографии блюд

- Изображения для всех позиций шаурмы
- Автоматическая отправка при выборе
- Индикация товаров с фото (📸)

## 🚀 Деплой на сервер

### Новый сервер (2 команды)

```bash
# 1. Настройка сервера (на сервере)
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/setup-server.sh | bash

# 2. Деплой (с локальной машины)
./deploy.sh
```

### Обновление (1 команда)

```bash
./deploy.sh
```

## 📖 Документация

- [📋 История изменений](./CHANGELOG.md)
- [🚀 Быстрый старт](./docs/QUICKSTART.md)
- [🐳 Docker документация](./docs/DOCKER.md)
- [🚀 Руководство по деплою](./docs/DEPLOYMENT.md)
- [🐛 Отладка](./docs/DEBUG.md)
- [📊 Покрытие тестами](./docs/COVERAGE.md)

## 📊 Статистика v2.0.0

- **Тесты:** 227 тестов (81.7% покрытие кода, 100% критических модулей)
- **Код:** 15+ TypeScript модулов
- **Docker:** 4 контейнера (Bot, PostgreSQL, Redis, pgAdmin)
- **Автоматизация:** 4 bash скрипта для деплоя
- **Меню:** 15 позиций (12 шаурмы + 3 напитка)

## 🎯 Готовность к продакшену

- ✅ Современная архитектура с лучшими практиками
- ✅ Оптимизированная производительность
- ✅ Комплексная безопасность
- ✅ Автоматизированное тестирование CI/CD
- ✅ Мониторинг и логирование
- ✅ Подробная документация

## 🚀 Планы на версию 3.0.0

### 📊 База данных и API

- ✅ **Анализ БД завершен** - [Документация схемы](./docs/DATABASE_SCHEMA.md)
- 🔄 **REST API (только чтение)** - [План реализации](./docs/API_PLAN.md)
- 🔄 **Swagger документация** - автогенерация OpenAPI
- 🔄 **Админка** - веб-интерфейс для управления заказами
- 🔄 **Лендинг** - публичная страница с меню

### 🏗️ Архитектура API v1.0

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   REST API      │    │   Database      │
│                 │    │                 │    │                 │
│ • Админка       │◄───┤ • Express.js    │◄───┤ • PostgreSQL    │
│ • Лендинг       │    │ • TypeScript    │    │ • Redis (cache) │
│ • Дашборд       │    │ • Swagger UI    │    │ • Connection    │
│                 │    │ • Rate Limiting │    │   Pooling       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 📡 Планируемые API endpoints

#### 🍽️ Menu API

- `GET /api/menu/categories` - категории меню
- `GET /api/menu/items` - товары с фильтрацией
- `GET /api/menu/items/:id` - детали товара

#### 📦 Orders API (админы)

- `GET /api/orders` - список заказов с фильтрацией
- `GET /api/orders/:id` - детали заказа
- `GET /api/orders/stats` - статистика заказов

#### 📊 Analytics API

- `GET /api/analytics/dashboard` - данные для дашборда
- `GET /api/analytics/sales` - аналитика продаж
- `GET /api/analytics/items` - популярные товары

#### 🏥 Health API

- `GET /api/health` - состояние сервисов
- Мониторинг PostgreSQL, Redis, Telegram Bot

### 🔒 Безопасность

- **Публичные endpoints** - меню, цены (без аутентификации)
- **Админские endpoints** - заказы, статистика (API ключи)
- **Rate limiting** - 100 req/min публичные, 1000 req/min админы

### 📈 Структура БД (уже реализована)

**6 таблиц:**

- `users` - пользователи Telegram (BIGINT ID)
- `categories` - категории меню (шаурма, напитки)
- `menu_items` - товары с ценами и изображениями
- `orders` - заказы со статусами
- `order_items` - состав заказов
- `cart_items` - корзина покупок

**Особенности:**

- Оптимизированные индексы для производительности
- Автоматические триггеры для updated_at
- Связи с CASCADE DELETE где необходимо
- 15 товаров в меню (12 шаурмы + 3 напитка)

### 🎯 Этапы реализации

1. **Фаза 1** (1-2 дня) - Express сервер, Health API, Swagger
2. **Фаза 2** (1 день) - Menu API с кэшированием
3. **Фаза 3** (2 дня) - Orders API с фильтрацией
4. **Фаза 4** (1-2 дня) - Analytics API и дашборд
5. **Фаза 5** (1 день) - Безопасность и оптимизация

---

**Версия:** 2.0.0 | **Лицензия:** MIT | **Автор:** [@mrbzzz](https://github.com/mrbzzz)
