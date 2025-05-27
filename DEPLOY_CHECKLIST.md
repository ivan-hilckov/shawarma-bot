# 🚀 Чеклист деплоя v2.4 - Cart API Migration

## ✅ Подготовка к деплою

### Код и архитектура

- [x] **Cart API** - реализован полноценный API для корзины
- [x] **API клиент** - бот использует `src/api-client.ts` вместо прямого доступа к Redis
- [x] **Docker архитектура** - API и бот в отдельных контейнерах
- [x] **Переменные окружения** - обновлены для новой архитектуры
- [x] **Health checks** - добавлены проверки всех сервисов

### Docker конфигурация

- [x] **docker-compose.yml** - добавлен API сервис
- [x] **Dockerfile** - поддержка запуска API и бота
- [x] **docker.env.example** - обновлен с API переменными
- [x] **health-check.sh** - скрипт проверки всех сервисов

### Сборка и тесты

- [x] **TypeScript сборка** - `npm run build` проходит без ошибок
- [x] **Линтер** - основные ошибки исправлены (остались warnings в тестах)
- [x] **Cart API тесты** - 12/19 тестов проходят

## 🔧 Новая архитектура v2.4

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Telegram Bot  │───▶│   REST API      │───▶│   Database      │
│   (Port: N/A)   │    │   (Port: 3000)  │    │   (Port: 5432)  │
│                 │    │                 │    │                 │
│ • Bot Handlers  │    │ • Cart API      │    │ • PostgreSQL    │
│ • API Client    │    │ • Menu API      │    │ • Redis Cache   │
│ • Notifications │    │ • Orders API    │    │ • Health Checks │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Команды для деплоя

### 1. Локальная проверка

```bash
# Сборка проекта
npm run build

# Запуск всех сервисов
docker-compose up -d

# Проверка состояния
./health-check.sh

# Проверка API
curl http://localhost:3000/api/health
curl http://localhost:3000/api/docs

# Остановка
docker-compose down
```

### 2. Деплой на сервер

```bash
# Автоматический деплой
./deploy.sh

# Или ручной деплой
scp docker-compose.yml user@server:~/shawarma-bot/
scp .env.production user@server:~/shawarma-bot/.env
ssh user@server 'cd ~/shawarma-bot && docker-compose down && docker-compose up -d'
```

### 3. Проверка после деплоя

```bash
# На сервере
ssh user@server 'cd ~/shawarma-bot && ./health-check.sh'

# Проверка API
curl http://server:3000/api/health

# Проверка логов
ssh user@server 'cd ~/shawarma-bot && docker-compose logs -f bot'
ssh user@server 'cd ~/shawarma-bot && docker-compose logs -f api'
```

## 🔍 Критические проверки

### API сервис

- [ ] API контейнер запущен (`shawarma-api`)
- [ ] Health endpoint отвечает (`/api/health`)
- [ ] Swagger UI доступен (`/api/docs`)
- [ ] Cart API работает (`/api/cart/*`)

### Telegram Bot

- [ ] Бот контейнер запущен (`shawarma-bot`)
- [ ] Бот подключается к API (`API_BASE_URL=http://api:3000/api`)
- [ ] Корзина работает через API
- [ ] Нет ошибок в логах

### База данных

- [ ] PostgreSQL запущен (`shawarma-postgres`)
- [ ] Данные меню загружены
- [ ] API подключается к БД

### Redis

- [ ] Redis запущен (`shawarma-redis`)
- [ ] API подключается к Redis
- [ ] Кэширование работает

### Сетевое подключение

- [ ] Бот → API: `OK`
- [ ] API → БД: `OK`
- [ ] API → Redis: `OK`

## ⚠️ Возможные проблемы

### 1. API не запускается

```bash
# Проверить логи
docker-compose logs api

# Проверить переменные окружения
docker exec shawarma-api env | grep API

# Перезапустить
docker-compose restart api
```

### 2. Бот не подключается к API

```bash
# Проверить API_BASE_URL
docker exec shawarma-bot env | grep API_BASE_URL

# Должно быть: API_BASE_URL=http://api:3000/api

# Проверить сетевое подключение
docker exec shawarma-bot wget -q --spider http://api:3000/api/health
```

### 3. Корзина не работает

```bash
# Проверить Cart API
curl http://localhost:3000/api/cart/123456789

# Проверить Redis подключение
docker exec shawarma-redis redis-cli ping
```

## 📊 Мониторинг

### Логи

```bash
# Все логи
docker-compose logs -f

# Только бот
docker-compose logs -f bot

# Только API
docker-compose logs -f api

# Ошибки
docker-compose logs | grep -i error
```

### Метрики

- API response time
- Cart operations per minute
- Error rate
- Memory usage

## 🎯 Rollback план

Если что-то пошло не так:

```bash
# 1. Остановить новую версию
docker-compose down

# 2. Вернуть старую версию
git checkout v2.3
docker-compose up -d

# 3. Или запустить только бота (без API)
docker-compose up -d bot postgres redis
```

## ✅ Финальная проверка

- [ ] Бот отвечает в Telegram
- [ ] Корзина работает (добавление/удаление товаров)
- [ ] Заказы создаются
- [ ] API документация доступна
- [ ] Все сервисы в статусе "Up"
- [ ] Нет критических ошибок в логах

## 🎉 После успешного деплоя

1. Обновить версию в `package.json` на `2.4.0`
2. Создать git tag `v2.4.0`
3. Обновить документацию
4. Уведомить команду о новой версии
