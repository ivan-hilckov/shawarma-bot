#!/bin/bash
set -e

echo "🔄 Скрипт миграции данных между серверами"

# Функция для проверки SSH подключения
check_ssh() {
    local user=$1
    local host=$2
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $user@$host exit 2>/dev/null; then
        echo "❌ Не удается подключиться к $user@$host"
        return 1
    fi
    return 0
}

# Запрос данных старого сервера
echo "📤 Настройка источника данных (старый сервер):"
read -p "Адрес старого сервера: " OLD_SERVER_HOST
read -p "Пользователь старого сервера: " OLD_SERVER_USER
read -p "Путь к проекту на старом сервере [~/shawarma-bot]: " OLD_SERVER_PATH
OLD_SERVER_PATH=${OLD_SERVER_PATH:-~/shawarma-bot}

echo ""
echo "📥 Настройка назначения (новый сервер):"
read -p "Адрес нового сервера: " NEW_SERVER_HOST
read -p "Пользователь нового сервера: " NEW_SERVER_USER
read -p "Путь к проекту на новом сервере [~/shawarma-bot]: " NEW_SERVER_PATH
NEW_SERVER_PATH=${NEW_SERVER_PATH:-~/shawarma-bot}

echo ""
echo "🔍 Параметры миграции:"
echo "Источник: $OLD_SERVER_USER@$OLD_SERVER_HOST:$OLD_SERVER_PATH"
echo "Назначение: $NEW_SERVER_USER@$NEW_SERVER_HOST:$NEW_SERVER_PATH"
echo ""

read -p "Продолжить миграцию? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "❌ Миграция отменена"
    exit 1
fi

# Проверка SSH подключений
echo "🔐 Проверка SSH подключений..."
if ! check_ssh $OLD_SERVER_USER $OLD_SERVER_HOST; then
    echo "❌ Проблема с подключением к старому серверу"
    exit 1
fi

if ! check_ssh $NEW_SERVER_USER $NEW_SERVER_HOST; then
    echo "❌ Проблема с подключением к новому серверу"
    exit 1
fi

echo "✅ SSH подключения работают"

# Создание временной директории
TEMP_DIR="/tmp/shawarma-migration-$(date +%Y%m%d_%H%M%S)"
mkdir -p $TEMP_DIR
echo "📁 Создана временная директория: $TEMP_DIR"

# Экспорт данных со старого сервера
echo "📤 Экспорт данных со старого сервера..."

# Экспорт базы данных
echo "🗄️ Экспорт базы данных..."
ssh $OLD_SERVER_USER@$OLD_SERVER_HOST << EOF
cd $OLD_SERVER_PATH

# Проверка что контейнер БД запущен
if ! docker-compose ps | grep -q "postgres.*Up"; then
    echo "❌ PostgreSQL контейнер не запущен на старом сервере"
    exit 1
fi

# Создание бэкапа БД
echo "📋 Создание бэкапа базы данных..."
docker exec shawarma-postgres pg_dump -U shawarma_user shawarma_db > migration_db_export.sql

# Проверка размера бэкапа
DB_SIZE=\$(du -h migration_db_export.sql | cut -f1)
echo "✅ Бэкап БД создан: \$DB_SIZE"

# Создание архива изображений
if [ -d "assets" ]; then
    echo "📸 Создание архива изображений..."
    tar -czf migration_assets_export.tar.gz assets/
    ASSETS_SIZE=\$(du -h migration_assets_export.tar.gz | cut -f1)
    echo "✅ Архив изображений создан: \$ASSETS_SIZE"
else
    echo "⚠️ Папка assets не найдена"
fi

# Создание архива конфигурации
echo "⚙️ Создание архива конфигурации..."
tar -czf migration_config_export.tar.gz .env docker-compose.yml 2>/dev/null || echo "⚠️ Некоторые файлы конфигурации не найдены"
EOF

# Скачивание данных на локальную машину
echo "📥 Скачивание данных..."
scp $OLD_SERVER_USER@$OLD_SERVER_HOST:$OLD_SERVER_PATH/migration_db_export.sql $TEMP_DIR/
echo "✅ База данных скачана"

if ssh $OLD_SERVER_USER@$OLD_SERVER_HOST "[ -f $OLD_SERVER_PATH/migration_assets_export.tar.gz ]"; then
    scp $OLD_SERVER_USER@$OLD_SERVER_HOST:$OLD_SERVER_PATH/migration_assets_export.tar.gz $TEMP_DIR/
    echo "✅ Изображения скачаны"
fi

if ssh $OLD_SERVER_USER@$OLD_SERVER_HOST "[ -f $OLD_SERVER_PATH/migration_config_export.tar.gz ]"; then
    scp $OLD_SERVER_USER@$OLD_SERVER_HOST:$OLD_SERVER_PATH/migration_config_export.tar.gz $TEMP_DIR/
    echo "✅ Конфигурация скачана"
fi

# Загрузка данных на новый сервер
echo "📤 Загрузка данных на новый сервер..."
scp $TEMP_DIR/* $NEW_SERVER_USER@$NEW_SERVER_HOST:$NEW_SERVER_PATH/
echo "✅ Данные загружены на новый сервер"

# Импорт данных на новом сервере
echo "📥 Импорт данных на новом сервере..."
ssh $NEW_SERVER_USER@$NEW_SERVER_HOST << EOF
cd $NEW_SERVER_PATH

# Остановка бота для безопасности
echo "⏸️ Остановка бота..."
docker-compose stop bot 2>/dev/null || echo "Бот не был запущен"

# Проверка что PostgreSQL запущен
if ! docker-compose ps | grep -q "postgres.*Up"; then
    echo "🚀 Запуск PostgreSQL..."
    docker-compose up -d postgres
    echo "⏳ Ожидание инициализации PostgreSQL..."
    sleep 30
fi

# Импорт базы данных
echo "🗄️ Импорт базы данных..."
if [ -f "migration_db_export.sql" ]; then
    # Очистка существующих данных (кроме структуры)
    docker exec shawarma-postgres psql -U shawarma_user -d shawarma_db -c "
    TRUNCATE TABLE order_items, orders, cart_items, users RESTART IDENTITY CASCADE;
    " 2>/dev/null || echo "⚠️ Некоторые таблицы не найдены"

    # Импорт данных
    docker exec -i shawarma-postgres psql -U shawarma_user -d shawarma_db < migration_db_export.sql

    # Проверка импорта
    ORDERS_COUNT=\$(docker exec shawarma-postgres psql -U shawarma_user -d shawarma_db -t -c "SELECT COUNT(*) FROM orders;" | tr -d ' ')
    USERS_COUNT=\$(docker exec shawarma-postgres psql -U shawarma_user -d shawarma_db -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
    echo "✅ Импорт БД завершен: \$ORDERS_COUNT заказов, \$USERS_COUNT пользователей"

    rm migration_db_export.sql
else
    echo "❌ Файл БД не найден"
fi

# Импорт изображений
if [ -f "migration_assets_export.tar.gz" ]; then
    echo "📸 Импорт изображений..."

    # Бэкап существующих изображений
    if [ -d "assets" ]; then
        tar -czf assets-backup-before-migration-\$(date +%Y%m%d_%H%M%S).tar.gz assets/
    fi

    # Распаковка новых изображений
    tar -xzf migration_assets_export.tar.gz
    chmod 644 assets/*.jpeg 2>/dev/null || true

    IMAGES_COUNT=\$(ls assets/*.jpeg 2>/dev/null | wc -l)
    echo "✅ Импорт изображений завершен: \$IMAGES_COUNT файлов"

    rm migration_assets_export.tar.gz
else
    echo "⚠️ Архив изображений не найден"
fi

# Импорт конфигурации (опционально)
if [ -f "migration_config_export.tar.gz" ]; then
    echo "⚙️ Импорт конфигурации..."

    # Бэкап существующей конфигурации
    if [ -f ".env" ]; then
        cp .env .env.backup-\$(date +%Y%m%d_%H%M%S)
    fi

    # Распаковка (с осторожностью)
    tar -xzf migration_config_export.tar.gz
    echo "✅ Конфигурация импортирована (проверьте .env файл)"

    rm migration_config_export.tar.gz
else
    echo "⚠️ Архив конфигурации не найден"
fi

# Запуск бота
echo "🚀 Запуск бота..."
docker-compose up -d

# Проверка состояния
echo "🔍 Проверка состояния..."
sleep 10
docker-compose ps
EOF

# Очистка временных файлов на старом сервере
echo "🧹 Очистка временных файлов..."
ssh $OLD_SERVER_USER@$OLD_SERVER_HOST "cd $OLD_SERVER_PATH && rm -f migration_*.sql migration_*.tar.gz"

# Очистка локальной временной директории
rm -rf $TEMP_DIR
echo "✅ Временные файлы удалены"

echo ""
echo "🎉 Миграция завершена!"
echo ""
echo "📋 Рекомендуемые проверки:"
echo "1. Проверьте работу бота в Telegram"
echo "2. Проверьте логи: ssh $NEW_SERVER_USER@$NEW_SERVER_HOST 'cd $NEW_SERVER_PATH && docker-compose logs -f bot'"
echo "3. Проверьте данные: ssh $NEW_SERVER_USER@$NEW_SERVER_HOST 'cd $NEW_SERVER_PATH && ./health-check.sh'"
echo "4. Проверьте изображения в меню"
echo ""
echo "⚠️ Не забудьте:"
echo "1. Обновить DNS записи (если меняется домен)"
echo "2. Настроить SSL сертификаты"
echo "3. Обновить webhook URL бота (если используется)"
echo "4. Настроить мониторинг и бэкапы"
