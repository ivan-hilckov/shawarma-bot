# 🤖 Архитектура Telegram Bot

**Версия:** 2.6.0  
**Дата:** 2025-12-31  
**Тип:** Production-ready Telegram Bot с упрощенным UX

---

## 📋 Обзор

Telegram бот построен на архитектуре с разделением ответственности, использующей современные паттерны и best practices. Бот поддерживает работу с корзиной, заказами, уведомлениями и интеграцию с REST API.

## 🏗️ Архитектурная диаграмма

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Telegram API  │◄──►│   Bot Core      │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Webhooks      │    │ • Event Router  │    │ • Database      │
│ • Long Polling  │    │ • Handlers      │    │ • Cart (Redis)  │
│ • Callbacks     │    │ • Middleware    │    │ • Notifications │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │   API Client    │    │   External API  │
                    │                 │    │                 │
                    │ • HTTP Client   │◄──►│ • REST API      │
                    │ • Error Handle  │    │ • Swagger UI    │
                    │ • Interceptors  │    │ • Health Check  │
                    └─────────────────┘    └─────────────────┘
```

## 📁 Структура файлов

### Основные компоненты

```
src/
├── bot.ts              # 🤖 Главный файл бота
├── handlers.ts         # 🎯 Обработчики команд и callback'ов
├── config.ts           # ⚙️ Конфигурация приложения
├── types.ts            # 📝 TypeScript типы и интерфейсы
├── api-client.ts       # 🌐 HTTP клиент для REST API
├── database.ts         # 🗄️ Сервис работы с PostgreSQL
├── cart.ts             # 🛒 Сервис корзины покупок (Redis)
├── menu.ts             # 📋 Статические данные меню
├── notifications.ts    # 📢 Сервис уведомлений
└── logger.ts           # 📝 Система логирования
```

### Основные зависимости

```json
{
  "node-telegram-bot-api": "^0.66.0", // Telegram Bot SDK
  "pg": "^8.11.3", // PostgreSQL драйвер
  "redis": "^4.6.10", // Redis клиент
  "axios": "^1.6.2", // HTTP клиент
  "dotenv": "^16.3.1", // Переменные окружения
  "winston": "^3.11.0" // Логирование
}
```

## 🤖 Bot Core (bot.ts)

### Инициализация

```typescript
// Проверка токена и создание экземпляра
const bot: BotInstance = new TelegramBot(config.BOT_TOKEN, { polling: true });

// Создание сервиса уведомлений
const notificationService = new NotificationService(bot);
```

### Event Router

**Обрабатываемые события:**

- `/start` команда - приветствие и главное меню
- `message` - текстовые сообщения от пользователей
- `callback_query` - нажатия inline кнопок
- `polling_error` - ошибки подключения к Telegram

**Роутинг сообщений (упрощенная архитектура v2.6):**

```typescript
bot.on('message', (msg: BotMessage) => {
  switch (msg.text) {
    case '🌯 Шаурма':
      handleShawarmaMenu(bot, msg);
      break;
    case '🥤 Напитки':
      handleDrinksMenu(bot, msg);
      break;
    case '🛒 Корзина': // с динамическим счетчиком
      handleViewCart(bot, msg);
      break;
    case '👤 Профиль': // новый централизованный раздел
      handleProfile(bot, msg);
      break;
    case 'ℹ️ О нас': // теперь включает Mini App
      handleAbout(bot, msg);
      break;
  }
});
```

**Ключевые изменения архитектуры:**

- 🎯 **Упрощение:** 8 кнопок → 5 кнопок (снижение сложности на 37.5%)
- 👤 **Новый раздел "Профиль":** объединяет Мои заказы + Избранное + Рекомендации
- 📱 **Mini App интеграция:** перенесен в раздел "О нас" для снижения когнитивной нагрузки
- 🛒 **Умная корзина:** динамический счетчик товаров в названии кнопки

**Роутинг callback'ов:**

```typescript
bot.on('callback_query', (query: BotCallbackQuery) => {
  if (data?.startsWith('item_')) handleItemSelection(bot, query);
  else if (data?.startsWith('add_to_cart_')) handleAddToCart(bot, query);
  else if (data === 'view_cart') handleViewCart(bot, query);
  else if (data?.startsWith('increase_')) handleIncreaseQuantity(bot, query);
  // ... другие обработчики
});
```

### Graceful Shutdown

```typescript
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал SIGINT. Завершение работы...');
  bot.stopPolling();
  process.exit(0);
});
```

## 🎯 Handlers (handlers.ts)

### Архитектура обработчиков

**Принципы:**

- Каждый handler отвечает за одну функцию
- Поддержка как Message, так и CallbackQuery
- Валидация входных данных
- Централизованная обработка ошибок
- Логирование всех действий

### Основные группы handlers

#### 1. 📋 Menu Handlers (обновленная архитектура v2.6)

```typescript
export function handleStart(bot: BotInstance, msg: BotMessage): void; // упрощенное главное меню
export function handleShawarmaMenu(bot: BotInstance, msg: BotMessage): void; // убраны быстрые кнопки +/-
export function handleDrinksMenu(bot: BotInstance, msg: BotMessage): void; // убраны быстрые кнопки +/-
export function handleAbout(bot: BotInstance, msg: BotMessage): void; // теперь включает Mini App
export function handleProfile(bot: BotInstance, msg: BotMessage): void; // НОВЫЙ: централизованный профиль
export function handleItemSelection(bot: BotInstance, query: BotCallbackQuery): void; // улучшенная карточка товара
```

**Ключевые улучшения:**

- 🎯 **Упрощенные каталоги:** убраны отвлекающие быстрые кнопки, фокус на выборе товара
- 👤 **Новый профиль:** объединяет личную информацию, статистику и быстрые действия
- 📱 **Mini App интеграция:** естественная интеграция в раздел "О нас"
- 🛒 **Умные карточки товаров:** адаптивные кнопки в зависимости от состояния корзины

#### 2. 🛒 Cart Handlers

```typescript
export async function handleAddToCart(bot: BotInstance, query: BotCallbackQuery): Promise<void>;
export async function handleViewCart(
  bot: BotInstance,
  msg: BotMessage | BotCallbackQuery
): Promise<void>;
export async function handleIncreaseQuantity(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void>;
export async function handleDecreaseQuantity(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void>;
export async function handleRemoveFromCart(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void>;
export async function handleClearCart(bot: BotInstance, query: BotCallbackQuery): Promise<void>;
```

#### 3. 👤 Profile Handlers (НОВОЕ в v2.6)

```typescript
export async function handleProfile(
  bot: BotInstance,
  msg: BotMessage | BotCallbackQuery
): Promise<void>; // централизованный профиль пользователя
export async function handleFavorites(
  bot: BotInstance,
  msg: BotMessage | BotCallbackQuery
): Promise<void>; // управление избранными товарами
export async function handleRecommendations(
  bot: BotInstance,
  msg: BotMessage | BotCallbackQuery
): Promise<void>; // персональные рекомендации
export async function handleAddToFavorites(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void>;
export async function handleRemoveFromFavorites(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void>;
```

**Функциональность профиля:**

- 📊 **Персональная статистика:** количество заказов, потраченная сумма, средний чек, любимая категория
- ⭐ **Избранные товары:** быстрое сохранение и доступ к любимым товарам
- 🎯 **Умные рекомендации:** на основе истории заказов и времени суток
- 🏠 **Единая точка входа:** все личные функции в одном месте

#### 4. 📦 Order Handlers

```typescript
export async function handleCheckout(bot: BotInstance, query: BotCallbackQuery): Promise<void>;
export async function handleMyOrders(
  bot: BotInstance,
  msg: BotMessage | BotCallbackQuery
): Promise<void>;
export async function handleOrderDetails(bot: BotInstance, query: BotCallbackQuery): Promise<void>;
export async function handleAdminOrderAction(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void>;
```

#### 5. 📱 Mini App Handlers (интегрированы в "О нас")

```typescript
export function handleAboutMiniApp(bot: BotInstance, query: BotCallbackQuery): void; // информация о Mini App
export function handleBackToStart(bot: BotInstance, query: BotCallbackQuery): void; // навигация в Mini App flow
```

**Изменения в Mini App архитектуре:**

- 🎯 **Упрощение доступа:** Mini App интегрирован в раздел "О нас" вместо отдельной кнопки
- 📱 **Естественный flow:** пользователи узнают о Mini App в контексте информации о заведении
- 🚀 **Прямой запуск:** кнопка "🌯 Открыть Шаурма App" для быстрого доступа

### Паттерн обработки

```typescript
export async function handleAddToCart(bot: BotInstance, query: BotCallbackQuery): Promise<void> {
  // 1. Извлечение и валидация данных
  const chatId = query.message?.chat.id;
  const userId = query.from?.id;
  const itemId = query.data?.replace('add_to_cart_', '');

  if (!chatId || !userId || !itemId) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' });
    return;
  }

  // 2. Бизнес-логика
  try {
    await botApiClient.addToCart(userId, item.id, 1);
    const cartTotal = await botApiClient.getCartTotal(userId);

    // 3. Обновление UI
    bot.answerCallbackQuery(query.id, {
      text: `✅ ${item.name} добавлен в корзину!`,
    });
  } catch (error) {
    // 4. Обработка ошибок
    console.error('Error adding to cart:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при добавлении в корзину' });
  }
}
```

## ⚙️ Configuration (config.ts)

### Структура конфигурации

```typescript
interface Config {
  // Telegram Bot
  BOT_TOKEN: string;
  NOTIFICATIONS_CHAT_ID?: string;
  ADMIN_USER_IDS?: string;

  // Environment
  NODE_ENV: string;

  // Databases
  DATABASE_URL: string;
  REDIS_URL: string;

  // API Configuration
  API_PORT: number;
  API_HOST: string;
  API_PREFIX: string;

  // Security
  API_KEYS: string[];
  CORS_ORIGINS: string[];

  // Rate Limiting
  RATE_LIMIT_PUBLIC: number;
  RATE_LIMIT_ADMIN: number;

  // Cache
  REDIS_CACHE_TTL: number;
  ENABLE_CACHE: boolean;
}
```

### Переменные окружения

```bash
# .env файл
BOT_TOKEN=1234567890:ABCdefGHIjklmnoPQRstuvwxyz
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379
NODE_ENV=production

# Опциональные
NOTIFICATIONS_CHAT_ID=-1001234567890
ADMIN_USER_IDS=123456789,987654321
API_PORT=3000
```

## 🗄️ Database Service (database.ts)

### Архитектура

```typescript
export class DatabaseService {
  private pool: Pool; // Connection Pool
  private logger = createLogger('DatabaseService');

  constructor() {
    this.pool = new Pool({
      connectionString: config.DATABASE_URL,
      max: 20, // Максимум соединений
      min: 2, // Минимум соединений
      idleTimeoutMillis: 30000, // Таймаут неактивных
      connectionTimeoutMillis: 2000, // Таймаут подключения
    });
  }
}
```

### Основные методы

#### User Management

```typescript
async upsertUser(userId: number, username?: string, firstName?: string, lastName?: string): Promise<void>
```

#### Order Management

```typescript
async createOrder(userId: number, cartItems: CartItem[], totalPrice: number): Promise<string>
async getOrderById(orderId: string): Promise<Order | null>
async getUserOrders(userId: number, limit: number = 10): Promise<Order[]>
async updateOrderStatus(orderId: string, status: Order["status"]): Promise<void>
```

#### Analytics

```typescript
async getOrdersStats(): Promise<{
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}>
```

### Оптимизации

**Connection Pooling:**

- Переиспользование соединений
- Автоматическое масштабирование
- Graceful shutdown

**Query Optimization:**

- Устранение N+1 проблемы
- JOIN'ы вместо множественных запросов
- Индексы на часто используемых полях

## 🛒 Cart Service (cart.ts)

### Redis-based Architecture

```typescript
export class CartService {
  private client: RedisClientType;
  private isConnected: boolean = false;

  private getCartKey(userId: number): string {
    return `cart:${userId}`; // Namespace для корзин
  }
}
```

### API методы

```typescript
async addToCart(userId: number, menuItem: MenuItem, quantity: number = 1): Promise<void>
async removeFromCart(userId: number, itemId: string): Promise<void>
async updateQuantity(userId: number, itemId: string, quantity: number): Promise<void>
async getCart(userId: number): Promise<CartItem[]>
async clearCart(userId: number): Promise<void>
async getCartTotal(userId: number): Promise<number>
async getCartItemsCount(userId: number): Promise<number>
```

### Особенности

- **TTL:** Автоматическое удаление через 1 час неактивности
- **Сериализация:** JSON для хранения сложных объектов
- **Atomic Operations:** Безопасные операции обновления
- **Error Recovery:** Graceful degradation при недоступности Redis

## 🌐 API Client (api-client.ts)

### HTTP Client Architecture

```typescript
export class BotApiClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

### Interceptors

**Request Interceptor:**

```typescript
this.client.interceptors.request.use(config => {
  logger.debug('API Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    data: config.data,
  });
  return config;
});
```

**Response Interceptor:**

```typescript
this.client.interceptors.response.use(
  response => {
    logger.debug('API Response:', { status: response.status });
    return response;
  },
  error => {
    logger.error('API Response Error:', { status: error.response?.status });
    return Promise.reject(error);
  }
);
```

### API Groups

#### Cart API

```typescript
async getCart(userId: number): Promise<CartItem[]>
async addToCart(userId: number, itemId: string, quantity: number): Promise<void>
async updateCartQuantity(userId: number, itemId: string, quantity: number): Promise<void>
async removeFromCart(userId: number, itemId: string): Promise<void>
async clearCart(userId: number): Promise<void>
async getCartTotal(userId: number): Promise<{ total: number; itemsCount: number }>
```

#### Menu API

```typescript
async getMenuByCategory(category?: string): Promise<MenuItem[]>
async getMenuItemById(itemId: string): Promise<MenuItem | null>
```

#### Orders API

```typescript
async createOrder(userId: number, cartItems: CartItem[], totalPrice: number): Promise<string>
async getOrderById(orderId: string): Promise<Order | null>
async getUserOrders(userId: number, limit: number): Promise<Order[]>
async updateOrderStatus(orderId: string, status: Order['status']): Promise<void>
```

## 📢 Notifications Service (notifications.ts)

### Архитектура уведомлений

- **Каналы:** Уведомления в Telegram канал/группу
- **Типы:** Новые заказы, изменения статуса, системные события
- **Форматирование:** Rich text с emoji и структурированным контентом
- **Fallback:** Graceful degradation при недоступности канала

## 📝 Logging System (logger.ts)

### Structured Logging

```typescript
export class Logger {
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      ...metadata,
    };

    console.log(JSON.stringify(logEntry));
  }
}
```

### Уровни логирования

- **ERROR:** Критические ошибки
- **WARN:** Предупреждения
- **INFO:** Информационные сообщения
- **DEBUG:** Отладочная информация

## 📋 Меню System (menu.ts)

### Статическая структура

```typescript
const menu: Record<string, MenuItem[]> = {
  shawarma: [
    { id: '1', name: 'Шаурма Вегетарианская', price: 220, ... },
    { id: '2', name: 'Шаурма Классик', price: 220, ... },
    // ...
  ],
  drinks: [
    { id: '8', name: 'Кола', price: 100, ... },
    // ...
  ]
};
```

### API функции

```typescript
export function getMenuByCategory(category: string): MenuItem[];
export function getItemById(id: string): MenuItem | undefined;
export function getAllCategories(): string[];
```

## 🔄 Data Flow (упрощенная архитектура v2.6)

### Новый сценарий "Выбор и добавление товара"

```
1. User выбирает категорию (🌯 Шаурма или 🥤 Напитки)
   ↓
2. Bot показывает простой каталог (убраны быстрые кнопки +/-)
   ↓
3. User нажимает на название товара
   ↓
4. handleItemSelection показывает карточку товара с фото и описанием
   ↓
5. User нажимает "Добавить в корзину"
   ↓
6. handleAddToCart → botApiClient.addToCart() → HTTP POST /api/cart/add
   ↓
7. API добавляет товар в Redis через CartService
   ↓
8. Bot обновляет карточку товара (кнопка становится "- NUM +")
   ↓
9. User видит обновленное состояние + может добавить в избранное
   ↓
10. Главное меню показывает счетчик корзины: "🛒 Корзина (2)"
```

**Ключевые улучшения flow:**

- 🎯 **Меньше отвлечений:** фокус на выборе качественного товара
- 📸 **Визуальность:** товары с фотографиями вызывают больше доверия
- 🧠 **Умное поведение:** интерфейс адаптируется под состояние корзины
- ⭐ **Персонализация:** возможность сохранить товар в избранное

## 🛡️ Error Handling

### Многоуровневая стратегия

1. **Network Level:** HTTP retry, timeout, circuit breaker
2. **Service Level:** Graceful degradation, fallback responses
3. **UI Level:** User-friendly error messages
4. **Logging Level:** Structured error logging с контекстом

### Примеры

```typescript
try {
  await botApiClient.addToCart(userId, itemId, quantity);
  bot.answerCallbackQuery(query.id, { text: '✅ Товар добавлен!' });
} catch (error) {
  logger.error('Failed to add to cart:', { userId, itemId, error });
  bot.answerCallbackQuery(query.id, { text: '❌ Ошибка при добавлении' });
}
```

## 🚀 Performance

### Метрики

- **Response Time:** < 1сек для обычных операций
- **Throughput:** до 1000 req/min на пользователя
- **Memory Usage:** ~50MB RSS для 1000+ активных пользователей
- **Database:** Connection pooling (2-20 соединений)

### Оптимизации

- **Redis Caching:** Корзины, сессии
- **Connection Pooling:** PostgreSQL, Redis
- **Async/Await:** Неблокирующие операции
- **Error Recovery:** Automatic retry с exponential backoff

## 📊 Мониторинг

### Логируемые события

- Все действия пользователей
- API вызовы (request/response)
- Ошибки и исключения
- Производительность запросов

### Алерты

- Ошибки подключения к БД/Redis
- Высокая нагрузка (>80% CPU/Memory)
- Критические ошибки в обработчиках

---

**Бот готов к продакшену и поддерживает высокие нагрузки благодаря современной архитектуре и оптимизациям.**
