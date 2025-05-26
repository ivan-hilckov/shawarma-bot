#!/bin/bash
set -e

# Функция для создания tar архива без предупреждений macOS
create_tar() {
    local archive_name="$1"
    local source_dir="$2"

    # Проверяем ОС и используем соответствующие флаги
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - подавляем extended attributes
        tar --no-xattrs -czf "$archive_name" "$source_dir"
    else
        # Linux - стандартная команда
        tar -czf "$archive_name" "$source_dir"
    fi
}

echo "🚀 Деплой Шаурма Бота на сервер"

# Проверка что мы в корне проекта
if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
    echo "❌ Запустите скрипт из корня проекта"
    exit 1
fi

# Загрузка переменных из .env файлов если они существуют
if [ -f ".env.production" ]; then
    echo "📋 Загрузка переменных из .env.production..."
    export $(grep -v '^#' .env.production | xargs)
elif [ -f ".env" ]; then
    echo "📋 Загрузка переменных из .env..."
    export $(grep -v '^#' .env | xargs)
fi

# Получение параметров сервера (из env или запрос у пользователя)
if [ -n "$DEPLOY_SERVER_HOST" ]; then
    SERVER_HOST="$DEPLOY_SERVER_HOST"
    echo "✅ Адрес сервера из .env: $SERVER_HOST"
else
    read -p "Введите адрес сервера (IP или домен): " SERVER_HOST
fi

if [ -n "$DEPLOY_SERVER_PORT" ]; then
    SERVER_PORT="$DEPLOY_SERVER_PORT"
    echo "✅ Порт SSH из .env: $SERVER_PORT"
else
    read -p "Введите SSH порт [22]: " SERVER_PORT
    SERVER_PORT=${SERVER_PORT:-22}
fi

if [ -n "$DEPLOY_SERVER_USER" ]; then
    SERVER_USER="$DEPLOY_SERVER_USER"
    echo "✅ Пользователь из .env: $SERVER_USER"
else
    read -p "Введите имя пользователя: " SERVER_USER
fi

if [ -n "$DEPLOY_SERVER_PATH" ]; then
    SERVER_PATH="$DEPLOY_SERVER_PATH"
    echo "✅ Путь на сервере из .env: $SERVER_PATH"
else
    read -p "Введите путь к проекту на сервере [~/shawarma-bot]: " SERVER_PATH
    SERVER_PATH=${SERVER_PATH:-~/shawarma-bot}
fi

# Формирование SSH команды с портом
SSH_CMD="ssh -p $SERVER_PORT"
SCP_CMD="scp -P $SERVER_PORT"

echo ""
echo "🔍 Параметры деплоя:"
echo "Сервер: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
echo "Путь: $SERVER_PATH"
echo ""

read -p "Продолжить деплой? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "❌ Деплой отменен"
    exit 1
fi

# Проверка SSH подключения
echo "🔐 Проверка SSH подключения..."
if ! $SSH_CMD -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_HOST exit 2>/dev/null; then
    echo "❌ Не удается подключиться к серверу по SSH"
    echo "Убедитесь что SSH ключи настроены"
    exit 1
fi
echo "✅ SSH подключение работает"

# Проверка что на сервере есть git репозиторий
echo "📋 Проверка состояния сервера..."
if ! $SSH_CMD $SERVER_USER@$SERVER_HOST "[ -d $SERVER_PATH/.git ]"; then
    echo "❌ Git репозиторий не найден на сервере"
    echo ""
    read -p "Запустить автоматическую настройку сервера? (y/N): " AUTO_SETUP
    if [[ $AUTO_SETUP =~ ^[Yy]$ ]]; then
        echo "🚀 Запуск настройки сервера..."

        # Копируем скрипт настройки на сервер
        $SCP_CMD setup-server.sh $SERVER_USER@$SERVER_HOST:~/

        # Запускаем настройку на сервере
        $SSH_CMD $SERVER_USER@$SERVER_HOST "chmod +x ~/setup-server.sh && ~/setup-server.sh"

        echo "✅ Настройка сервера завершена"
        echo "Теперь можно продолжить деплой..."
        echo ""
    else
        echo "Сначала выполните настройку сервера: ./setup-server.sh"
        exit 1
    fi
fi

# Создание архива изображений (если есть)
if [ -d "assets" ] && [ "$(ls assets/*.jpeg 2>/dev/null | wc -l)" -gt 0 ]; then
    echo "📸 Создание архива изображений..."
    create_tar assets-backup.tar.gz assets/
    ASSETS_SIZE=$(du -h assets-backup.tar.gz | cut -f1)
    echo "✅ Архив изображений создан: $ASSETS_SIZE"
    UPLOAD_ASSETS=true
else
    echo "⚠️ Папка assets не найдена или пуста"
    UPLOAD_ASSETS=false
fi

# Загрузка .env файла на сервер
echo "📤 Загрузка .env файла на сервер..."
if [ -f ".env.production" ]; then
    echo "Копирование .env.production как .env..."
    $SCP_CMD .env.production $SERVER_USER@$SERVER_HOST:$SERVER_PATH/.env
elif [ -f ".env" ]; then
    echo "Копирование .env файла..."
    $SCP_CMD .env $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
elif [ -f "docker.env.example" ]; then
    echo "Копирование docker.env.example как .env..."
    $SCP_CMD docker.env.example $SERVER_USER@$SERVER_HOST:$SERVER_PATH/.env
else
    echo "⚠️ Файл .env не найден - потребуется настройка на сервере"
fi

# Загрузка изображений на сервер (если есть)
if [ "$UPLOAD_ASSETS" = true ]; then
    echo "📤 Загрузка изображений на сервер..."
    $SCP_CMD assets-backup.tar.gz $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
    echo "✅ Изображения загружены"
fi

# Деплой на сервере
echo "🚀 Выполнение деплоя на сервере..."
$SSH_CMD $SERVER_USER@$SERVER_HOST << EOF
set -e
cd $SERVER_PATH

echo "📥 Обновление кода..."
git fetch origin

# Определяем основную ветку (main или master)
if git show-ref --verify --quiet refs/remotes/origin/main; then
    MAIN_BRANCH="main"
elif git show-ref --verify --quiet refs/remotes/origin/master; then
    MAIN_BRANCH="master"
else
    echo "❌ Не найдена ветка main или master"
    exit 1
fi

echo "🔄 Переключение на ветку \$MAIN_BRANCH..."
git checkout \$MAIN_BRANCH
git reset --hard origin/\$MAIN_BRANCH
echo "✅ Код обновлен с ветки \$MAIN_BRANCH"

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
echo "2. Проверьте логи: $SSH_CMD $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && docker-compose logs -f bot'"
echo "3. Проверьте состояние: $SSH_CMD $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && ./health-check.sh'"
echo ""
echo "🔧 Полезные команды:"
echo "$SSH_CMD $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && docker-compose ps'"
echo "$SSH_CMD $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && docker-compose logs bot'"
echo "$SSH_CMD $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && docker-compose restart bot'"
