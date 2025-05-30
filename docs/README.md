# 📚 Документация проекта Shawarma Bot

Добро пожаловать в центр документации! Здесь собраны все ресурсы для понимания, разработки и развертывания проекта.

## 🏗️ Архитектурная документация

### 🤖 [Bot Architecture](BOT_ARCHITECTURE.md)

**Детальная архитектура Telegram бота**

- 📁 Структура файлов и компонентов
- 🎯 Event Router и система обработчиков
- 🛒 Сервисы корзины и базы данных
- 🌐 API Client для связи с REST API
- 🔄 Data Flow и паттерны обработки
- 🛡️ Error Handling и производительность

### 🚀 [API Architecture](API_ARCHITECTURE.md)

**Архитектура REST API на Fastify**

- 🚀 Server Core и Middleware Pipeline
- 🛣️ API Routes (Cart, Menu, Orders, Health)
- ⚙️ Services Layer и бизнес-логика
- 📝 Schema Validation с Zod
- 🔌 Plugins Architecture
- 🛡️ Security & Performance
- 📊 Monitoring & Observability

## 📱 Frontend документация

### 🌐 [Landing Pages](LANDING_PAGES.md)

**Документация по веб-страницам проекта**

- 6 уникальных доменов с разными концепциями
- Telegram Mini App интеграция
- Технические детали реализации
- Nginx конфигурация и деплой

## 🖥️ Инфраструктура

### 📊 [VPS Analysis](VPS_ANALYSIS.md)

**Анализ серверной инфраструктуры**

- Системные ресурсы и производительность
- Docker контейнеры и образы
- Nginx конфигурация
- Мониторинг и диагностика

## 📋 Руководства и процессы

### 🚀 [Deploy Checklist](../DEPLOY_CHECKLIST.md)

**Чек-лист для безопасного деплоя**

- Пре-деплой проверки
- Процедура развертывания
- Пост-деплой валидация
- Откат в случае проблем

### 🔄 [Changelog](../CHANGELOG.md)

**История изменений проекта**

- Новые функции по версиям
- Исправления ошибок
- Breaking changes
- Планы развития

### 📝 [Scripts Guide](../SCRIPTS.md)

**Описание скриптов автоматизации**

- Деплой скрипты
- Мониторинг и health checks
- Утилиты для разработки

## 🗂️ Структура документации

```
docs/
├── README.md              # 📚 Этот файл - навигация
├── BOT_ARCHITECTURE.md    # 🤖 Архитектура Telegram бота
├── API_ARCHITECTURE.md    # 🚀 Архитектура REST API
├── LANDING_PAGES.md       # 📱 Веб-страницы и Mini App
└── VPS_ANALYSIS.md        # 🖥️ Анализ инфраструктуры

# Корневые документы
├── DEPLOY_CHECKLIST.md    # 🚀 Чек-лист деплоя
├── CHANGELOG.md           # 🔄 История изменений
├── SCRIPTS.md             # 📝 Описание скриптов
└── README.md              # 🌯 Основная документация
```

## 🎯 Быстрая навигация

### Для разработчиков

- **Начинающие:** [README.md](../README.md) → [Bot Architecture](BOT_ARCHITECTURE.md)
- **API разработка:** [API Architecture](API_ARCHITECTURE.md)
- **Frontend:** [Landing Pages](LANDING_PAGES.md)

### Для DevOps

- **Деплой:** [Deploy Checklist](../DEPLOY_CHECKLIST.md) → [Scripts Guide](../SCRIPTS.md)
- **Мониторинг:** [VPS Analysis](VPS_ANALYSIS.md)
- **Инфраструктура:** [API Architecture](API_ARCHITECTURE.md) → Security & Performance

### Для менеджеров проекта

- **Обзор:** [README.md](../README.md) → [Changelog](../CHANGELOG.md)
- **Статус:** [VPS Analysis](VPS_ANALYSIS.md) → Health Checks
- **Планирование:** [Changelog](../CHANGELOG.md) → Roadmap

## 🔄 Обновление документации

Документация обновляется при каждом релизе. Для предложения изменений:

1. Создайте issue с тегом `documentation`
2. Предложите PR с обновлениями
3. Убедитесь, что изменения отражены в соответствующих разделах

---

**Нужна помощь?** Проверьте [основной README](../README.md) или создайте issue в репозитории.
