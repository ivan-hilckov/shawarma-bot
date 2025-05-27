#!/bin/bash

echo "🔍 Диагностика проблем сборки Docker"
echo "=================================="

# Проверка локальных файлов
echo ""
echo "📁 Проверка локальных файлов:"
echo "src/api/server.ts: $(test -f src/api/server.ts && echo "✅ найден" || echo "❌ не найден")"
echo "tsconfig.json: $(test -f tsconfig.json && echo "✅ найден" || echo "❌ не найден")"
echo "package.json: $(test -f package.json && echo "✅ найден" || echo "❌ не найден")"

# Проверка TypeScript компиляции локально
echo ""
echo "🔨 Тестирование локальной сборки TypeScript:"
if npm run build; then
    echo "✅ Локальная сборка успешна"
    echo "Файлы в dist/:"
    ls -la dist/ 2>/dev/null || echo "dist/ не найден"
    echo "Файлы в dist/api/:"
    ls -la dist/api/ 2>/dev/null || echo "dist/api/ не найден"
else
    echo "❌ Ошибка локальной сборки"
fi

# Очистка после тестирования
rm -rf dist/

echo ""
echo "🐳 Сборка Docker образа с диагностикой:"
docker build --no-cache -t shawarma-bot-debug .

echo ""
echo "🔍 Проверка содержимого собранного образа:"
docker run --rm shawarma-bot-debug sh -c "
echo '=== Содержимое /app ==='
ls -la /app/

echo '=== Содержимое /app/dist ==='
ls -la /app/dist/ 2>/dev/null || echo 'dist не найден'

echo '=== Содержимое /app/dist/api ==='
ls -la /app/dist/api/ 2>/dev/null || echo 'dist/api не найден'

echo '=== Проверка файлов ==='
test -f /app/dist/api/server.js && echo 'server.js найден' || echo 'server.js НЕ найден'
test -f /app/dist/bot.js && echo 'bot.js найден' || echo 'bot.js НЕ найден'
"

echo ""
echo "✅ Диагностика завершена"
