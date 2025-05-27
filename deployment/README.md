# 🚀 Deployment Scripts

Папка содержит скрипты для деплоя Shawarma Bot на production сервер.

## 📁 Файлы

- **`deploy.sh`** - Автоматический деплой
- **`setup-server.sh`** - Настройка сервера
- **`health-check.sh`** - Проверка состояния
- **`quick-fix.sh`** - Быстрое исправление
- **`server-info.sh`** - Сбор информации о VPS
- **`nginx.conf`** - Конфигурация nginx

## 📚 Документация

Полная документация по деплою и мониторингу находится в папке `docs/`:

- **[docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)** - Полное руководство по деплою
- **[docs/SERVER_MONITORING.md](../docs/SERVER_MONITORING.md)** - Мониторинг и анализ VPS
- **[docs/VPS_ANALYSIS.md](../docs/VPS_ANALYSIS.md)** - Пример анализа сервера

## 🚀 Быстрый старт

```bash
# Деплой
./deploy.sh

# Проверка состояния
./health-check.sh

# Анализ сервера
./server-info.sh
```

Подробные инструкции смотрите в документации.
