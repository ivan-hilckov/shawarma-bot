# 🗄️ Документация базы данных

## 📊 Обзор структуры

База данных **shawarma_db** содержит 6 основных таблиц для управления пользователями, меню, заказами и корзиной покупок.

### 🏗️ Архитектура

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   users     │    │ categories  │    │ menu_items  │
│             │    │             │    │             │
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │
│ username    │    │ name        │    │ name        │
│ first_name  │    │ description │    │ description │
│ last_name   │    │ emoji       │    │ price       │
│ created_at  │    │ created_at  │    │ category_id │◄─┐
│ updated_at  │    └─────────────┘    │ image_url   │  │
└─────────────┘                       │ is_available│  │
       │                              │ created_at  │  │
       │                              │ updated_at  │  │
       │                              └─────────────┘  │
       │                                     │         │
       │                                     │         │
       ▼                                     ▼         │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│   orders    │    │ order_items │    │ cart_items  │  │
│             │    │             │    │             │  │
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │  │
│ user_id (FK)│◄───┤ order_id(FK)│    │ user_id(FK) │◄─┘
│ status      │    │ menu_item_id│◄───┤ menu_item_id│◄─┘
│ total_price │    │ quantity    │    │ quantity    │
│ created_at  │    │ price       │    │ created_at  │
│ updated_at  │    │ created_at  │    │ updated_at  │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 📋 Детальное описание таблиц

### 1. 👥 users - Пользователи Telegram

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,              -- Telegram User ID
    username VARCHAR(255),              -- @username (может быть NULL)
    first_name VARCHAR(255),            -- Имя пользователя
    last_name VARCHAR(255),             -- Фамилия (может быть NULL)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Особенности:**

- `id` - это Telegram User ID (BIGINT для больших чисел)
- `username` может быть NULL (не у всех пользователей есть @username)
- Автоматическое обновление `updated_at` через триггер

**Индексы:**

- PRIMARY KEY на `id`

### 2. 📂 categories - Категории меню

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,              -- Автоинкремент ID
    name VARCHAR(100) NOT NULL UNIQUE, -- Уникальное имя категории
    description TEXT,                   -- Описание категории
    emoji VARCHAR(10),                  -- Эмодзи для UI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Данные:**

- `shawarma` - Вкусная шаурма 🌯
- `drinks` - Освежающие напитки 🥤

**Особенности:**

- `name` должно быть уникальным
- `emoji` для красивого отображения в интерфейсе

### 3. 🍽️ menu_items - Товары меню

```sql
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,              -- Автоинкремент ID
    name VARCHAR(255) NOT NULL,         -- Название товара
    description TEXT,                   -- Описание товара
    price DECIMAL(10,2) NOT NULL,       -- Цена (до 99,999,999.99)
    category_id INTEGER REFERENCES categories(id), -- Связь с категорией
    image_url VARCHAR(500),             -- URL изображения
    is_available BOOLEAN DEFAULT true,  -- Доступность товара
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Особенности:**

- `price` - DECIMAL для точных денежных расчетов
- `is_available` - для временного отключения товаров
- `image_url` - для будущего API и веб-интерфейса
- Связь с `categories` через `category_id`

**Индексы:**

- PRIMARY KEY на `id`
- INDEX на `category_id` для быстрой фильтрации

**Текущие данные:** 15 товаров (12 шаурмы + 3 напитка)

### 4. 📦 orders - Заказы

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,              -- Автоинкремент ID заказа
    user_id BIGINT REFERENCES users(id), -- Связь с пользователем
    status VARCHAR(50) DEFAULT 'pending', -- Статус заказа
    total_price DECIMAL(10,2) NOT NULL, -- Общая сумма заказа
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Статусы заказов:**

- `pending` - В ожидании (по умолчанию)
- `confirmed` - Подтвержден
- `preparing` - Готовится
- `ready` - Готов к выдаче
- `delivered` - Выдан/доставлен

**Особенности:**

- Связь с пользователем через `user_id`
- `total_price` дублируется для исторических данных
- Автоматическое обновление `updated_at`

**Индексы:**

- PRIMARY KEY на `id`
- INDEX на `user_id` для быстрого поиска заказов пользователя
- INDEX на `status` для фильтрации по статусу

### 5. 🛒 order_items - Элементы заказов

```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,              -- Автоинкремент ID
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id),
    quantity INTEGER NOT NULL DEFAULT 1, -- Количество товара
    price DECIMAL(10,2) NOT NULL,       -- Цена на момент заказа
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Особенности:**

- `CASCADE DELETE` - при удалении заказа удаляются все элементы
- `price` сохраняется на момент заказа (исторические данные)
- `quantity` - количество единиц товара в заказе

**Индексы:**

- PRIMARY KEY на `id`
- INDEX на `order_id` для быстрого получения состава заказа

### 6. 🛍️ cart_items - Корзина покупок

```sql
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,              -- Автоинкремент ID
    user_id BIGINT REFERENCES users(id), -- Связь с пользователем
    menu_item_id INTEGER REFERENCES menu_items(id), -- Товар в корзине
    quantity INTEGER NOT NULL DEFAULT 1, -- Количество
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, menu_item_id)       -- Один товар = одна запись
);
```

**Особенности:**

- `UNIQUE(user_id, menu_item_id)` - предотвращает дубликаты
- При добавлении существующего товара увеличивается `quantity`
- Автоматическое обновление `updated_at`

**Индексы:**

- PRIMARY KEY на `id`
- INDEX на `user_id` для быстрого получения корзины
- UNIQUE INDEX на `(user_id, menu_item_id)`

## 🔧 Триггеры и функции

### Автоматическое обновление updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

**Применяется к таблицам:**

- `users`
- `menu_items`
- `orders`
- `cart_items`

## 📈 Статистика и аналитика

### Текущие данные

**Категории:** 2 (шаурма, напитки)
**Товары:** 15 (12 шаурмы, 3 напитка)
**Пользователи:** Динамически (регистрируются при первом использовании)
**Заказы:** Накапливаются в процессе работы

### Ценовой диапазон

- **Минимальная цена:** 60₽ (Вода)
- **Максимальная цена:** 350₽ (Шаурма классик двойная)
- **Средняя цена шаурмы:** ~250₽
- **Средняя цена напитков:** ~93₽

## 🔍 Полезные запросы

### Статистика заказов

```sql
-- Общая статистика
SELECT
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
    SUM(total_price) as total_revenue
FROM orders;

-- Топ пользователей по заказам
SELECT
    u.first_name,
    COUNT(o.id) as orders_count,
    SUM(o.total_price) as total_spent
FROM users u
JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.first_name
ORDER BY orders_count DESC
LIMIT 10;
```

### Популярные товары

```sql
-- Самые заказываемые товары
SELECT
    mi.name,
    SUM(oi.quantity) as total_ordered,
    COUNT(DISTINCT oi.order_id) as orders_count
FROM menu_items mi
JOIN order_items oi ON mi.id = oi.menu_item_id
GROUP BY mi.id, mi.name
ORDER BY total_ordered DESC;
```

### Анализ корзин

```sql
-- Средний размер корзины
SELECT
    AVG(cart_size) as avg_cart_size,
    AVG(cart_value) as avg_cart_value
FROM (
    SELECT
        user_id,
        SUM(quantity) as cart_size,
        SUM(ci.quantity * mi.price) as cart_value
    FROM cart_items ci
    JOIN menu_items mi ON ci.menu_item_id = mi.id
    GROUP BY user_id
) cart_stats;
```

## 🚀 Оптимизация производительности

### Существующие индексы

```sql
-- Основные индексы
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
```

### Рекомендации для масштабирования

1. **Партиционирование orders** по дате для больших объемов
2. **Архивирование старых заказов** (> 1 года)
3. **Кэширование menu_items** в Redis
4. **Connection pooling** (уже реализован)

## 🔒 Безопасность

### Ограничения

- Все внешние ключи настроены корректно
- `CASCADE DELETE` только где необходимо
- `NOT NULL` для критических полей
- `UNIQUE` ограничения для предотвращения дубликатов

### Рекомендации

- Регулярные бэкапы БД
- Мониторинг размера таблиц
- Логирование изменений критических данных
- Валидация данных на уровне приложения

## 📊 Схема связей (ERD)

```
users (1) ──────── (N) orders (1) ──────── (N) order_items (N) ──────── (1) menu_items
  │                                                                            │
  │                                                                            │
  └─── (1) ──────── (N) cart_items (N) ──────────────────────────────────── (1) ┘
                                                                                 │
                                                                                 │
                                          categories (1) ──────────────────── (N) ┘
```

**Связи:**

- `users` → `orders` (1:N) - один пользователь может иметь много заказов
- `orders` → `order_items` (1:N) - один заказ содержит много товаров
- `users` → `cart_items` (1:N) - у пользователя может быть много товаров в корзине
- `menu_items` → `order_items` (1:N) - один товар может быть в разных заказах
- `menu_items` → `cart_items` (1:N) - один товар может быть в разных корзинах
- `categories` → `menu_items` (1:N) - одна категория содержит много товаров
