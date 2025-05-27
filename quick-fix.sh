#!/bin/bash

echo "🔧 Быстрое исправление проблем"
echo "=============================="

# Проверка аргументов
SERVICE=${1:-api}

if [[ "$SERVICE" != "api" && "$SERVICE" != "bot" ]]; then
    echo "Использование: $0 [api|bot]"
    echo "По умолчанию: api"
    exit 1
fi

echo "🎯 Исправление сервиса: $SERVICE"

# Остановка и удаление контейнера
echo "🛑 Остановка $SERVICE контейнера..."
docker-compose stop $SERVICE
docker-compose rm -f $SERVICE

# Проверка ключевых файлов
echo "📁 Проверка файлов:"
if [[ "$SERVICE" == "api" ]]; then
    test -f src/api/server.ts && echo "✅ server.ts" || echo "❌ server.ts"
    test -f tsconfig.api.json && echo "✅ tsconfig.api.json" || echo "❌ tsconfig.api.json"
else
    test -f src/bot.ts && echo "✅ bot.ts" || echo "❌ bot.ts"
    test -f tsconfig.bot.json && echo "✅ tsconfig.bot.json" || echo "❌ tsconfig.bot.json"
fi

# Тест сборки
echo "🔨 Тест сборки $SERVICE..."
if npm run build:$SERVICE > /dev/null 2>&1; then
    echo "✅ Сборка работает"
    rm -rf dist/
else
    echo "❌ Ошибка сборки"
    echo "Попробуйте: npm install && npm run build:$SERVICE"
    exit 1
fi

# Пересборка контейнера
echo "🐳 Пересборка $SERVICE..."
docker-compose build --no-cache $SERVICE

# Запуск контейнера
echo "🚀 Запуск $SERVICE..."
docker-compose up -d $SERVICE

# Проверка
echo "⏳ Ожидание 10 секунд..."
sleep 10

if docker-compose ps | grep -q "shawarma-$SERVICE.*Up"; then
    echo "✅ $SERVICE запущен"

    if [[ "$SERVICE" == "api" ]]; then
        sleep 5
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            echo "🎉 API работает!"
            echo "📚 Swagger: http://localhost:3000/api/docs"
        else
            echo "⚠️ API не отвечает"
        fi
    else
        echo "🤖 Бот запущен, проверьте Telegram"
    fi
else
    echo "❌ Проблема с запуском"
    docker-compose logs --tail=10 $SERVICE
fi

echo "✅ Готово!"
