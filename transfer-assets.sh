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

echo "📸 Скрипт переноса изображений на сервер"

# Проверка наличия папки assets
if [ ! -d "assets" ]; then
    echo "❌ Папка assets не найдена в текущей директории"
    echo "Убедитесь что вы находитесь в корне проекта"
    exit 1
fi

# Подсчет файлов
IMAGES_COUNT=$(ls assets/*.jpeg 2>/dev/null | wc -l)
if [ $IMAGES_COUNT -eq 0 ]; then
    echo "❌ В папке assets не найдено изображений .jpeg"
    exit 1
fi

echo "✅ Найдено изображений: $IMAGES_COUNT"

# Запрос данных сервера
read -p "Введите адрес сервера (IP или домен): " SERVER_HOST
read -p "Введите имя пользователя: " SERVER_USER
read -p "Введите путь к проекту на сервере [~/shawarma-bot]: " SERVER_PATH
SERVER_PATH=${SERVER_PATH:-~/shawarma-bot}

echo ""
echo "🔍 Параметры переноса:"
echo "Сервер: $SERVER_USER@$SERVER_HOST"
echo "Путь: $SERVER_PATH"
echo "Файлов: $IMAGES_COUNT"
echo ""

read -p "Продолжить? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "❌ Отменено"
    exit 1
fi

# Создание архива
echo "📦 Создание архива изображений..."
create_tar assets-backup.tar.gz assets/
echo "✅ Архив создан: assets-backup.tar.gz ($(du -h assets-backup.tar.gz | cut -f1))"

# Проверка SSH подключения
echo "🔐 Проверка SSH подключения..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_HOST exit 2>/dev/null; then
    echo "❌ Не удается подключиться к серверу по SSH"
    echo "Убедитесь что:"
    echo "1. SSH ключи настроены"
    echo "2. Сервер доступен"
    echo "3. Пользователь и адрес указаны правильно"
    rm assets-backup.tar.gz
    exit 1
fi
echo "✅ SSH подключение работает"

# Перенос архива на сервер
echo "📤 Загрузка архива на сервер..."
scp assets-backup.tar.gz $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
echo "✅ Архив загружен"

# Распаковка на сервере
echo "📂 Распаковка архива на сервере..."
ssh $SERVER_USER@$SERVER_HOST << EOF
cd $SERVER_PATH

# Создание бэкапа существующих изображений (если есть)
if [ -d "assets" ]; then
    echo "📋 Создание бэкапа существующих изображений..."
    tar -czf assets-backup-old-\$(date +%Y%m%d_%H%M%S).tar.gz assets/
fi

# Распаковка новых изображений
echo "📂 Распаковка новых изображений..."
tar -xzf assets-backup.tar.gz

# Проверка результата
if [ -d "assets" ]; then
    EXTRACTED_COUNT=\$(ls assets/*.jpeg 2>/dev/null | wc -l)
    echo "✅ Распаковано изображений: \$EXTRACTED_COUNT"

    # Установка правильных прав доступа
    chmod 644 assets/*.jpeg
    echo "✅ Права доступа установлены"

    # Удаление архива
    rm assets-backup.tar.gz
    echo "✅ Временный архив удален"
else
    echo "❌ Ошибка распаковки"
    exit 1
fi
EOF

# Проверка результата
echo "🔍 Проверка результата..."
REMOTE_COUNT=$(ssh $SERVER_USER@$SERVER_HOST "ls $SERVER_PATH/assets/*.jpeg 2>/dev/null | wc -l")

if [ "$REMOTE_COUNT" -eq "$IMAGES_COUNT" ]; then
    echo "✅ Перенос завершен успешно!"
    echo "📊 Локально: $IMAGES_COUNT файлов"
    echo "📊 На сервере: $REMOTE_COUNT файлов"
else
    echo "⚠️ Количество файлов не совпадает"
    echo "📊 Локально: $IMAGES_COUNT файлов"
    echo "📊 На сервере: $REMOTE_COUNT файлов"
fi

# Удаление локального архива
rm assets-backup.tar.gz
echo "✅ Локальный архив удален"

echo ""
echo "🎉 Изображения успешно перенесены на сервер!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Запустите бота на сервере: docker-compose up -d"
echo "2. Проверьте работу изображений в Telegram"
echo "3. Проверьте логи: docker-compose logs -f bot"
echo ""
echo "🔧 Для проверки состояния на сервере:"
echo "ssh $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH && ./health-check.sh'"
