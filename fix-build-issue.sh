#!/bin/bash

echo "🔧 Быстрое исправление проблемы сборки"
echo "====================================="

# Остановка контейнеров
echo "🛑 Остановка контейнеров..."
docker-compose down

# Очистка Docker кэша
echo "🧹 Очистка Docker кэша..."
docker system prune -f
docker builder prune -f

# Проверка исходных файлов
echo "📁 Проверка исходных файлов:"
test -f src/api/server.ts && echo "✅ src/api/server.ts найден" || echo "❌ src/api/server.ts НЕ найден"
test -f tsconfig.json && echo "✅ tsconfig.json найден" || echo "❌ tsconfig.json НЕ найден"
test -f package.json && echo "✅ package.json найден" || echo "❌ package.json НЕ найден"

# Очистка node_modules и переустановка
echo "📦 Переустановка зависимостей..."
rm -rf node_modules package-lock.json dist/
npm cache clean --force
npm install

# Тестирование локальной сборки
echo "🔨 Тестирование локальной сборки..."
if npm run build; then
    echo "✅ Локальная сборка успешна"
    echo "Файлы в dist/:"
    ls -la dist/
    echo "Файлы в dist/api/:"
    ls -la dist/api/
    rm -rf dist/
else
    echo "❌ Ошибка локальной сборки"
    echo "Проверьте ошибки выше"
    exit 1
fi

# Пересборка Docker образов
echo "🐳 Пересборка Docker образов..."
docker-compose build --no-cache

# Запуск контейнеров
echo "🚀 Запуск контейнеров..."
docker-compose up -d

# Ожидание запуска
echo "⏳ Ожидание запуска сервисов..."
sleep 20

# Проверка состояния
echo "🔍 Проверка состояния контейнеров:"
docker-compose ps

# Проверка логов API
echo "📋 Логи API сервера:"
docker-compose logs --tail=10 api

# Проверка что API запустился
if docker-compose ps | grep -q "shawarma-api.*Up"; then
    echo "✅ API сервер запущен успешно"
else
    echo "❌ Проблемы с запуском API сервера"
    echo "Детальные логи:"
    docker-compose logs api
fi

echo ""
echo "🎉 Исправление завершено!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Проверьте API: curl http://localhost:3000/api/health"
echo "2. Проверьте Swagger: http://localhost:3000/api/docs"
echo "3. Проверьте логи: docker-compose logs -f api"
