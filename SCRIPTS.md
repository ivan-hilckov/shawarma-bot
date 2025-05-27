# 📜 Справочник скриптов

## Основные скрипты

### 🚀 Деплой и настройка

- `./deploy.sh` - деплой на продакшен сервер
- `./setup-server.sh` - первоначальная настройка сервера

### 🔧 Исправление проблем

- `./quick-fix.sh api` - быстрое исправление API
- `./quick-fix.sh bot` - быстрое исправление бота

### 📊 Мониторинг

- `./health-check.sh` - проверка состояния всех сервисов

## NPM команды

### 🔨 Сборка

```bash
npm run build          # Полная сборка
npm run build:api      # Только API
npm run build:bot      # Только бот
```

### 🚀 Запуск

```bash
npm start              # Запуск бота
npm run start:api      # Запуск API
npm run dev            # Разработка бота
npm run dev:api        # Разработка API
```

### 🐳 Docker

```bash
npm run docker:up      # Запуск всех сервисов
npm run docker:down    # Остановка
npm run docker:logs    # Логи
npm run docker:restart # Перезапуск
```

### 🧪 Тестирование

```bash
npm test               # Все тесты
npm run test:api       # Только API тесты
npm run test:coverage  # С покрытием
```

### 🔍 Проверки

```bash
npm run type-check     # Проверка типов
npm run lint           # Линтинг
npm run format         # Форматирование
```

## Полезные команды

### Docker Compose

```bash
docker-compose ps                    # Статус контейнеров
docker-compose logs -f api          # Логи API
docker-compose logs -f bot          # Логи бота
docker-compose restart api          # Перезапуск API
docker-compose build --no-cache     # Пересборка без кэша
```

### Диагностика

```bash
curl http://localhost:3000/api/health    # Проверка API
docker exec -it shawarma-postgres psql -U shawarma_user -d shawarma_db  # Подключение к БД
```
