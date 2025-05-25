# 🐳 Docker Setup для Шаурма Бота

## Быстрый старт

### 1. Подготовка окружения

```bash
# Скопируйте пример файла окружения
cp docker.env.example .env

# Отредактируйте .env файл и добавьте ваш BOT_TOKEN
nano .env
```

### 2. Запуск с Docker Compose (рекомендуется)

```bash
# Запуск всех сервисов (бот + PostgreSQL + pgAdmin)
npm run docker:up

# Просмотр логов бота
npm run docker:logs

# Остановка всех сервисов
npm run docker:down
```

### 3. Доступ к сервисам

- **Telegram Bot**: Работает в фоне
- **PostgreSQL**: `localhost:5432`
- **pgAdmin**: http://localhost:8080
  - Email: `admin@example.com`
  - Password: `admin123`

## Детальные команды

### Docker Compose команды

```bash
# Запуск в фоне
docker-compose up -d

# Запуск с выводом логов
docker-compose up

# Остановка
docker-compose down

# Перезапуск только бота
docker-compose restart bot

# Просмотр логов
docker-compose logs -f bot
docker-compose logs -f postgres

# Пересборка и запуск
docker-compose up --build
```

### Отдельные Docker команды

```bash
# Сборка образа
npm run docker:build

# Запуск контейнера
npm run docker:run

# Или напрямую
docker build -t shawarma-bot .
docker run --env-file .env shawarma-bot
```

## Структура сервисов

### 🤖 Bot Service

- **Контейнер**: `shawarma-bot`
- **Образ**: Собирается из Dockerfile
- **Зависимости**: PostgreSQL
- **Переменные окружения**: BOT_TOKEN, DATABASE_URL

### 🐘 PostgreSQL Service

- **Контейнер**: `shawarma-postgres`
- **Образ**: `postgres:15-alpine`
- **Порт**: `5432`
- **База данных**: `shawarma_db`
- **Пользователь**: `shawarma_user`
- **Пароль**: `shawarma_pass`

### 🔧 pgAdmin Service

- **Контейнер**: `shawarma-pgadmin`
- **Образ**: `dpage/pgadmin4:latest`
- **Порт**: `8080`
- **URL**: http://localhost:8080

## Работа с базой данных

### Подключение к PostgreSQL

```bash
# Через Docker
docker exec -it shawarma-postgres psql -U shawarma_user -d shawarma_db

# Через psql (если установлен локально)
psql -h localhost -p 5432 -U shawarma_user -d shawarma_db
```

### Инициализация базы данных

База данных автоматически инициализируется при первом запуске с помощью `init.sql`:

- ✅ Создание таблиц (users, categories, menu_items, orders, cart_items)
- ✅ Вставка начальных данных
- ✅ Создание индексов
- ✅ Настройка триггеров

### Резервное копирование

```bash
# Создание бэкапа
docker exec shawarma-postgres pg_dump -U shawarma_user shawarma_db > backup.sql

# Восстановление из бэкапа
docker exec -i shawarma-postgres psql -U shawarma_user -d shawarma_db < backup.sql
```

## Разработка

### Локальная разработка с Docker БД

```bash
# Запуск только PostgreSQL
docker-compose up postgres -d

# Разработка локально
npm run dev

# Остановка БД
docker-compose down
```

### Отладка

```bash
# Подключение к контейнеру бота
docker exec -it shawarma-bot sh

# Просмотр логов в реальном времени
docker-compose logs -f

# Проверка статуса контейнеров
docker-compose ps
```

## Переменные окружения

### Обязательные

- `BOT_TOKEN` - токен Telegram бота

### Опциональные

- `NODE_ENV` - окружение (production/development)
- `DATABASE_URL` - строка подключения к БД
- `POSTGRES_DB` - имя базы данных
- `POSTGRES_USER` - пользователь БД
- `POSTGRES_PASSWORD` - пароль БД

## Troubleshooting

### Проблемы с запуском

```bash
# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs bot
docker-compose logs postgres

# Пересборка образов
docker-compose build --no-cache
```

### Очистка

```bash
# Остановка и удаление контейнеров
docker-compose down

# Удаление volumes (ВНИМАНИЕ: удалит данные БД!)
docker-compose down -v

# Очистка неиспользуемых образов
docker system prune
```

## Производство

### Настройки для продакшена

1. Измените пароли в `.env`
2. Используйте внешний PostgreSQL
3. Настройте мониторинг
4. Добавьте health checks

```yaml
# Пример health check в docker-compose.yml
healthcheck:
  test: ["CMD", "node", "-e", "process.exit(0)"]
  interval: 30s
  timeout: 10s
  retries: 3
```
