#!/bin/bash

# 🌍 Скрипт настройки лендинговых страниц для всех доменов
# Версия: 1.0
# Дата: 28-05-2025

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WEB_DIR="/var/www/shawarma-bot"

echo "🌍 Настройка лендинговых страниц для всех доменов..."
echo "📂 Проект: $PROJECT_DIR"
echo "🌐 Web директория: $WEB_DIR"

# Проверка, что мы root или sudo
if [[ $EUID -ne 0 ]]; then
   echo "❌ Этот скрипт должен запускаться с правами root или sudo"
   exit 1
fi

# Создание директории для веб-файлов
echo "📁 Создание директории $WEB_DIR..."
mkdir -p "$WEB_DIR/public"

# Копирование HTML файлов
echo "📄 Копирование HTML страниц..."

if [ -f "$PROJECT_DIR/public/index.html" ]; then
    cp "$PROJECT_DIR/public/index.html" "$WEB_DIR/public/"
    echo "✅ index.html (botgarden.store) скопирован"
else
    echo "⚠️ index.html не найден в $PROJECT_DIR/public/"
fi

if [ -f "$PROJECT_DIR/public/shop.html" ]; then
    cp "$PROJECT_DIR/public/shop.html" "$WEB_DIR/public/"
    echo "✅ shop.html (botgarden.shop) скопирован"
else
    echo "⚠️ shop.html не найден"
fi

if [ -f "$PROJECT_DIR/public/tech.html" ]; then
    cp "$PROJECT_DIR/public/tech.html" "$WEB_DIR/public/"
    echo "✅ tech.html (botgarden.tech) скопирован"
else
    echo "⚠️ tech.html не найден"
fi

if [ -f "$PROJECT_DIR/public/craft.html" ]; then
    cp "$PROJECT_DIR/public/craft.html" "$WEB_DIR/public/"
    echo "✅ craft.html (botcraft.tech) скопирован"
else
    echo "⚠️ craft.html не найден"
fi

if [ -f "$PROJECT_DIR/public/fun.html" ]; then
    cp "$PROJECT_DIR/public/fun.html" "$WEB_DIR/public/"
    echo "✅ fun.html (botgrover.fun) скопирован"
else
    echo "⚠️ fun.html не найден"
fi

if [ -f "$PROJECT_DIR/public/ru.html" ]; then
    cp "$PROJECT_DIR/public/ru.html" "$WEB_DIR/public/"
    echo "✅ ru.html (botgrover.ru) скопирован"
else
    echo "⚠️ ru.html не найден"
fi

# Установка правильных прав доступа
echo "🔐 Установка прав доступа..."
chown -R nginx:nginx "$WEB_DIR"
chmod -R 644 "$WEB_DIR/public/*.html"
chmod 755 "$WEB_DIR" "$WEB_DIR/public"

# Проверка nginx конфигурации
echo "🔧 Проверка nginx конфигурации..."
if nginx -t; then
    echo "✅ Nginx конфигурация корректна"

    # Перезагрузка nginx
    echo "🔄 Перезагрузка nginx..."
    systemctl reload nginx
    echo "✅ Nginx перезагружен"
else
    echo "❌ Ошибка в nginx конфигурации!"
    exit 1
fi

# Отображение статуса
echo ""
echo "🎉 Лендинговые страницы настроены!"
echo ""
echo "📋 Доступные страницы:"
echo "🏪 http://botgarden.store     - Основной магазин Shawarma Bot"
echo "🛒 http://botgarden.shop     - Торговая площадка ботов"
echo "🔧 http://botgarden.tech     - Техническая документация"
echo "🌐 http://botcraft.tech      - Сервис крафт-ботов"
echo "🎮 http://botgrover.fun      - Игровые боты"
echo "🇷🇺 http://botgrover.ru      - Российская локализация"
echo ""
echo "🔗 API и документация:"
echo "📚 http://botgarden.store/api/docs - Swagger UI"
echo "❤️ http://botgarden.store/health   - Health Check"
echo ""

# Проверка доступности страниц
echo "🧪 Проверка доступности страниц..."

check_page() {
    local domain=$1
    local description=$2

    if curl -s -o /dev/null -w "%{http_code}" "http://localhost" -H "Host: $domain" | grep -q "200"; then
        echo "✅ $domain ($description) - OK"
    else
        echo "❌ $domain ($description) - FAIL"
    fi
}

check_page "botgarden.store" "Основной магазин"
check_page "botgarden.shop" "Торговая площадка"
check_page "botgarden.tech" "Техническая документация"
check_page "botcraft.tech" "Сервис крафт-ботов"
check_page "botgrover.fun" "Игровые боты"
check_page "botgrover.ru" "Российская локализация"

echo ""
echo "🎯 Настройка завершена!"

# Дополнительная информация
echo ""
echo "💡 Полезные команды:"
echo "sudo nginx -t                    # Проверка конфигурации"
echo "sudo systemctl reload nginx     # Перезагрузка nginx"
echo "sudo journalctl -u nginx -f     # Логи nginx"
echo "ls -la $WEB_DIR/public/         # Список файлов"
