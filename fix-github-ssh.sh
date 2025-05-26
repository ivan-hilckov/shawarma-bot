#!/bin/bash
set -e

echo "🔧 Исправление SSH доступа к GitHub на сервере"

# Загрузка переменных из .env файлов если они существуют
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
    read -p "Введите путь [~/shawarma-bot]: " SERVER_PATH
    SERVER_PATH=${SERVER_PATH:-~/shawarma-bot}
fi

SSH_CMD="ssh -p $SERVER_PORT"

echo ""
echo "🔍 Параметры:"
echo "Сервер: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
echo "Путь: $SERVER_PATH"
echo ""

# Генерация SSH ключа на сервере и настройка GitHub
echo "🔑 Настройка SSH ключей на сервере..."
$SSH_CMD $SERVER_USER@$SERVER_HOST << 'EOF'
set -e

echo "🔑 Генерация SSH ключа для GitHub..."

# Создаем SSH ключ если его нет
if [ ! -f ~/.ssh/id_ed25519 ]; then
    ssh-keygen -t ed25519 -C "server@shawarma-bot" -f ~/.ssh/id_ed25519 -N ""
    echo "✅ SSH ключ создан"
else
    echo "✅ SSH ключ уже существует"
fi

echo ""
echo "🔑 СКОПИРУЙТЕ ЭТОТ КЛЮЧ В GITHUB:"
echo "=========================================="
cat ~/.ssh/id_ed25519.pub
echo "=========================================="
echo ""
echo "Инструкция:"
echo "1. Скопируйте ключ выше"
echo "2. Идите в GitHub → Settings → SSH and GPG keys"
echo "3. Нажмите 'New SSH key'"
echo "4. Вставьте ключ и дайте название 'Shawarma Bot Server'"
echo ""

# Добавляем GitHub в known_hosts
ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null || true

EOF

echo ""
echo "⏳ Ожидание добавления ключа в GitHub..."
read -p "Нажмите Enter после добавления ключа в GitHub..."

# Проверка подключения к GitHub
echo "🔍 Проверка подключения к GitHub..."
if $SSH_CMD $SERVER_USER@$SERVER_HOST "ssh -T git@github.com" 2>&1 | grep -q "successfully authenticated"; then
    echo "✅ Подключение к GitHub работает!"

    # Клонирование репозитория если его нет
    echo "📥 Проверка репозитория..."
    if ! $SSH_CMD $SERVER_USER@$SERVER_HOST "[ -d $SERVER_PATH/.git ]"; then
        echo "Клонирование репозитория..."
        $SSH_CMD $SERVER_USER@$SERVER_HOST "git clone git@github.com:ivan-hilckov/shawarma-bot.git $SERVER_PATH"
        echo "✅ Репозиторий склонирован"
    else
        echo "✅ Репозиторий уже существует"
    fi

    echo ""
    echo "🎉 SSH настроен успешно!"
    echo "Теперь можете запустить: ./deploy.sh"

else
    echo "❌ Проблема с подключением к GitHub"
    echo "Убедитесь что ключ правильно добавлен в GitHub"
    exit 1
fi
