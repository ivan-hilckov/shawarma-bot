# ⚙️ Конфигурация проекта

Подробное руководство по настройке всех компонентов Shawarma Bot.

---

## 📋 Обзор

Проект использует переменные окружения для конфигурации всех компонентов. Настройки разделены на категории по функциональности.

---

## 🔐 Переменные окружения

### Основные настройки

#### Telegram Bot

```env
# Обязательно: Токен бота от @BotFather
BOT_TOKEN=1234567890:ABCdefGHIjklmnoPQRstuvwxyz

# Опционально: ID чата для уведомлений администраторам
NOTIFICATIONS_CHAT_ID=-1001234567890

# Опционально: ID пользователей-администраторов (через запятую)
ADMIN_USER_IDS=123456789,987654321
```

#### База данных

```env
# Обязательно: Строка подключения к PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database

# Пример для локальной разработки
DATABASE_URL=postgresql://shawarma_user:shawarma_pass@localhost:5432/shawarma_db

# Пример для Docker
DATABASE_URL=postgresql://shawarma_user:shawarma_pass@postgres:5432/shawarma_db
```

#### Redis

```env
# Опционально: Строка подключения к Redis
REDIS_URL=redis://localhost:6379

# С паролем
REDIS_URL=redis://:password@localhost:6379

# Docker
REDIS_URL=redis://redis:6379
```

### API Configuration

```env
# Порт API сервера (по умолчанию: 3000)
API_PORT=3000

# Хост API сервера (по умолчанию: 0.0.0.0)
API_HOST=0.0.0.0

# Префикс для всех API маршрутов (по умолчанию: /api)
API_PREFIX=/api
```

### Assets и статические файлы

```env
# Базовый URL для изображений и статических файлов
ASSETS_BASE_URL=https://botgarden.store/assets

# Локальная разработка
ASSETS_BASE_URL=http://localhost:3000/assets
```

### Безопасность

```env
# API ключи для доступа к админским функциям (через запятую)
API_KEYS=admin-key-prod-1,admin-key-prod-2

# Разрешенные Origins для CORS (через запятую)
CORS_ORIGINS=https://botgarden.store,https://admin.botgarden.store

# Локальная разработка
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

### Rate Limiting

```env
# Лимит запросов в минуту для публичных API (по умолчанию: 100)
RATE_LIMIT_PUBLIC=100

# Лимит запросов в минуту для админских API (по умолчанию: 1000)
RATE_LIMIT_ADMIN=1000
```

### Кэширование

```env
# TTL для кэша в секундах (по умолчанию: 300 = 5 минут)
REDIS_CACHE_TTL=300

# Включить/выключить кэширование (по умолчанию: true)
ENABLE_CACHE=true
```

### Environment

```env
# Режим работы (development/production/test)
NODE_ENV=production

# Для локальной разработки
NODE_ENV=development
```

---

## 🔧 Файлы конфигурации

### .env файлы

Проект поддерживает несколько файлов окружения:

```
.env                    # Основной файл (не коммитится)
.env.example           # Пример конфигурации
.env.local             # Локальные переменные (не коммитится)
.env.production        # Production переменные (не коммитится)
docker.env.example     # Пример для Docker
```

### TypeScript конфигурация

```
tsconfig.json          # Основная конфигурация
tsconfig.api.json      # Конфигурация для API
tsconfig.bot.json      # Конфигурация для Bot
tsconfig.test.json     # Конфигурация для тестов
```

### Docker конфигурация

```
docker-compose.yml     # Основная конфигурация Docker
docker-compose.prod.yml # Production переопределения
Dockerfile.api         # Образ для API
Dockerfile.bot         # Образ для Bot
```

---

## 📱 Настройка Telegram Bot

### Через @BotFather

1. **Создание бота:**

   ```
   /newbot
   Shawarma Bot
   @YourShawarmaBot
   ```

2. **Описание бота:**

   ```
   /setdescription @YourShawarmaBot
   Современный бот для заказа шаурмы с удобным интерфейсом и быстрой доставкой
   ```

3. **Команды бота:**

   ```
   /setcommands @YourShawarmaBot
   start - Запуск бота и главное меню
   ```

4. **Фото профиля:**
   ```
   /setuserpic @YourShawarmaBot
   # Загрузите изображение 512x512px
   ```

### Mini App настройка

```
/newapp @YourShawarmaBot
Shawarma Mini App
https://botgarden.store/miniapp
```

---

## 🌐 Nginx конфигурация

### Основные настройки

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

server {
    listen 80;
    server_name botgarden.store botgarden.shop botgarden.tech
                botcraft.tech botgrover.fun botgrover.ru;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API проксирование
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/api/health;
    }
}
```

### SSL конфигурация

```nginx
server {
    listen 443 ssl http2;
    server_name botgarden.store;

    ssl_certificate /etc/letsencrypt/live/botgarden.store/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/botgarden.store/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
}
```

---

## 🗄️ База данных

### PostgreSQL настройки

```sql
-- Производительность
shared_preload_libraries = 'pg_stat_statements'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

-- Логирование
log_statement = 'all'
log_duration = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

### Индексы для оптимизации

```sql
-- Часто используемые запросы
CREATE INDEX idx_orders_user_id_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_menu_items_category_available ON menu_items(category_id, is_available);
```

---

## 🔄 Redis настройки

### redis.conf

```conf
# Память
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence (для продакшена)
save 900 1
save 300 10
save 60 10000

# Безопасность
requirepass your_redis_password
```

### Использование в проекте

```typescript
// Ключи кэша
const CACHE_KEYS = {
  cart: (userId: number) => `cart:${userId}`,
  menu: (category: string) => `menu:${category}`,
  user: (userId: number) => `user:${userId}`,
  stats: () => 'stats:global',
};
```

---

## 📊 Мониторинг

### Health Check endpoints

```bash
# Основной health check
curl http://localhost:3000/api/health

# Детальная проверка
curl http://localhost:3000/api/health/detailed

# Readiness probe (для Kubernetes)
curl http://localhost:3000/api/health/ready

# Liveness probe (для Kubernetes)
curl http://localhost:3000/api/health/live
```

### Метрики

```env
# Включение сбора метрик
ENABLE_METRICS=true

# Prometheus endpoint
METRICS_PORT=9090
```

---

## 🔧 Настройки разработки

### Jest конфигурация

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setupJest.ts'],
  testTimeout: 10000,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts', '!src/**/*.spec.ts'],
};
```

### ESLint и Prettier

```json
// .eslintrc.json
{
  "extends": ["@typescript-eslint/recommended", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

---

## 🚀 Production настройки

### Рекомендованные значения

```env
NODE_ENV=production
BOT_TOKEN=your_production_token
DATABASE_URL=postgresql://user:secure_password@db:5432/shawarma_db
REDIS_URL=redis://:secure_password@redis:6379

# Безопасность
API_KEYS=secure-key-1,secure-key-2
CORS_ORIGINS=https://yourdomain.com

# Производительность
RATE_LIMIT_PUBLIC=50
RATE_LIMIT_ADMIN=500
REDIS_CACHE_TTL=600
ENABLE_CACHE=true

# Логирование
LOG_LEVEL=info
ENABLE_ACCESS_LOG=true
```

### Docker Compose Production

```yaml
version: '3.8'
services:
  api:
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  bot:
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M
```

---

## 🔍 Проверка конфигурации

### Команды для валидации

```bash
# Проверка переменных окружения
npm run config:validate

# Проверка подключений
npm run health:check

# Проверка TypeScript конфигурации
npm run type-check

# Проверка Docker конфигурации
docker-compose config
```

### Скрипт валидации

```typescript
// scripts/validate-config.ts
function validateConfig() {
  const required = ['BOT_TOKEN', 'DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    process.exit(1);
  }

  console.log('✅ Configuration is valid');
}
```

---

**Следующие шаги:**

- [Deployment Guide](DEPLOYMENT.md) - деплой с этой конфигурацией
- [Monitoring](MONITORING.md) - настройка мониторинга
- [Troubleshooting](TROUBLESHOOTING.md) - решение проблем конфигурации
