# 🤖 Cursor Background Agents Setup

Этот проект настроен для работы с **Cursor Background Agents** - функцией, которая позволяет запускать асинхронных агентов в удаленной среде для параллельной работы с кодом.

## 🚀 Быстрый старт

### Предварительные требования

1. **Cursor с включенными Background Agents**

   - Отключите Privacy Mode в настройках Cursor
   - Background Agents доступны в preview режиме

2. **GitHub доступ**
   - Предоставьте read-write доступ к репозиторию
   - Background Agents клонируют проект через GitHub

### Первая настройка

1. **Запустите Background Agent:**

   ```
   Cmd + ' (или Ctrl + ') → "New Background Agent"
   ```

2. **Настройка машины:**

   - Выберите **Declarative setup** (рекомендуется)
   - Будет использован базовый Ubuntu образ
   - Автоматически выполнится `.cursor/install.sh`

3. **Проверка настройки:**
   ```
   Cmd + ; (или Ctrl + ;) → войти в машину агента
   ```

## 🛠️ Что происходит при настройке

### Install команда (`.cursor/install.sh`)

Автоматически устанавливает и настраивает:

- ✅ **Node.js 18** - основная среда выполнения
- ✅ **Docker & Docker Compose** - контейнеризация сервисов
- ✅ **NPM зависимости** - все пакеты проекта
- ✅ **TypeScript сборка** - компиляция кода
- ✅ **Docker образы** - загрузка базовых образов
- ✅ **.env файл** - создание из шаблона

### Start команда

- Запускает Docker daemon для работы с контейнерами

### Терминалы (автоматически запускаются)

1. **docker-services** 🐳

   - Запускает PostgreSQL, Redis, pgAdmin
   - Показывает статус всех сервисов

2. **api-dev** 🚀

   - REST API сервер в development режиме
   - Автоперезагрузка при изменении файлов
   - Доступен на `localhost:3000`

3. **bot-dev** 🤖

   - Telegram Bot в development режиме
   - Автоперезагрузка при изменении файлов
   - **⚠️ Требует BOT_TOKEN в .env**

4. **test-runner** 🧪
   - Терминал для запуска тестов
   - Готов к работе после запуска сервисов

## 📋 Доступные команды

После настройки в терминалах агента доступны:

```bash
# Разработка
npm run dev              # Запуск бота
npm run dev:api          # Запуск API
npm run dev:watch        # Бот с авто-перезагрузкой
npm run dev:api:watch    # API с авто-перезагрузкой

# Тестирование
npm test                 # Запуск всех тестов
npm run test:watch       # Тесты в watch режиме
npm run test:coverage    # Покрытие кода
npm run test:api         # Только API тесты

# Сборка
npm run build            # Сборка всего проекта
npm run build:api        # Сборка только API
npm run build:bot        # Сборка только бота

# Docker
npm run docker:up        # Запуск сервисов
npm run docker:down      # Остановка сервисов
npm run docker:logs      # Просмотр логов
npm run docker:restart   # Перезапуск

# Качество кода
npm run lint             # Проверка ESLint
npm run lint:fix         # Исправление ESLint
npm run format           # Форматирование Prettier
npm run type-check       # Проверка типов TypeScript
```

## 🔧 Настройка BOT_TOKEN

**Обязательно** после первого запуска:

1. Отредактируйте `.env` файл:

   ```bash
   nano .env
   ```

2. Добавьте ваш Telegram Bot Token:

   ```env
   BOT_TOKEN=your_actual_bot_token_here
   ```

3. Перезапустите бота:
   ```bash
   # В терминале bot-dev
   Ctrl+C
   npm run dev:watch
   ```

## 🌐 Доступные сервисы

После запуска `docker-services` доступны:

- **API Server:** `http://localhost:3000`
- **API Docs:** `http://localhost:3000/api/docs`
- **Health Check:** `http://localhost:3000/api/health`
- **PostgreSQL:** `localhost:5433`
- **Redis:** `localhost:6380`
- **pgAdmin:** `http://localhost:8080`
  - Email: `admin@example.com`
  - Password: `admin123`

## 🐛 Troubleshooting

### Проблемы с Docker

```bash
# Проверка статуса
docker-compose ps

# Перезапуск сервисов
docker-compose restart

# Логи сервисов
docker-compose logs -f
```

### Проблемы с Node.js

```bash
# Переустановка зависимостей
rm -rf node_modules package-lock.json
npm install

# Пересборка TypeScript
npm run clean
npm run build
```

### Проблемы с Background Agent

1. Проверьте что Privacy Mode отключен
2. Убедитесь что репозиторий доступен на GitHub
3. Попробуйте пересоздать машину агента
4. Проверьте логи установки в интерфейсе Cursor

## 💡 Рекомендации по использованию

### Эффективная работа с агентом

1. **Используйте терминалы по назначению:**

   - `docker-services` - только для управления сервисами
   - `api-dev` / `bot-dev` - для разработки соответствующих компонентов
   - `test-runner` - для тестирования и отладки

2. **Следите за ресурсами:**

   - Останавливайте неиспользуемые сервисы
   - Используйте `docker-compose down` при завершении работы

3. **Параллельная разработка:**
   - API и Bot могут разрабатываться независимо
   - Используйте отдельные ветки для крупных изменений

### Безопасность

- ❗ **Никогда не коммитьте .env с реальными токенами**
- ❗ **BOT_TOKEN должен быть только для development/testing**
- ❗ **Не используйте production базы данных**

## 📚 Дополнительные ресурсы

- [Cursor Background Agents Documentation](https://docs.cursor.com/background-agent)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

**Happy coding with Background Agents! 🚀**
