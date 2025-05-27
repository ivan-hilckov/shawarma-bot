# 🚀 Deployment Scripts

Папка содержит все скрипты и конфигурации для деплоя Shawarma Bot на production сервер.

## 📁 Файлы

### 🔧 Основные скрипты

- **`deploy.sh`** - Главный скрипт автоматического деплоя
- **`setup-server.sh`** - Первоначальная настройка сервера
- **`health-check.sh`** - Проверка состояния сервисов
- **`quick-fix.sh`** - Быстрое исправление проблем

### ⚙️ Конфигурации

- **`nginx.conf`** - Production конфигурация nginx с проксированием API

## 🚀 Использование

### Первый деплой

```bash
# 1. Настройка сервера (только один раз)
cd deployment
scp setup-server.sh user@server:~/
ssh user@server "chmod +x ~/setup-server.sh && ~/setup-server.sh"

# 2. Деплой приложения
./deploy.sh
```

### Обычный деплой

```bash
cd deployment
./deploy.sh
```

### Проверка состояния

```bash
# Локальная проверка (после деплоя)
ssh user@server "cd ~/shawarma-bot && ./deployment/health-check.sh"

# Быстрое исправление проблем
ssh user@server "cd ~/shawarma-bot && ./deployment/quick-fix.sh api"
```

## 🔧 Nginx конфигурация

Файл `nginx.conf` содержит production-ready конфигурацию:

- ✅ **Проксирование API** - `/api/*` → Docker контейнер
- 🛡️ **Rate limiting** - защита от DDoS атак
- 🌐 **CORS** - поддержка cross-origin запросов
- 🔒 **Безопасность** - заголовки защиты, блокировка служебных файлов
- 📊 **Health check** - endpoint `/health`
- 🗜️ **Gzip** - сжатие статических файлов

### Автоматическое обновление nginx

При деплое nginx конфигурация:

1. ✅ Проверяется синтаксис
2. 💾 Создается бэкап текущей конфигурации
3. 🔄 Заменяется и перезагружается
4. ⚠️ При ошибке - автоматический откат

## 📋 Переменные окружения

Для автоматического деплоя добавьте в `.env.production`:

```env
# Параметры сервера
DEPLOY_SERVER_HOST=your-server.com
DEPLOY_SERVER_PORT=22
DEPLOY_SERVER_USER=root
DEPLOY_SERVER_PATH=~/shawarma-bot
```

## 🔍 Диагностика

### Проверка логов

```bash
# Логи всех сервисов
ssh user@server "cd ~/shawarma-bot && docker-compose logs -f"

# Логи конкретного сервиса
ssh user@server "cd ~/shawarma-bot && docker-compose logs -f api"
ssh user@server "cd ~/shawarma-bot && docker-compose logs -f bot"
```

### Проверка состояния

```bash
# Статус Docker контейнеров
ssh user@server "cd ~/shawarma-bot && docker-compose ps"

# Полная проверка здоровья
ssh user@server "cd ~/shawarma-bot && ./deployment/health-check.sh"
```

### Быстрое исправление

```bash
# Перезапуск API сервиса
ssh user@server "cd ~/shawarma-bot && ./deployment/quick-fix.sh api"

# Перезапуск бота
ssh user@server "cd ~/shawarma-bot && ./deployment/quick-fix.sh bot"

# Полный перезапуск
ssh user@server "cd ~/shawarma-bot && docker-compose restart"
```

## 🛡️ Безопасность

- 🔐 **SSH ключи** - используйте ключи вместо паролей
- 🔒 **Sudo доступ** - требуется для обновления nginx
- 🧹 **Автоочистка** - старые бэкапы удаляются автоматически
- 📋 **Логирование** - все операции логируются

## 📚 Дополнительно

- Все скрипты поддерживают macOS и Linux
- Автоматическое создание бэкапов перед обновлением
- Проверка синтаксиса конфигураций перед применением
- Откат при ошибках деплоя

## 🔄 Обновление путей v2.5

Все скрипты деплоя перенесены в папку `deployment/` для лучшей организации:

- ✅ **Обновлены пути** - все ссылки на скрипты используют `deployment/`
- ✅ **VS Code задачи** - добавлены задачи для деплоя и диагностики
- ✅ **Документация** - обновлены README.md, SCRIPTS.md, DEPLOY_CHECKLIST.md
- ✅ **Обратная совместимость** - скрипты корректно работают из новой структуры
