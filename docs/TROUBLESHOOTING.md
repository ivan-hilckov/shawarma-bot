# 🛠️ Решение проблем

Руководство по диагностике и решению частых проблем в Shawarma Bot.

---

## 🚨 Быстрая диагностика

### Проверка статуса всех сервисов

```bash
# Docker статус
docker-compose ps

# Health check API
curl http://localhost:3000/api/health

# Проверка логов
docker-compose logs --tail=50
```

---

## 🤖 Проблемы с Telegram Bot

### Bot не отвечает на сообщения

**Симптомы:**

- Бот не реагирует на `/start`
- Нет ответа на команды
- Сообщения не доставляются

**Диагностика:**

```bash
# Проверить логи бота
docker-compose logs bot

# Проверить токен
echo $BOT_TOKEN

# Проверить статус контейнера
docker-compose ps bot
```

**Решения:**

1. **Неверный токен:**

   ```bash
   # Проверьте токен у @BotFather
   # Обновите .env файл
   BOT_TOKEN=correct_token_here
   docker-compose restart bot
   ```

2. **Бот используется на другом сервере:**

   ```bash
   # Остановите все другие инстансы
   # Перезапустите текущий
   docker-compose restart bot
   ```

3. **Проблемы с сетью:**
   ```bash
   # Проверка интернет-соединения
   curl https://api.telegram.org/bot$BOT_TOKEN/getMe
   ```

### Ошибки валидации webhook

```bash
# Удаление webhook (если настроен)
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook"

# Проверка текущего webhook
curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
```

---

## 🚀 Проблемы с API

### API недоступен (500/404 ошибки)

**Симптомы:**

- Swagger UI не открывается
- 404 на `/api/health`
- Внутренние ошибки сервера

**Диагностика:**

```bash
# Статус API контейнера
docker-compose ps api

# Логи API
docker-compose logs api

# Проверка порта
netstat -tulpn | grep 3000
```

**Решения:**

1. **Контейнер не запущен:**

   ```bash
   docker-compose up -d api
   ```

2. **Порт занят:**

   ```bash
   # Найти процесс на порту 3000
   lsof -i :3000

   # Остановить процесс
   kill -9 <PID>

   # Перезапустить API
   docker-compose restart api
   ```

3. **Ошибки компиляции TypeScript:**

   ```bash
   # Проверить сборку
   npm run build:api

   # Исправить ошибки и пересобрать
   docker-compose build --no-cache api
   docker-compose up -d api
   ```

### Rate Limiting проблемы

```bash
# Проверить логи nginx
sudo tail -f /var/log/nginx/error.log

# Сброс лимитов (при необходимости)
# Перезапуск nginx
sudo systemctl restart nginx
```

---

## 🗄️ Проблемы с базой данных

### PostgreSQL недоступен

**Симптомы:**

- Connection refused ошибки
- Таймауты подключения
- "database does not exist"

**Диагностика:**

```bash
# Статус PostgreSQL
docker-compose ps postgres

# Логи PostgreSQL
docker-compose logs postgres

# Прямое подключение
docker exec -it shawarma-postgres psql -U shawarma_user -d shawarma_db
```

**Решения:**

1. **Контейнер не запущен:**

   ```bash
   docker-compose up -d postgres
   ```

2. **База данных не создана:**

   ```bash
   # Создание базы
   docker exec -it shawarma-postgres psql -U postgres
   # Внутри psql:
   CREATE DATABASE shawarma_db;
   CREATE USER shawarma_user WITH PASSWORD 'shawarma_pass';
   GRANT ALL PRIVILEGES ON DATABASE shawarma_db TO shawarma_user;
   ```

3. **Данные повреждены:**

   ```bash
   # Backup и восстановление
   docker exec shawarma-postgres pg_dump -U shawarma_user shawarma_db > backup.sql

   # Пересоздание контейнера
   docker-compose down
   docker volume rm food_postgres_data
   docker-compose up -d postgres

   # Восстановление данных
   docker exec -i shawarma-postgres psql -U shawarma_user -d shawarma_db < backup.sql
   ```

### Медленные запросы

```sql
-- Проверка активных запросов
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Индексы для оптимизации
CREATE INDEX CONCURRENTLY idx_orders_user_created ON orders(user_id, created_at);
CREATE INDEX CONCURRENTLY idx_cart_user_item ON cart_items(user_id, menu_item_id);
```

---

## 🔄 Проблемы с Redis

### Redis недоступен

**Симптомы:**

- Корзина не сохраняется
- Кэш не работает
- Connection refused к Redis

**Диагностика:**

```bash
# Статус Redis
docker-compose ps redis

# Проверка подключения
docker exec -it shawarma-redis redis-cli ping

# Логи Redis
docker-compose logs redis
```

**Решения:**

1. **Перезапуск Redis:**

   ```bash
   docker-compose restart redis
   ```

2. **Очистка кэша:**

   ```bash
   docker exec -it shawarma-redis redis-cli flushall
   ```

3. **Проблемы с памятью:**

   ```bash
   # Проверка использования памяти
   docker exec -it shawarma-redis redis-cli info memory

   # Увеличение лимита в docker-compose.yml
   redis:
     command: redis-server --maxmemory 512mb
   ```

---

## 🌐 Проблемы с Nginx

### 502 Bad Gateway

**Симптомы:**

- Сайт недоступен
- 502 ошибки
- Timeout ошибки

**Диагностика:**

```bash
# Статус nginx
sudo systemctl status nginx

# Проверка конфигурации
sudo nginx -t

# Логи nginx
sudo tail -f /var/log/nginx/error.log
```

**Решения:**

1. **Неверная конфигурация:**

   ```bash
   # Откат к backup конфигурации
   sudo cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
   sudo systemctl restart nginx
   ```

2. **API сервер недоступен:**

   ```bash
   # Проверить доступность API
   curl http://localhost:3000/api/health

   # Перезапустить API
   docker-compose restart api
   ```

### SSL проблемы

```bash
# Обновление сертификатов
sudo certbot renew

# Проверка сертификата
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

---

## 🐳 Проблемы с Docker

### Контейнеры не запускаются

**Симптомы:**

- Exit код не 0
- Постоянные перезапуски
- Out of memory ошибки

**Диагностика:**

```bash
# Детальные логи
docker-compose logs --details

# Использование ресурсов
docker stats

# Проверка образов
docker images
```

**Решения:**

1. **Недостаток памяти:**

   ```bash
   # Очистка системы
   docker system prune -a

   # Увеличение лимитов в docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 1G
   ```

2. **Пересборка образов:**

   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. **Проблемы с volume:**
   ```bash
   # Удаление поврежденных volumes
   docker-compose down -v
   docker volume prune
   docker-compose up -d
   ```

### Медленная сборка

```bash
# Использование Docker BuildKit
export DOCKER_BUILDKIT=1
docker-compose build

# Очистка build cache
docker builder prune
```

---

## 🔧 Проблемы разработки

### TypeScript ошибки

```bash
# Проверка типов
npm run type-check

# Установка типов
npm install @types/node @types/jest --save-dev

# Очистка и пересборка
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Проблемы с тестами

```bash
# Очистка кэша Jest
npm test -- --clearCache

# Запуск с отладкой
DEBUG_TESTS=1 npm test

# Запуск конкретного теста
npm test -- cart.test.ts
```

### Проблемы с ESLint

```bash
# Исправление автоматически исправимых ошибок
npm run lint:fix

# Игнорирование правил (временно)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
```

---

## 📊 Мониторинг и логи

### Сбор логов для диагностики

```bash
# Создание архива с логами
deployment/collect-logs.sh

# Или вручную:
mkdir -p debug-logs/$(date +%Y%m%d_%H%M)
cd debug-logs/$(date +%Y%m%d_%H%M)

# Docker логи
docker-compose logs > docker.log

# System логи
sudo journalctl -u nginx > nginx-system.log
sudo tail -n 1000 /var/log/nginx/access.log > nginx-access.log
sudo tail -n 1000 /var/log/nginx/error.log > nginx-error.log

# Health check
curl http://localhost:3000/api/health > health.json
```

### Общие команды диагностики

```bash
# Проверка ресурсов
free -h
df -h
top -bn1 | head -20

# Сетевые подключения
netstat -tulpn | grep -E ':(3000|5432|6379|80|443)'

# Процессы Docker
ps aux | grep docker
```

---

## 🆘 Экстренное восстановление

### Полный перезапуск

```bash
# Остановка всех сервисов
docker-compose down

# Очистка (ОСТОРОЖНО: удалит данные)
docker-compose down -v
docker system prune -a

# Восстановление из backup
# Восстановите .env файл
# Восстановите database dump

# Запуск заново
docker-compose up -d
```

### Откат к предыдущей версии

```bash
# Git откат
git log --oneline -10
git reset --hard <previous-commit-hash>

# Docker пересборка
docker-compose build --no-cache
docker-compose up -d
```

---

## 📞 Получение помощи

### Информация для отчета об ошибке

При создании issue включите:

```bash
# Версия проекта
cat package.json | grep version

# Docker версии
docker --version
docker-compose --version

# Статус сервисов
docker-compose ps

# Последние логи
docker-compose logs --tail=100

# Конфигурация (без секретов)
cat .env | grep -v "TOKEN\|PASSWORD\|KEY"
```

### Ресурсы

- 📖 **Документация**: [docs/](../docs/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 **Обсуждения**: [GitHub Discussions](https://github.com/your-repo/discussions)

---

**Проблема не решена?** Создайте [новый issue](https://github.com/your-repo/issues/new) с подробным описанием и логами.
