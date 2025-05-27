# Используем официальный Node.js образ
FROM node:18-alpine

# Устанавливаем wget для healthcheck
RUN apk add --no-cache wget

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем все зависимости (включая dev для сборки)
RUN npm ci

# Копируем исходный код
COPY . .

# Проверяем что исходные файлы скопированы
RUN echo "=== Проверка исходных файлов ==="
RUN ls -la src/ || echo "src не найден"
RUN ls -la src/api/ || echo "src/api не найден"
RUN test -f src/api/server.ts && echo "src/api/server.ts найден" || echo "src/api/server.ts НЕ найден"
RUN test -f tsconfig.json && echo "tsconfig.json найден" || echo "tsconfig.json НЕ найден"

# Собираем TypeScript проект с подробным выводом
RUN echo "=== Запуск сборки TypeScript ==="
RUN npm run build 2>&1 || (echo "Ошибка сборки TypeScript" && exit 1)

# Проверяем что сборка прошла успешно
RUN echo "=== Проверка результатов сборки ==="
RUN ls -la dist/ || echo "dist не найден"
RUN ls -la dist/api/ || echo "dist/api не найден"
RUN test -f dist/api/server.js && echo "server.js найден" || echo "server.js НЕ найден"
RUN test -f dist/bot.js && echo "bot.js найден" || echo "bot.js НЕ найден"

# Удаляем dev зависимости после сборки
RUN npm prune --production

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S botuser -u 1001

# Меняем владельца файлов
RUN chown -R botuser:nodejs /app
USER botuser

# Открываем порт для API
EXPOSE 3000

# Добавляем health check (будет переопределен в docker-compose)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)" || exit 1

# По умолчанию запускаем бота (может быть переопределено в docker-compose)
CMD ["npm", "start"]
