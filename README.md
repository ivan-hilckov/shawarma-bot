# 🌯 Shawarma Bot

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![Tests](https://img.shields.io/badge/tests-547%20passed-brightgreen.svg)
![Coverage](https://img.shields.io/badge/coverage-77.07%25-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

**Production-ready Telegram бот с REST API для заказа шаурмы** 🚀

## 🎯 Что это

Современный Telegram бот для заказа еды с удобным интерфейсом, REST API и веб-приложением. Готов к продакшену с полным тестовым покрытием и автоматическим деплоем.

### ✨ Основные возможности

- 🤖 **Telegram Bot** - интуитивный интерфейс для заказов
- 🚀 **REST API** - полнофункциональный API с Swagger документацией
- 📱 **Mini App** - веб-приложение внутри Telegram
- 🌐 **Лендинги** - 6 доменов с уникальным дизайном
- 🔒 **Безопасность** - rate limiting, валидация, мониторинг
- 🐳 **Docker** - контейнеризация для простого деплоя

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Telegram Bot  │◄──►│   REST API      │◄──►│   Database      │
│                 │    │                 │    │                 │
│ • Handlers      │    │ • Fastify       │    │ • PostgreSQL    │
│ • API Client    │    │ • Swagger UI    │    │ • Redis Cache   │
│ • Mini App      │    │ • Rate Limiting │    │ • Monitoring    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │
        └──────── nginx ─────────┘
                    │
    ┌─────────────────────────────────┐
    │        6 Domains + SSL          │
    │  botgarden.store | .shop | .tech│
    │  botcraft.tech | botgrover.*    │
    └─────────────────────────────────┘
```

## 🚀 Быстрый старт

### 1. Клонирование и установка

```bash
git clone <repository-url>
cd food
npm install
```

### 2. Настройка

```bash
cp .env.example .env
# Добавьте ваш BOT_TOKEN и другие настройки
```

### 3. Запуск через Docker (рекомендуется)

```bash
docker-compose up -d
```

### 4. Проверка

- **Bot**: Найдите вашего бота в Telegram и напишите `/start`
- **API**: http://localhost:3000/api/docs
- **Health**: http://localhost:3000/health

## 📚 Документация

### 🎯 Для разработчиков

- **[🚀 Установка](docs/INSTALLATION.md)** - Детальная установка и настройка
- **[🤖 Bot Architecture](docs/BOT_ARCHITECTURE.md)** - Архитектура Telegram бота
- **[🚀 API Architecture](docs/API_ARCHITECTURE.md)** - Архитектура REST API
- **[🧪 Testing Guide](docs/TESTING_GUIDE.md)** - Тестирование и качество кода

### 🖥️ Для DevOps

- **[🐳 Docker Guide](docs/DOCKER.md)** - Работа с Docker
- **[🚀 Deployment](docs/DEPLOYMENT.md)** - Деплой на сервер
- **[📊 Monitoring](docs/MONITORING.md)** - Мониторинг и анализ
- **[🔧 Configuration](docs/CONFIGURATION.md)** - Конфигурация проекта

### 🎨 Для дизайнеров

- **[🎯 User Experience](docs/USER_EXPERIENCE.md)** - UX и пользовательские сценарии
- **[📱 Landing Pages](docs/LANDING_PAGES.md)** - Веб-страницы и Mini App

### 📋 Справочники

- **[📝 Scripts Guide](docs/SCRIPTS.md)** - Команды и скрипты
- **[🗂️ Database Schema](docs/DATABASE_SCHEMA.md)** - Структура БД
- **[🛠️ Troubleshooting](docs/TROUBLESHOOTING.md)** - Решение проблем
- **[🗺️ Roadmap](docs/ROADMAP.md)** - Планы развития

## 🧪 Тестирование

```bash
npm test                    # Все тесты
npm run test:coverage       # С покрытием
npm run test:api           # Только API тесты
```

**Покрытие тестами:** 77.07% (619+ тестов)

## 🌐 Демо

- **API Docs**: https://botgarden.store/api/docs
- **Health Check**: https://botgarden.store/health
- **Landing**: https://botgarden.store

## 🛠️ Разработка

```bash
# Режим разработки
npm run dev          # Bot
npm run dev:api      # API

# Сборка
npm run build        # Полная сборка
npm run build:api    # Только API
npm run build:bot    # Только Bot

# Линтинг и форматирование
npm run lint         # Проверка кода
npm run format       # Форматирование
```

## 🚀 Деплой

```bash
# Автоматический деплой
cd deployment && ./deploy.sh

# Docker production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Подробнее: [Deployment Guide](docs/DEPLOYMENT.md)

## 📊 Статистика проекта

- **Версия**: 3.0.0
- **Тесты**: 619+ (77% покрытие)
- **TypeScript**: Строгий режим
- **Docker**: Production ready
- **Домены**: 6 с уникальным дизайном
- **API endpoints**: 15+ с Swagger UI

## 🤝 Участие в разработке

1. Fork репозитория
2. Создайте feature branch
3. Внесите изменения с тестами
4. Создайте Pull Request

Подробнее: [Contributing Guide](docs/CONTRIBUTING.md)

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE)

## 📞 Поддержка

- 📧 **Email**: support@shawarma-bot.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- 📖 **Документация**: [docs/](docs/)

**Сделано с ❤️ для любителей шаурмы**
