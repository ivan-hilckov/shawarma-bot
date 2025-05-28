# 📜 Скрипты проекта

## 🚀 Деплой и настройка

- `cd deployment && ./deploy.sh` - автоматический деплой на сервер
- `cd deployment && ./setup-server.sh` - первоначальная настройка сервера
- `cd deployment && ./health-check.sh` - проверка состояния всех сервисов
- `cd deployment && ./quick-fix.sh` - быстрое исправление проблем
- `cd deployment && sudo ./setup-landing-pages.sh` - настройка лендинговых страниц
- `cd deployment && ./server-info.sh` - анализ VPS сервера

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
npm run test:quiet     # Тесты без лишних логов
npm run test:verbose   # Подробный вывод тестов
npm run test:debug     # Дебаг режим (DEBUG_TESTS=1)
```

### 🔍 Проверки

```bash
npm run type-check     # Проверка типов
npm run lint           # Линтинг
npm run format         # Форматирование
```

## 🌍 Лендинговые страницы

### Настройка веб-страниц

```bash
# Автоматическая настройка всех лендингов (включена в deploy.sh)
sudo deployment/setup-landing-pages.sh

# Проверка nginx конфигурации
nginx -t -c deployment/nginx.conf

# Перезагрузка nginx
sudo systemctl reload nginx
```

### Проверка доменов

```bash
# Проверка всех доменов
for domain in botgarden.store botgarden.shop botgarden.tech botcraft.tech botgrover.fun botgrover.ru; do
    curl -H "Host: $domain" http://localhost
done

# Проверка конкретного домена
curl -H "Host: botgarden.store" http://localhost

# Логи nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 📊 Анализ сервера

### Сбор информации о VPS

```bash
# Создание отчета о сервере
deployment/server-info.sh

# Анализ конкретных компонентов
deployment/server-info.sh --docker-only    # Только Docker информация
deployment/server-info.sh --system-only    # Только система
deployment/server-info.sh --nginx-only     # Только nginx
```

### Мониторинг

```bash
# Проверка всех сервисов
deployment/health-check.sh

# Статус Docker контейнеров
docker-compose ps

# Использование ресурсов
docker stats

# Логи проекта
docker-compose logs -f --tail=100
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

### Nginx управление

```bash
# Проверка конфигурации
sudo nginx -t

# Перезагрузка конфигурации
sudo systemctl reload nginx

# Статус nginx
sudo systemctl status nginx

# Проверка доступных доменов
nginx -T | grep server_name
```

### Диагностика

```bash
# Проверка API
curl http://localhost:3000/api/health

# Swagger UI
curl http://localhost/api/docs

# Проверка всех лендингов
curl -H "Host: botgarden.store" http://localhost      # Основной магазин
curl -H "Host: botgarden.shop" http://localhost      # Торговая площадка
curl -H "Host: botgarden.tech" http://localhost      # Техническая документация
curl -H "Host: botcraft.tech" http://localhost       # Сервис крафт-ботов
curl -H "Host: botgrover.fun" http://localhost       # Игровые боты
curl -H "Host: botgrover.ru" http://localhost        # Российская локализация

# Подключение к БД
docker exec -it shawarma-postgres psql -U shawarma_user -d shawarma_db

# Проверка Redis
docker exec -it shawarma-redis redis-cli ping
```

### Полезные алиасы

```bash
# Добавьте в ~/.bashrc или ~/.zshrc
alias bot-logs="docker-compose logs -f bot"
alias api-logs="docker-compose logs -f api"
alias bot-health="deployment/health-check.sh"
alias bot-deploy="cd deployment && ./deploy.sh"
alias nginx-check="sudo nginx -t && sudo systemctl reload nginx"
alias bot-status="docker-compose ps && curl -s http://localhost:3000/api/health | jq"
```

## 🚨 Экстренные команды

### Быстрое исправление

```bash
# Быстрое исправление конкретного сервиса
deployment/quick-fix.sh api    # Исправление API
deployment/quick-fix.sh bot    # Исправление бота
deployment/quick-fix.sh nginx  # Исправление nginx

# Полная перезагрузка
docker-compose down && docker-compose up -d --build
```

### Откат изменений

```bash
# Откат nginx конфигурации (автоматический бэкап)
sudo cp /etc/nginx/nginx.conf.backup-$(date +%Y%m%d) /etc/nginx/nginx.conf
sudo systemctl reload nginx

# Откат к предыдущему коммиту
git reset --hard HEAD~1
docker-compose down && docker-compose up -d --build
```

### Очистка системы

```bash
# Очистка Docker
docker system prune -f
docker image prune -f

# Очистка логов
sudo truncate -s 0 /var/log/nginx/access.log
sudo truncate -s 0 /var/log/nginx/error.log

# Очистка старых бэкапов
find . -name "assets-backup-old-*.tar.gz" -mtime +7 -delete
```
