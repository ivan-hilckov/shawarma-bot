#!/bin/bash

echo "🔍 Проверка состояния Шаурма Бота v2.4..."

# Проверка контейнеров
echo "📦 Статус контейнеров:"
docker-compose ps

echo ""
echo "🔍 Детальная проверка сервисов:"

# Проверка API
echo "🌐 API Server:"
if docker-compose ps | grep -q "shawarma-api.*Up"; then
    echo "✅ API контейнер запущен"

    # Проверка health endpoint
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ API health endpoint отвечает"

        # Получаем статус API
        API_STATUS=$(curl -s http://localhost:3000/api/health | jq -r '.status' 2>/dev/null || echo "unknown")
        echo "📊 API статус: $API_STATUS"

        # Проверяем Swagger UI
        if curl -s http://localhost:3000/api/docs > /dev/null 2>&1; then
            echo "✅ Swagger UI доступен: http://localhost:3000/api/docs"
        else
            echo "⚠️ Swagger UI недоступен"
        fi
    else
        echo "❌ API health endpoint не отвечает"
    fi
else
    echo "❌ API контейнер не запущен"
fi

# Проверка бота
echo ""
echo "🤖 Telegram Bot:"
if docker-compose ps | grep -q "shawarma-bot.*Up"; then
    echo "✅ Бот контейнер запущен"

    # Проверяем логи бота на ошибки
    BOT_ERRORS=$(docker-compose logs --tail=50 bot 2>/dev/null | grep -i "error\|failed\|exception" | wc -l)
    if [ "$BOT_ERRORS" -eq 0 ]; then
        echo "✅ Нет ошибок в логах бота"
    else
        echo "⚠️ Найдено $BOT_ERRORS ошибок в логах бота"
    fi

    # Проверяем подключение бота к API
    API_CONNECTION=$(docker-compose logs --tail=20 bot 2>/dev/null | grep -i "api.*connect\|api.*health" | tail -1)
    if [ ! -z "$API_CONNECTION" ]; then
        echo "📡 Последнее подключение к API: $API_CONNECTION"
    fi
else
    echo "❌ Бот контейнер не запущен"
fi

# Проверка БД
echo ""
echo "🗄️ База данных:"
if docker-compose ps | grep -q "shawarma-postgres.*Up"; then
    echo "✅ PostgreSQL контейнер запущен"

    # Проверка данных в БД
    echo "📊 Статистика БД:"
    docker exec shawarma-postgres psql -U shawarma_user -d shawarma_db -c "
    SELECT
      'Categories: ' || COUNT(*) as stat FROM categories
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
else
    echo "❌ PostgreSQL контейнер не запущен"
fi

# Проверка Redis
echo ""
echo "🔴 Redis:"
if docker-compose ps | grep -q "shawarma-redis.*Up"; then
    echo "✅ Redis контейнер запущен"

    # Проверка подключения к Redis
    REDIS_INFO=$(docker exec shawarma-redis redis-cli info server 2>/dev/null | grep "redis_version" || echo "")
    if [ ! -z "$REDIS_INFO" ]; then
        echo "📊 $REDIS_INFO"
    else
        echo "⚠️ Не удается получить информацию о Redis"
    fi
else
    echo "❌ Redis контейнер не запущен"
fi

# Проверка изображений
echo ""
echo "🖼️ Изображения:"
if [ -d "assets" ]; then
    IMAGES_COUNT=$(ls assets/*.jpeg 2>/dev/null | wc -l)
    echo "✅ Найдено изображений: $IMAGES_COUNT"

    if [ $IMAGES_COUNT -eq 0 ]; then
        echo "⚠️ Изображения не найдены - меню может отображаться без фото"
    fi
else
    echo "❌ Папка assets не найдена"
fi

# Проверка Telegram Mini App
echo ""
echo "📱 Telegram Mini App:"
if [ -f "/var/www/shawarma-bot/public/index.html" ]; then
    echo "✅ Mini App файл найден"

    # Проверка доступности через nginx
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost" -H "Host: botgarden.store" | grep -q "200"; then
        echo "✅ Mini App доступен через nginx"

        # Проверка Telegram WebApp SDK в HTML
        if grep -q "telegram-web-app.js" "/var/www/shawarma-bot/public/index.html"; then
            echo "✅ Telegram WebApp SDK подключен"
        else
            echo "⚠️ Telegram WebApp SDK не найден в HTML"
        fi

        # Проверка основных функций
        if grep -q "showPage\|testTelegramData\|loadOrders" "/var/www/shawarma-bot/public/index.html"; then
            echo "✅ Основные функции Mini App найдены"
        else
            echo "⚠️ Некоторые функции Mini App отсутствуют"
        fi
    else
        echo "❌ Mini App недоступен через nginx"
    fi
else
    echo "❌ Mini App файл не найден"
fi

# Проверка сетевого подключения между сервисами
echo ""
echo "🌐 Сетевое подключение:"
if docker-compose ps | grep -q "shawarma-bot.*Up" && docker-compose ps | grep -q "shawarma-api.*Up"; then
    # Проверяем может ли бот подключиться к API
    BOT_TO_API=$(docker exec shawarma-bot wget -q --spider http://api:3000/api/health 2>&1 && echo "OK" || echo "FAIL")
    echo "🔗 Бот → API: $BOT_TO_API"

    # Проверяем может ли API подключиться к БД
    API_TO_DB=$(docker exec shawarma-api node -e "
    const { Pool } = require('pg');
    const pool = new Pool({connectionString: process.env.DATABASE_URL});
    pool.query('SELECT 1').then(() => console.log('OK')).catch(() => console.log('FAIL')).finally(() => pool.end());
    " 2>/dev/null)
    echo "🔗 API → БД: $API_TO_DB"

    # Проверяем может ли API подключиться к Redis
    API_TO_REDIS=$(docker exec shawarma-api node -e "
    const redis = require('redis');
    const client = redis.createClient({url: process.env.REDIS_URL});
    client.connect().then(() => client.ping()).then(() => console.log('OK')).catch(() => console.log('FAIL')).finally(() => client.quit());
    " 2>/dev/null)
    echo "🔗 API → Redis: $API_TO_REDIS"
fi

echo ""
echo "📋 Последние логи бота:"
docker-compose logs --tail=10 bot 2>/dev/null || echo "❌ Логи недоступны"

echo ""
echo "📋 Последние логи API:"
docker-compose logs --tail=10 api 2>/dev/null || echo "❌ Логи недоступны"

echo ""
echo "🎯 Полезные команды:"
echo "- Логи бота: docker-compose logs -f bot"
echo "- Логи API: docker-compose logs -f api"
echo "- Перезапуск: docker-compose restart"
echo "- API документация: http://localhost:3000/api/docs"
echo "- Тест API: curl http://localhost:3000/api/health"
echo "- Тест Mini App: curl -H 'Host: botgarden.store' http://localhost/"
echo "- Проверка nginx: sudo nginx -t && sudo systemctl status nginx"
