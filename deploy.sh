#!/bin/bash
set -e

echo "🚀 Деплой Шаурма Бота на сервер"

# Проверка что мы в корне проекта
if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
    echo "❌ Запустите скрипт из корня проекта"
    exit 1
fi

# Запрос данных сервера
read -p "Введите адрес сервера (IP или домен): " SERVER_HOST
read -p "Введите имя пользователя: " SERVER_USER
read -p "Введите путь к проекту на сервере [~/shawarma-bot]: " SERVER_PATH
SERVER_PATH=${SERVER_PATH:-~/shawarma-bot}

echo ""
echo "🔍 Параметры деплоя:"
echo "Сервер: $SERVER_USER@$SERVER_HOST"
echo "Путь: $SERVER_PATH"
echo ""

read -p "Продолжить деплой? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "❌ Деплой отменен"
    exit 1
fi

# Проверка SSH подключения
echo "🔐 Проверка SSH подключения..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_HOST exit 2>/dev/null; then
    echo "❌ Не удается подключиться к серверу по SSH"
    echo "Убедитесь что SSH ключи настроены"
    exit 1
fi
echo "✅ SSH подключение работает"

# Проверка что на сервере есть git репозиторий
echo "📋 Проверка состояния сервера..."
if ! ssh $SERVER_USER@$SERVER_HOST "[ -d $SERVER_PATH/.git ]"; then
    echo "❌ Git репозиторий не найден на сервере"
    echo "Сначала выполните настройку сервера: ./setup-server.sh"
    exit 1
fi

# Создание архива изображений (если есть)
if [ -d "assets" ] && [ "$(ls assets/*.jpeg 2>/dev/null | wc -l)" -gt 0 ]; then
    echo "📸 Создание архива изображений..."
    tar -czf assets-backup.tar.gz assets/
    ASSETS_SIZE=$(du -h assets-backup.tar.gz | cut -f1)
    echo "✅ Архив изображений создан: $ASSETS_SIZE"
    UPLOAD_ASSETS=true
else
    echo "⚠️ Папка assets не найдена или пуста"
    UPLOAD_ASSETS=false
fi

# Загрузка изображений на сервер (если есть)
if [ "$UPLOAD_ASSETS" = true ]; then
    echo "📤 Загрузка изображений на сервер..."
    scp assets-backup.tar.gz $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
    echo "✅ Изображения загружены"
fi

# Деплой на сервере
echo "🚀 Выполнение деплоя на сервере..."
ssh $SERVER_USER@$SERVER_HOST << EOF
set -e
cd $SERVER_PATH

echo "📥 Обновление кода..."
git fetch origin
git reset --hard origin/master

# Распаковка изображений (если загружены)
if [ -f "assets-backup.tar.gz" ]; then
    echo "📸 Обновление изображений..."

    # Бэкап существующих изображений
    if [ -d "assets" ]; then
        tar -czf assets-backup-old-\$(date +%Y%m%d_%H%M%S).tar.gz assets/
    fi

    # Распаковка новых изображений
    tar -xzf assets-backup.tar.gz
    chmod 644 assets/*.jpeg 2>/dev/null || true
    rm assets-backup.tar.gz

    IMAGES_COUNT=\$(ls assets/*.jpeg 2>/dev/null | wc -l)
    echo "✅ Изображения обновлены: \$IMAGES_COUNT файлов"
fi

echo "🔄 Перезапуск контейнеров..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "⏳ Ожидание запуска сервисов..."
sleep 15

echo "🔍 Проверка состояния..."
docker-compose ps

# Проверка что бот запустился
if docker-compose ps | grep -q "shawarma-bot.*Up"; then
    echo "✅ Бот успешно запущен"
else
    echo "❌ Ошибка запуска бота"
    echo "Логи:"
    docker-compose logs --tail=20 bot
    exit 1
fi

# Проверка БД
if docker-compose ps | grep -q "postgres.*Up"; then
    echo "✅ База данных работает"

    # Проверка данных в БД
    MENU_COUNT=\$(docker exec shawarma-postgres psql -U shawarma_user -d shawarma_db -t -c "SELECT COUNT(*) FROM menu_items;" 2>/dev/null | tr -d ' ' || echo "0")
    echo "📊 Позиций в меню: \$MENU_COUNT"
else
    echo "❌ База данных не запущена"
fi

echo "🎉 Деплой завершен успешно!"
EOF

# Очистка локального архива
if [ "$UPLOAD_ASSETS" = true ]; then
    rm assets-backup.tar.gz
    echo "✅ Локальный архив изображений удален"
fi

echo ""
echo "🎉 Деплой завершен!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Проверьте работу бота в Telegram"
echo "2. Проверьте логи: ssh $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && docker-compose logs -f bot'"
echo "3. Проверьте состояние: ssh $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && ./health-check.sh'"
echo ""
echo "🔧 Полезные команды:"
echo "ssh $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && docker-compose ps'"
echo "ssh $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && docker-compose logs bot'"
echo "ssh $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && docker-compose restart bot'"
