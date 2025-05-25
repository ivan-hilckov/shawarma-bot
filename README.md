Шаурма Бот

Шаурма Бот — простой Telegram-бот для быстрого оформления заказа фастфуда (шаурма, добавки, напитки).

📋 Функциональность
• Выбор категории: 🌯 Шаурма или 🥤 Напитки
• Выбор позиции из меню по фиксированной цене
• Добавление опциональных топпингов
• Отображение содержимого корзины и итоговой суммы
• Оформление заказа с вводом телефона и адреса доставки

🚀 Быстрый старт

Предварительные требования
• Node.js (>=14)
• npm или yarn
• Доступ к Telegram Bot API (получить токен у @BotFather)

Создание каркаса проекта

# Создать папку и перейти в неё

mkdir shawarma-bot && cd shawarma-bot

# Инициализировать npm и TypeScript

npm init -y
npm install typescript ts-node --save-dev
npx tsc --init

# Установить основные зависимости

npm install express dotenv node-telegram-bot-api pg
npm install --save-dev @types/node @types/express @types/node-telegram-bot-api

# Структура проекта

mkdir -p src
cat << 'EOF' > src/index.ts
import './bot';
console.log('Шаурма Бот запущен');
EOF

cat << 'EOF' > src/bot.ts
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.BOT_TOKEN!;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
bot.sendMessage(msg.chat.id, 'Добро пожаловать в Шаурма Бот! Выберите категорию:', {
reply_markup: { keyboard: [['🌯 Шаурма'], ['🥤 Напитки']], resize_keyboard: true }
});
});

export default bot;
EOF

Настройка переменных окружения

Создайте файл .env в корне проекта:

BOT*TOKEN=<ваш*токен>
DATABASE_URL=postgres://user:password@localhost:5432/shawarma

Скрипты в package.json

Добавьте раздел scripts:

"scripts": {
"start": "ts-node src/index.ts",
"build": "tsc",
"prod": "node dist/index.js"
}

🛠️ Локальное тестирование

npm run start

    •	Запустите бота и общайтесь с ним в Telegram.
    •	Для подключения вебхуков или тестирования на локальной машине используйте ngrok.

📦 Дальнейшие шаги 1. Реализовать обработчики для выбора позиций и добавок 2. Настроить подключение к базе данных PostgreSQL 3. Добавить логику корзины и сохранение заказов 4. При необходимости оформить простой админ-интерфейс на React

https://core.telegram.org/bots/tutorial
