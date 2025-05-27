# 📜 Скрипты проекта

## 🚀 Деплой и настройка

- `cd deployment && ./deploy.sh` - автоматический деплой на сервер
- `cd deployment && ./setup-server.sh` - первоначальная настройка сервера
- `cd deployment && ./health-check.sh` - проверка состояния всех сервисов
- `cd deployment && ./quick-fix.sh` - быстрое исправление проблем

## Основные скрипты

- `npm run dev` - запуск бота в режиме разработки
- `npm run dev:api` - запуск API сервера в режиме разработки
- `npm run build` - сборка проекта
- `npm start` - запуск бота в production
- `npm run start:api` - запуск API в production
- `npm test` - запуск тестов
- `npm run lint` - проверка кода линтером
- `npm run format` - форматирование кода

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
