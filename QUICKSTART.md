# 🚀 Быстрый старт с Docker

## Предварительные требования

1. **Docker Desktop** должен быть установлен и запущен

   - macOS: [Docker Desktop for Mac](https://docs.docker.com/desktop/mac/install/)
   - Windows: [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/install/)
   - Linux: [Docker Engine](https://docs.docker.com/engine/install/)

2. **Telegram Bot Token** от [@BotFather](https://t.me/BotFather)

## Запуск за 3 шага

### 1. Настройка окружения

```bash
# Скопируйте пример файла
cp docker.env.example .env

# Отредактируйте .env и добавьте ваш BOT_TOKEN
nano .env
# или
code .env
```

### 2. Запуск всех сервисов

```bash
# Запуск бота + PostgreSQL + pgAdmin
npm run docker:up

# Или напрямую
docker-compose up -d
```

### 3. Проверка работы

```bash
# Просмотр логов бота
npm run docker:logs

# Проверка статуса контейнеров
docker-compose ps
```

## Доступ к сервисам

- **🤖 Telegram Bot**: Найдите в Telegram и отправьте `/start`
- **🐘 PostgreSQL**: `localhost:5432`
- **🔧 pgAdmin**: http://localhost:8080
  - Email: `admin@example.com`
  - Password: `admin123`

## Полезные команды

```bash
# Остановка всех сервисов
npm run docker:down

# Перезапуск только бота
npm run docker:restart

# Просмотр логов PostgreSQL
docker-compose logs -f postgres

# Подключение к базе данных
docker exec -it shawarma-postgres psql -U shawarma_user -d shawarma_db
```

## Troubleshooting

### Docker daemon не запущен

```bash
# Запустите Docker Desktop или Docker Engine
# Проверьте статус
docker --version
```

### Порты заняты

```bash
# Проверьте какие порты используются
lsof -i :5432  # PostgreSQL
lsof -i :8080  # pgAdmin

# Измените порты в docker-compose.yml если нужно
```

### Проблемы с правами

```bash
# Очистка и пересборка
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

📖 **Подробная документация**: [DOCKER.md](./DOCKER.md)
