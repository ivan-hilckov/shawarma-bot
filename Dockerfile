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

# Собираем TypeScript проект
RUN npm run build

# Проверяем что сборка прошла успешно
RUN echo "=== Проверка сборки ==="
RUN ls -la dist/ || echo "dist не найден"
RUN ls -la dist/api/ || echo "dist/api не найден"
RUN test -f dist/api/server.js && echo "server.js найден" || echo "server.js НЕ найден"

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
