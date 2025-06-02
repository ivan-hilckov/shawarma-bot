-- Инициализация базы данных для Шаурма Бота

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы категорий меню
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    emoji VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы товаров
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы заказов
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы элементов заказа
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы корзины
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    menu_item_id INTEGER REFERENCES menu_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, menu_item_id)
);



-- Создание таблицы для аналитики пользователей
CREATE TABLE IF NOT EXISTS user_analytics (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    menu_item_id INTEGER REFERENCES menu_items(id),
    order_count INTEGER DEFAULT 1,
    last_ordered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, menu_item_id)
);

-- Создание view для часто заказываемых товаров
CREATE OR REPLACE VIEW user_popular_items AS
SELECT
    ua.user_id,
    ua.menu_item_id,
    mi.name,
    mi.price,
    mi.category_id,
    ua.order_count,
    ua.total_spent,
    ua.last_ordered,
    CASE
        WHEN ua.order_count >= 3 THEN 'frequent'
        WHEN ua.order_count = 2 THEN 'regular'
        ELSE 'occasional'
    END as frequency_level
FROM user_analytics ua
JOIN menu_items mi ON ua.menu_item_id = mi.id
WHERE mi.is_available = true
ORDER BY ua.user_id, ua.order_count DESC, ua.last_ordered DESC;

-- Вставка начальных данных
INSERT INTO categories (name, description, emoji) VALUES
    ('shawarma', 'Вкусная шаурма', '🌯'),
    ('drinks', 'Освежающие напитки', '🥤')
ON CONFLICT (name) DO NOTHING;

INSERT INTO menu_items (name, description, price, category_id) VALUES
    ('Шаурма Вегетарианская большая', 'Большая порция вегетарианской шаурмы', 270.00, 1),
    ('Шаурма Вегетарианская стандарт', 'Стандартная порция вегетарианской шаурмы', 220.00, 1),
    ('Шаурма классик двойная', 'Двойная порция классической шаурмы', 350.00, 1),
    ('Шаурма классик большая', 'Большая порция классической шаурмы', 270.00, 1),
    ('Шаурма классик маленькая', 'Маленькая порция классической шаурмы', 220.00, 1),
    ('Шаурма в сырном лаваше стандарт', 'Шаурма в ароматном сырном лаваше', 230.00, 1),
    ('Шаурма в сырном лаваше большая', 'Большая шаурма в сырном лаваше', 280.00, 1),
    ('Цезарь-Ролл большой', 'Большой ролл с курицей Цезарь', 300.00, 1),
    ('Цезарь-Ролл стандарт', 'Стандартный ролл с курицей Цезарь', 250.00, 1),
    ('Хот-Дог с сосиской', 'В лаваше или в булочке', 190.00, 1),
    ('Хот-Дог с курицей', 'Хот-дог с нежной курицей', 220.00, 1),
    ('Гирос', 'Традиционный греческий гирос', 275.00, 1),
    ('Кола', '330 мл', 100.00, 2),
    ('Сок апельсиновый', '250 мл', 120.00, 2),
    ('Вода', '500 мл', 60.00, 2)
ON CONFLICT DO NOTHING;

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);

-- Индексы для новых таблиц
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_menu_item_id ON user_analytics(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_order_count ON user_analytics(order_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_last_ordered ON user_analytics(last_ordered DESC);

-- Создание функции для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггеров для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_analytics_updated_at BEFORE UPDATE ON user_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Создание функции для автоматического обновления аналитики при оформлении заказов
CREATE OR REPLACE FUNCTION update_user_analytics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_analytics (user_id, menu_item_id, order_count, last_ordered, total_spent)
    SELECT
        NEW.user_id,
        oi.menu_item_id,
        1,
        NEW.created_at,
        oi.price * oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
    ON CONFLICT (user_id, menu_item_id)
    DO UPDATE SET
        order_count = user_analytics.order_count + 1,
        last_ordered = NEW.created_at,
        total_spent = user_analytics.total_spent + EXCLUDED.total_spent,
        updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггера для обновления аналитики при создании заказа
CREATE TRIGGER update_analytics_on_order_creation
    AFTER INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION update_user_analytics();
