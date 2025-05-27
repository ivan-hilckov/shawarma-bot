#!/bin/bash

echo "⚡ Экстренное исправление сборки (быстрый режим)"
echo "=============================================="

# Остановка только проблемного контейнера
echo "🛑 Остановка API контейнера..."
docker-compose stop api

# Удаление только API контейнера
echo "🗑️ Удаление API контейнера..."
docker-compose rm -f api

# Проверка ключевых файлов
echo "📁 Быстрая проверка файлов:"
test -f src/api/server.ts && echo "✅ server.ts" || echo "❌ server.ts"
test -f package.json && echo "✅ package.json" || echo "❌ package.json"

# Быстрая проверка зависимостей TypeScript
echo "🔍 Проверка TypeScript..."
if ! npm list typescript > /dev/null 2>&1; then
    echo "📦 Переустановка TypeScript..."
    npm install typescript --save-dev
fi

# Тест быстрой сборки
echo "🔨 Быстрый тест сборки..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Сборка работает"
    rm -rf dist/
else
    echo "❌ Проблема с TypeScript сборкой"
    echo "Попробуйте полный скрипт: ./fix-build-issue.sh"
    exit 1
fi

# Пересборка только API контейнера
echo "🐳 Пересборка API контейнера..."
docker-compose build --no-cache api

# Запуск API контейнера
echo "🚀 Запуск API..."
docker-compose up -d api

# Быстрая проверка
echo "⏳ Ожидание 10 секунд..."
sleep 10

if docker-compose ps | grep -q "shawarma-api.*Up"; then
    echo "✅ API контейнер запущен"

    # Проверка логов
    echo "📋 Последние логи:"
    docker-compose logs --tail=5 api

    # Проверка endpoint
    sleep 3
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "🎉 API работает!"
    else
        echo "⚠️ API не отвечает, проверьте логи"
    fi
else
    echo "❌ Проблема с запуском"
    docker-compose logs api
fi

echo ""
echo "⚡ Быстрое исправление завершено!"
