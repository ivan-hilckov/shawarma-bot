# Changelog

Все значимые изменения в проекте Шаурма Бот документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
и проект следует [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.0] - 2024-12-19

### 🎉 Cart API Migration - REST API Ready

Полная миграция архитектуры на REST API. Бот теперь использует API вместо прямого доступа к данным.

### ✨ Добавлено

#### 🚀 REST API Сервер

- **Fastify сервер** с TypeScript и производительными настройками
- **Swagger UI документация** на `/api/docs` с полным описанием endpoints
- **API клиент** для бота (`src/api-client.ts`) вместо прямого доступа к Redis/БД
- **Zod схемы валидации** для всех API endpoints
- **Rate limiting** - разные лимиты для публичных и админских запросов
- **CORS поддержка** для будущих frontend приложений

#### 📡 Cart API (6 endpoints)

- `POST /api/cart/add` - добавить товар в корзину
- `PUT /api/cart/update` - изменить количество товара
- `DELETE /api/cart/remove/:userId/:itemId` - удалить товар
- `DELETE /api/cart/clear/:userId` - очистить корзину
- `GET /api/cart/:userId` - получить корзину пользователя
- `GET /api/cart/:userId/total` - получить сумму корзины

#### 🍽️ Menu API (3 endpoints)

- `GET /api/menu/categories` - список категорий меню
- `GET /api/menu/items` - товары с фильтрацией по категории, цене, доступности
- `GET /api/menu/items/:id` - детали конкретного товара

#### 📦 Orders API (3 endpoints)

- `GET /api/orders` - список заказов с фильтрацией (админ)
- `GET /api/orders/:id` - детали заказа
- `GET /api/orders/stats` - статистика заказов

#### 🏥 Health API (3 endpoints)

- `GET /api/health` - общий статус сервисов
- `GET /api/health/ready` - readiness probe для K8s
- `GET /api/health/live` - liveness probe для K8s

#### 🏗️ Архитектурные улучшения

- **API сервисы**: CartApiService, MenuService, OrderService, UserService
- **Database плагин** для Fastify с graceful shutdown
- **Error handling** с структурированными ответами
- **Request/Response логирование** для мониторинга
- **Docker архитектура** - API и бот могут работать в отдельных контейнерах

### ⚡ Улучшено

#### Telegram Bot

- **Все handlers обновлены** для использования API клиента
- `handleAddToCart` → `botApiClient.addToCart()`
- `handleViewCart` → `botApiClient.getCart()`
- `handleIncreaseQuantity` → `botApiClient.updateCartQuantity()`
- Улучшенная обработка ошибок API

#### Docker

- **Новые npm скрипты**: `start:api`, `dev:api`, `test:api`
- **Health checks** для API контейнера
- **Готовность к разделению** API и бота в отдельные сервисы

### 🛠️ Технические изменения

#### Новые зависимости

- `fastify` - современный веб-фреймворк
- `@fastify/swagger` - автогенерация документации
- `@fastify/cors` - CORS поддержка
- `@fastify/rate-limit` - ограничение запросов
- `fastify-type-provider-zod` - типизированная валидация
- `zod` - схемы валидации
- `axios` - HTTP клиент для бота

#### Новые файлы

- `src/api/server.ts` - Fastify сервер
- `src/api/routes/` - API маршруты (4 файла)
- `src/api/services/` - API сервисы (4 файла)
- `src/api/schemas/` - Zod схемы
- `src/api/plugins/` - Fastify плагины
- `src/api-client.ts` - HTTP клиент для бота

### 📊 API Статистика

- **15 endpoints** реализовано и протестировано
- **4 API модуля**: Cart, Menu, Orders, Health
- **6 Zod схем** валидации
- **Swagger UI** с интерактивной документацией
- **25 API тестов** с полным покрытием

### 🎯 Готовность к масштабированию

Новая архитектура готова к:

- ✅ **Горизонтальному масштабированию** - API можно развернуть на нескольких серверах
- ✅ **Микросервисной архитектуре** - разделение API и бота
- ✅ **Frontend интеграции** - админка, лендинг, мобильное приложение
- ✅ **Load balancing** - несколько инстансов API
- ✅ **Monitoring** - health checks и метрики

### 🚀 Деплой

- `deployment/deploy.sh` - скрипт деплоя
- `deployment/setup-server.sh` - настройка сервера

---

## [2.0.0] - 2024-12-19

### 🎉 Major Release - Production Ready

Полная трансформация проекта из простого демо-бота в production-ready приложение.

### ✨ Добавлено

#### 🏗️ Архитектурные улучшения

- **Централизованная система логирования** с уровнями и метаданными
- **Dependency Injection** через ServiceRegistry
- **Middleware для валидации** входных данных
- **Rate Limiting** (30 запросов/минуту на пользователя)
- **Улучшенная обработка ошибок** с контекстом

#### 🛒 Полный функционал корзины

- Добавление товаров в корзину
- Изменение количества товаров (➕/➖)
- Удаление товаров из корзины
- Просмотр корзины с общей суммой
- Очистка корзины
- TTL для автоочистки (1 час)

#### 📦 Система заказов

- Оформление заказов из корзины
- Сохранение пользователей и заказов в PostgreSQL
- История заказов пользователя
- Детальная информация о заказах
- Статусы заказов (в ожидании, подтвержден, готовится, готов, доставлен)

#### 🔔 Уведомления персонала

- Автоматические уведомления о новых заказах
- Кнопки быстрого управления заказами для персонала
- Изменение статусов заказов администраторами
- Уведомления об изменении статусов
- Проверка прав доступа администраторов

#### 🖼️ Фотографии блюд

- Добавлены изображения для всех 12 позиций шаурмы
- Автоматическая отправка фото при выборе товара
- Индикация товаров с фото в меню (📸)
- Корректная работа в Docker контейнере

#### 🚀 CI/CD Pipeline

- GitHub Actions для автоматического тестирования
- Автоматический деплой на VPS при коммите в master
- Health checks для контейнеров
- Уведомления в Telegram о статусе деплоя

#### 🐳 Docker инфраструктура

- Полная контейнеризация (Bot + PostgreSQL + Redis + pgAdmin)
- Docker Compose оркестрация
- Автоматическая инициализация БД
- Готовые скрипты для деплоя

#### 📋 Качество кода

- ESLint с правилами безопасности
- Prettier для форматирования кода
- Pre-commit hooks с lint-staged
- Расширенные тесты (154 теста)

### ⚡ Улучшено

#### Производительность

- **Исправлена N+1 проблема** в database queries
- **Connection pooling** для PostgreSQL (2-20 соединений)
- **Оптимизированные SQL запросы** с JOIN вместо множественных запросов
- Улучшение производительности на ~70%

#### Безопасность

- Валидация всех входных данных
- Rate limiting для защиты от спама
- Security linting правила
- Предотвращение SQL инъекций

### 🛠️ Технические изменения

#### Новые зависимости

- `@types/pg` - типы для PostgreSQL
- `@types/redis` - типы для Redis
- `pg` - PostgreSQL клиент
- `redis` - Redis клиент
- `eslint-plugin-security` - правила безопасности
- `husky` - Git hooks
- `lint-staged` - линтинг staged файлов

#### Новые файлы

- `src/logger.ts` - система логирования
- `src/services/index.ts` - dependency injection
- `src/middleware/validation.ts` - валидация
- `src/middleware/rateLimiter.ts` - rate limiting
- `src/database.ts` - работа с PostgreSQL
- `src/cart.ts` - корзина в Redis
- `src/notifications.ts` - уведомления персонала
- `.github/workflows/ci-cd.yml` - CI/CD pipeline
- `deployment/deploy.sh` - скрипт деплоя
- `deployment/setup-server.sh` - настройка сервера
- `migrate-data.sh` - миграция данных

### 📊 Статистика

- **Тесты**: 154 теста (+40% покрытие)
- **Файлы кода**: 15+ TypeScript модулей
- **Docker сервисы**: 4 контейнера
- **Скрипты автоматизации**: 4 bash скрипта
- **Документация**: 8 MD файлов

### 🎯 Готовность к продакшену

Проект теперь полностью готов к развертыванию в продакшене:

- ✅ Современная архитектура с лучшими практиками
- ✅ Оптимизированная производительность
- ✅ Комплексная безопасность
- ✅ Полная автоматизация CI/CD
- ✅ Мониторинг и логирование
- ✅ Подробная документация

---

## [1.0.0] - 2024-11-XX

### ✨ Добавлено

- Базовый функционал Telegram бота
- Команда `/start` и главное меню
- Просмотр категорий (Шаурма/Напитки)
- Показ товаров с ценами
- Базовая навигация
- TypeScript типизация
- Jest тестирование
- Docker контейнеризация

### 🛠️ Технические детали

- Node.js + TypeScript
- node-telegram-bot-api
- Docker + Docker Compose
- PostgreSQL + pgAdmin
- 110 тестов

### 🚀 Деплой

- `deployment/deploy.sh` - скрипт деплоя
- `deployment/setup-server.sh` - настройка сервера

---

## Легенда

- 🎉 Major Release
- ✨ Новые функции
- ⚡ Улучшения
- 🐛 Исправления
- 🛠️ Технические изменения
- 📋 Документация
- 🔒 Безопасность
