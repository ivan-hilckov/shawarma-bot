#!/bin/bash
set -e

echo "🚀 Настройка сервера для Шаурма Бота..."

# Проверка прав sudo
if ! sudo -n true 2>/dev/null; then
    echo "❌ Требуются права sudo для установки Docker"
    exit 1
fi

# Создание директорий
mkdir -p ~/shawarma-bot/backups
mkdir -p ~/shawarma-bot/logs

# Установка Docker если не установлен
if ! command -v docker &> /dev/null; then
    echo "📦 Установка Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker установлен"
else
    echo "✅ Docker уже установлен"
fi

# Установка Docker Compose если не установлен
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Установка Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose установлен"
else
    echo "✅ Docker Compose уже установлен"
fi

# Настройка SSH ключей для GitHub
echo "🔑 Настройка SSH ключей для GitHub..."
if [ ! -f ~/.ssh/id_ed25519 ]; then
    echo "Генерация SSH ключа..."
    ssh-keygen -t ed25519 -C "server@shawarma-bot" -f ~/.ssh/id_ed25519 -N ""
    echo "✅ SSH ключ создан"

    echo ""
    echo "🔑 ВАЖНО: Добавьте этот публичный ключ в GitHub:"
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
    read -p "Нажмите Enter после добавления ключа в GitHub..."

    # Тест подключения к GitHub
    echo "🔍 Проверка подключения к GitHub..."
    if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
        echo "✅ Подключение к GitHub работает"
    else
        echo "⚠️ Проблема с подключением к GitHub"
        echo "Убедитесь что ключ добавлен в GitHub"
    fi
else
    echo "✅ SSH ключ уже существует"
fi

# Клонирование репозитория
if [ ! -d "~/shawarma-bot/.git" ]; then
    echo "📥 Клонирование репозитория..."

    # Попробуем SSH сначала
    if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
        echo "Клонирование через SSH..."
        git clone git@github.com:ivan-hilckov/shawarma-bot.git ~/shawarma-bot
    else
        echo "SSH не настроен, клонирование через HTTPS..."
        read -p "Введите URL репозитория (HTTPS): " REPO_URL
        git clone $REPO_URL ~/shawarma-bot
    fi

    echo "✅ Репозиторий склонирован"
else
    echo "✅ Репозиторий уже существует"
fi

cd ~/shawarma-bot

# Создание .env файла
if [ ! -f ".env" ]; then
    echo "⚙️ Создание .env файла..."

    # Проверяем есть ли docker.env.example
    if [ -f "docker.env.example" ]; then
        cp docker.env.example .env
        echo "Скопирован docker.env.example как основа"
    else
        echo "⚠️ docker.env.example не найден, создаем базовый .env"
        cat > .env << 'EOF'
# Telegram Bot Configuration
BOT_TOKEN=YOUR_BOT_TOKEN_HERE

# Environment
NODE_ENV=production

# Database Configuration (для Docker)
DATABASE_URL=postgresql://shawarma_user:shawarma_pass@postgres:5432/shawarma_db

# PostgreSQL Configuration
POSTGRES_DB=shawarma_db
POSTGRES_USER=shawarma_user
POSTGRES_PASSWORD=shawarma_pass

# Redis Configuration
REDIS_URL=redis://redis:6379

# pgAdmin Configuration
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=admin123
EOF
    fi

    # Запрос токена бота
    read -p "Введите BOT_TOKEN: " BOT_TOKEN
    sed -i "s/YOUR_BOT_TOKEN_HERE/$BOT_TOKEN/" .env

    # Запрос ID канала уведомлений (опционально)
    read -p "Введите NOTIFICATIONS_CHAT_ID (или Enter для пропуска): " NOTIFICATIONS_CHAT_ID
    if [ ! -z "$NOTIFICATIONS_CHAT_ID" ]; then
        if grep -q "# NOTIFICATIONS_CHAT_ID=" .env; then
            sed -i "s/# NOTIFICATIONS_CHAT_ID=/NOTIFICATIONS_CHAT_ID=$NOTIFICATIONS_CHAT_ID/" .env
        else
            echo "NOTIFICATIONS_CHAT_ID=$NOTIFICATIONS_CHAT_ID" >> .env
        fi
    fi

    # Запрос ID администраторов (опционально)
    read -p "Введите ADMIN_USER_IDS через запятую (или Enter для пропуска): " ADMIN_USER_IDS
    if [ ! -z "$ADMIN_USER_IDS" ]; then
        if grep -q "# ADMIN_USER_IDS=" .env; then
            sed -i "s/# ADMIN_USER_IDS=/ADMIN_USER_IDS=$ADMIN_USER_IDS/" .env
        else
            echo "ADMIN_USER_IDS=$ADMIN_USER_IDS" >> .env
        fi
    fi

    echo "✅ .env файл создан"
else
    echo "✅ .env файл уже существует"
fi

# Проверка наличия изображений
if [ ! -d "assets" ] || [ ! -f "assets/XXL.jpeg" ]; then
    echo "⚠️ Папка assets отсутствует или пуста"
    echo "Загрузите изображения одним из способов:"
    echo "1. scp -r assets/ user@server:~/shawarma-bot/"
    echo "2. Распакуйте архив: tar -xzf assets-backup.tar.gz"
    echo "3. Загрузите файлы вручную в папку assets/"
else
    echo "✅ Изображения найдены ($(ls assets/*.jpeg 2>/dev/null | wc -l) файлов)"
fi

# Создание скрипта бэкапа
echo "📝 Создание скрипта бэкапа..."
cat > backup-script.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="$HOME/shawarma-bot/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="shawarma_db_backup_${DATE}.sql"

mkdir -p $BACKUP_DIR

# Создание бэкапа
docker exec shawarma-postgres pg_dump -U shawarma_user shawarma_db > "$BACKUP_DIR/$BACKUP_FILE"

# Сжатие бэкапа
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "✅ Backup created: $BACKUP_FILE.gz"
EOF

chmod +x backup-script.sh
echo "✅ Скрипт бэкапа создан"

# Создание скрипта проверки состояния
echo "📝 Создание скрипта проверки состояния..."
cat > health-check.sh << 'EOF'
#!/bin/bash

echo "🔍 Проверка состояния Шаурма Бота..."

# Проверка контейнеров
echo "📦 Статус контейнеров:"
docker-compose ps

# Проверка БД
echo "🗄️ Состояние базы данных:"
docker exec shawarma-postgres psql -U shawarma_user -d shawarma_db -c "
SELECT
  'Categories: ' || COUNT(*) FROM categories
UNION ALL
SELECT
  'Menu items: ' || COUNT(*) FROM menu_items
UNION ALL
SELECT
  'Orders: ' || COUNT(*) FROM orders
UNION ALL
SELECT
  'Users: ' || COUNT(*) FROM users;
" 2>/dev/null || echo "❌ БД недоступна"

# Проверка изображений
echo "🖼️ Изображения:"
if [ -d "assets" ]; then
    echo "Найдено файлов: $(ls assets/*.jpeg 2>/dev/null | wc -l)"
    ls -la assets/ 2>/dev/null || echo "Папка assets пуста"
else
    echo "❌ Папка assets не найдена"
fi

# Проверка логов
echo "📋 Последние логи бота:"
docker-compose logs --tail=10 bot 2>/dev/null || echo "❌ Логи недоступны"
EOF

chmod +x health-check.sh
echo "✅ Скрипт проверки состояния создан"

# Настройка автоматических бэкапов
echo "⏰ Настройка автоматических бэкапов..."
(crontab -l 2>/dev/null; echo "0 */6 * * * $HOME/shawarma-bot/backup-script.sh >> $HOME/shawarma-bot/logs/backup.log 2>&1") | crontab -
echo "✅ Автоматические бэкапы настроены (каждые 6 часов)"

echo ""
echo "🎉 Сервер готов к запуску!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Проверьте .env файл: nano .env"
echo "2. Загрузите изображения в папку assets/ (если не загружены)"
echo "3. Запустите бота: docker-compose up -d"
echo "4. Проверьте состояние: ./health-check.sh"
echo ""
echo "🔧 Полезные команды:"
echo "- Просмотр логов: docker-compose logs -f bot"
echo "- Перезапуск: docker-compose restart bot"
echo "- Остановка: docker-compose down"
echo "- Бэкап: ./backup-script.sh"
echo "- Проверка: ./health-check.sh"
echo ""

# Проверка необходимости перезагрузки для Docker
if groups $USER | grep -q docker; then
    echo "✅ Готово к запуску!"
else
    echo "⚠️ Требуется перезагрузка или повторный вход для применения прав Docker"
    echo "Выполните: newgrp docker или перезайдите в систему"
fi
