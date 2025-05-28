#!/bin/bash
set -e

# Функция для создания tar архива без предупреждений macOS
create_tar() {
    local archive_name="$1"
    local source_dir="$2"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        tar --no-xattrs -czf "$archive_name" "$source_dir"
    else
        tar -czf "$archive_name" "$source_dir"
    fi
}

echo "🚀 Деплой Шаурма Бота на сервер"

# Проверка что мы в папке deployment
if [ ! -f "../package.json" ] || [ ! -f "../docker-compose.yml" ]; then
    echo "❌ Запустите скрипт из папки deployment в корне проекта"
    echo "💡 Используйте: cd deployment && ./deploy.sh"
    exit 1
fi

# Переход в корень проекта для работы с файлами
cd ..

# Загрузка переменных из .env файлов
if [ -f ".env.production" ]; then
    echo "📋 Загрузка переменных из .env.production..."
    export $(grep -v '^#' .env.production | xargs)
elif [ -f ".env" ]; then
    echo "📋 Загрузка переменных из .env..."
    export $(grep -v '^#' .env | xargs)
fi

# Получение параметров сервера
if [ -n "$DEPLOY_SERVER_HOST" ]; then
    SERVER_HOST="$DEPLOY_SERVER_HOST"
    SERVER_PORT="$DEPLOY_SERVER_PORT"
    SERVER_USER="$DEPLOY_SERVER_USER"
    SERVER_PATH="$DEPLOY_SERVER_PATH"
    echo "✅ Параметры сервера из .env"
else
    read -p "Введите адрес сервера: " SERVER_HOST
    read -p "Введите SSH порт [22]: " SERVER_PORT
    SERVER_PORT=${SERVER_PORT:-22}
    read -p "Введите пользователя: " SERVER_USER
    read -p "Путь на сервере [~/shawarma-bot]: " SERVER_PATH
    SERVER_PATH=${SERVER_PATH:-~/shawarma-bot}
fi

SSH_CMD="ssh -p $SERVER_PORT"
SCP_CMD="scp -P $SERVER_PORT"

echo ""
echo "🔍 Деплой: $SERVER_USER@$SERVER_HOST:$SERVER_PORT → $SERVER_PATH"
echo ""

read -p "Продолжить? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "❌ Отменено"
    exit 1
fi

# Проверка SSH
echo "🔐 Проверка SSH..."
if ! $SSH_CMD -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_HOST exit 2>/dev/null; then
    echo "❌ SSH недоступен"
    exit 1
fi

# Проверка репозитория
if ! $SSH_CMD $SERVER_USER@$SERVER_HOST "[ -d $SERVER_PATH/.git ]"; then
    echo "❌ Git репозиторий не найден"
    read -p "Запустить настройку сервера? (y/N): " AUTO_SETUP
    if [[ $AUTO_SETUP =~ ^[Yy]$ ]]; then
        $SCP_CMD deployment/setup-server.sh $SERVER_USER@$SERVER_HOST:~/
        $SSH_CMD $SERVER_USER@$SERVER_HOST "chmod +x ~/setup-server.sh && ~/setup-server.sh"
    else
        exit 1
    fi
fi

# Архив изображений
if [ -d "assets" ] && [ "$(ls assets/*.jpeg 2>/dev/null | wc -l)" -gt 0 ]; then
    echo "📸 Архивирование изображений..."
    create_tar assets-backup.tar.gz assets/
    UPLOAD_ASSETS=true
else
    UPLOAD_ASSETS=false
fi

# Загрузка файлов
echo "📤 Загрузка файлов..."
if [ -f ".env.production" ]; then
    $SCP_CMD .env.production $SERVER_USER@$SERVER_HOST:$SERVER_PATH/.env
elif [ -f ".env" ]; then
    $SCP_CMD .env $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
fi

if [ "$UPLOAD_ASSETS" = true ]; then
    $SCP_CMD assets-backup.tar.gz $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
fi

# Загрузка nginx конфигурации
if [ -f "deployment/nginx.conf" ]; then
    echo "🔧 Загрузка nginx конфигурации..."
    $SCP_CMD deployment/nginx.conf $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
fi

# Загрузка скрипта настройки веб-страниц
if [ -f "deployment/setup-landing-pages.sh" ]; then
    echo "🌍 Загрузка скрипта настройки веб-страниц..."
    $SCP_CMD deployment/setup-landing-pages.sh $SERVER_USER@$SERVER_HOST:$SERVER_PATH/deployment/
fi

# Деплой на сервере
echo "🚀 Деплой на сервере..."
$SSH_CMD $SERVER_USER@$SERVER_HOST << EOF
set -e
cd $SERVER_PATH

echo "📥 Обновление кода..."
git fetch origin
MAIN_BRANCH=\$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
git checkout \$MAIN_BRANCH
git reset --hard origin/\$MAIN_BRANCH
git pull --all

# Изображения
if [ -f "assets-backup.tar.gz" ]; then
    echo "📸 Обновление изображений..."
    [ -d "assets" ] && tar -czf assets-backup-old-\$(date +%Y%m%d_%H%M%S).tar.gz assets/
    tar -xzf assets-backup.tar.gz
    chmod 644 assets/*.jpeg 2>/dev/null || true
    rm assets-backup.tar.gz

    # Очистка старых бэкапов (оставляем только последние 3)
    echo "🧹 Очистка старых бэкапов..."
    ls -t assets-backup-old-*.tar.gz 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null || true
fi

# Обновление nginx конфигурации
if [ -f "nginx.conf" ]; then
    echo "🔧 Обновление nginx конфигурации..."

    # Проверка синтаксиса новой конфигурации
    if nginx -t -c \$PWD/nginx.conf 2>/dev/null; then
        # Создание бэкапа текущей конфигурации
        sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup-\$(date +%Y%m%d_%H%M%S)

        # Замена конфигурации
        sudo cp nginx.conf /etc/nginx/nginx.conf

        # Перезагрузка nginx
        if sudo nginx -t && sudo systemctl reload nginx; then
            echo "✅ Nginx конфигурация обновлена"
        else
            echo "❌ Ошибка перезагрузки nginx, откат конфигурации..."
            sudo cp /etc/nginx/nginx.conf.backup-\$(date +%Y%m%d_%H%M%S) /etc/nginx/nginx.conf
            sudo systemctl reload nginx
            echo "⚠️ Конфигурация nginx откачена"
        fi
    else
        echo "❌ Ошибка в синтаксисе nginx.conf, пропускаем обновление"
    fi

    # Очистка старых бэкапов nginx (оставляем последние 5)
    sudo find /etc/nginx/ -name "nginx.conf.backup-*" -type f | sort -r | tail -n +6 | sudo xargs rm -f 2>/dev/null || true
fi

# Настройка веб-страниц для доменов
if [ -f "deployment/setup-landing-pages.sh" ]; then
    echo "🌍 Настройка лендинговых страниц..."
    chmod +x deployment/setup-landing-pages.sh
    sudo deployment/setup-landing-pages.sh
fi

echo "🔄 Перезапуск..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "⏳ Ожидание..."
sleep 15

echo "🔍 Проверка..."
docker-compose ps

if docker-compose ps | grep -q "shawarma-.*Up.*Up"; then
    echo "✅ Сервисы запущены"
else
    echo "❌ Проблемы с запуском"
    docker-compose logs --tail=10
    exit 1
fi

echo "🎉 Деплой завершен!"
EOF

# Очистка
[ "$UPLOAD_ASSETS" = true ] && rm assets-backup.tar.gz

echo ""
echo "🎉 Готово!"
echo "🌍 Доступные домены:"
echo "  🏪 http://botgarden.store     - Основной магазин Shawarma Bot"
echo "  🛒 http://botgarden.shop     - Торговая площадка ботов"
echo "  🔧 http://botgarden.tech     - Техническая документация"
echo "  🌐 http://botcraft.tech      - Сервис крафт-ботов"
echo "  🎮 http://botgrover.fun      - Игровые боты"
echo "  🇷🇺 http://botgrover.ru      - Российская локализация"
echo ""
echo "🔧 Команды:"
echo "  Логи: $SSH_CMD $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && docker-compose logs -f'"
echo "  Статус: $SSH_CMD $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && ./deployment/health-check.sh'"
