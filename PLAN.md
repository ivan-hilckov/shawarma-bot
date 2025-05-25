## 🥙 Telegram-бoт для фастфуда — "Шаурма Бот"

### 🚧 Технологический стек

- **Frontend (опционально для админки):** React, TypeScript
- **Backend:** Node.js, Express, TypeScript
- **БД:** PostgreSQL

---

## 📌 Этапы разработки

### 1️⃣ Проектирование и настройка

- Создание структуры проекта

  ```
  shawarma-bot/
  ├── backend/
  │   ├── src/
  │   │   ├── index.ts
  │   │   ├── bot.ts
  │   │   ├── database.ts
  │   │   └── routes/
  │   └── package.json
  └── frontend/ (опционально)
  ```

- Установка зависимостей:

  ```bash
  npm init -y
  npm install express typescript ts-node dotenv pg node-telegram-bot-api
  npm install --save-dev @types/node @types/express
  ```

### 2️⃣ Проектирование базы данных (локально)

- Создание структуры БД:

```sql
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  category VARCHAR(20),
  name VARCHAR(50),
  price INTEGER
);

CREATE TABLE toppings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  price INTEGER
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20),
  address VARCHAR(100),
  total INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  order_id INTEGER REFERENCES orders(id),
  item_name VARCHAR(50),
  toppings VARCHAR(100),
  price INTEGER
);
```

### 3️⃣ Реализация логики локального бота

- Создание файла `bot.ts`:

```typescript
import TelegramBot from "node-telegram-bot-api";

const bot = new TelegramBot("<TOKEN>", { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    'Добро пожаловать в "Шаурма Бот"! Выберите категорию:',
    {
      reply_markup: {
        keyboard: [["🌯 Шаурма"], ["🥤 Напитки"]],
        resize_keyboard: true,
      },
    }
  );
});

// Далее обработчики для категорий, добавок и корзины...
```

### 4️⃣ Локальное тестирование

- Запусти сервер локально:

```bash
npx ts-node backend/src/index.ts
```

- Проверяй взаимодействие через Telegram на локальном уровне (с ngrok при необходимости).

### 5️⃣ Дополнительный шаг (опционально)

- Создание минимального Frontend на React для управления позициями меню и заказами (локальный CRUD-интерфейс).

---

## 📌 Дальнейшие шаги после локального прототипа

- Интеграция с облачным сервером (например, VPS от Hetzner).
- Подключение SSL и домена.
- Развёртывание PostgreSQL на сервере.
- Полноценное тестирование и релиз.
