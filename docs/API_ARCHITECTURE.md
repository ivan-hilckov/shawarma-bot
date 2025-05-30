# 🚀 Архитектура REST API

**Версия:** 1.0.0  
**Дата:** 2025-05-28  
**Тип:** Production-ready Fastify REST API

---

## 📋 Обзор

REST API построен на современной архитектуре с использованием Fastify фреймворка, обеспечивающей высокую производительность, надежность и масштабируемость. API предоставляет полный функционал для управления корзиной, заказами, меню и аналитикой.

## 🏗️ Архитектурная диаграмма

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Client Requests│◄──►│   Fastify Core  │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Bot Client    │    │ • Routes        │    │ • CartApiService│
│ • Swagger UI    │    │ • Validation    │    │ • MenuService   │
│ • Direct Calls  │    │ • Middleware    │    │ • OrderService  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │   Plugins       │    │   Data Layer    │
                    │                 │    │                 │
                    │ • Database      │◄──►│ • PostgreSQL    │
                    │ • Rate Limit    │    │ • Redis Cache   │
                    │ • CORS          │    │ • Connection    │
                    │ • Swagger       │    │   Pooling       │
                    └─────────────────┘    └─────────────────┘
```

## 📁 Структура файлов

### Архитектура API

```
src/api/
├── server.ts           # 🚀 Главный файл сервера
├── plugins/            # 🔌 Fastify плагины
│   └── database.ts     # 🗄️ Плагин базы данных
├── routes/             # 🛣️ API маршруты
│   ├── cart.ts         # 🛒 Маршруты корзины
│   ├── health.ts       # 💚 Проверка здоровья
│   ├── menu.ts         # 📋 Маршруты меню
│   └── orders.ts       # 📦 Маршруты заказов
├── services/           # ⚙️ Бизнес логика
│   ├── cartApiService.ts   # 🛒 Сервис корзины
│   ├── menuService.ts      # 📋 Сервис меню
│   ├── orderService.ts     # 📦 Сервис заказов
│   └── userService.ts      # 👤 Сервис пользователей
└── schemas/            # 📝 Схемы валидации
    ├── cart.ts         # 🛒 Схемы корзины
    ├── menu.ts         # 📋 Схемы меню
    └── orders.ts       # 📦 Схемы заказов
```

### Стек технологий

```json
{
  "fastify": "^4.24.3", // Быстрый веб-фреймворк
  "zod": "^3.25.28", // Schema validation
  "@fastify/swagger": "^8.12.0", // OpenAPI документация
  "@fastify/cors": "^8.4.0", // CORS поддержка
  "@fastify/rate-limit": "^8.0.3", // Rate limiting
  "@fastify/redis": "^6.1.1", // Redis интеграция
  "pg": "^8.16.0", // PostgreSQL драйвер
  "redis": "^5.1.0" // Redis клиент
}
```

## 🚀 Server Core (server.ts)

### Инициализация сервера

```typescript
async function buildServer() {
  const fastify = Fastify({
    logger: config.NODE_ENV === 'development' ? true : { level: 'info' },
  });

  // Регистрация плагинов
  await fastify.register(swagger);
  await fastify.register(cors);
  await fastify.register(rateLimit);
  await fastify.register(databasePlugin);

  // Регистрация маршрутов
  await fastify.register(cartRoutes, { prefix: '/api' });
  await fastify.register(menuRoutes, { prefix: '/api' });
  await fastify.register(orderRoutes, { prefix: '/api' });
  await fastify.register(healthRoutes, { prefix: '/api' });
}
```

### Middleware Pipeline

#### 1. 📚 Swagger Documentation

```typescript
await fastify.register(require('@fastify/swagger'), {
  swagger: {
    info: {
      title: 'Shawarma Bot API',
      version: '1.0.0',
      description: 'REST API для доступа к данным шаурма-бота',
    },
    host:
      config.NODE_ENV === 'production' ? 'api.shawarma-bot.com' : `localhost:${config.API_PORT}`,
    schemes: [config.NODE_ENV === 'production' ? 'https' : 'http'],
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Menu', description: 'Menu management endpoints' },
      { name: 'Cart', description: 'Shopping cart management' },
      { name: 'Orders', description: 'Orders management' },
    ],
  },
});
```

#### 2. 🌐 CORS Configuration

```typescript
await fastify.register(require('@fastify/cors'), {
  origin: config.CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});
```

#### 3. 🚦 Rate Limiting

```typescript
await fastify.register(require('@fastify/rate-limit'), {
  max: config.RATE_LIMIT_PUBLIC,
  timeWindow: '1 minute',
  skipOnError: true,
  keyGenerator: request => {
    const isAdmin = request.headers.authorization?.startsWith('Bearer ');
    return `${request.ip}-${isAdmin ? 'admin' : 'public'}`;
  },
});
```

#### 4. 🗄️ Database Plugin

```typescript
await fastify.register(databasePlugin);
```

### Error Handling

#### Global Error Handler

```typescript
fastify.setErrorHandler(async (error, request, reply) => {
  request.log.error(error, 'Request error');

  const statusCode = error.statusCode || 500;
  const errorResponse = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message:
        config.NODE_ENV === 'production' && statusCode === 500
          ? 'Internal server error'
          : error.message,
      ...(config.NODE_ENV === 'development' && { stack: error.stack }),
    },
    timestamp: new Date().toISOString(),
  };

  reply.status(statusCode).send(errorResponse);
});
```

#### 404 Handler

```typescript
fastify.setNotFoundHandler(async (request, reply) => {
  reply.status(404).send({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`,
    },
    timestamp: new Date().toISOString(),
  });
});
```

## 🛣️ API Routes

### 🛒 Cart Routes (/api/cart)

#### GET `/cart/:userId` - Получение корзины

```typescript
// Response
{
  "success": true,
  "data": [
    {
      "menuItem": {
        "id": "1",
        "name": "Шаурма Классик",
        "price": 220,
        "category": "shawarma"
      },
      "quantity": 2
    }
  ],
  "meta": {
    "total": 440,
    "itemsCount": 2,
    "userId": 123456
  }
}
```

#### POST `/cart/add` - Добавление товара

```typescript
// Request
{
  "userId": 123456,
  "itemId": "1",
  "quantity": 1
}

// Response
{
  "success": true,
  "message": "Item added to cart successfully"
}
```

#### PUT `/cart/update` - Обновление количества

```typescript
// Request
{
  "userId": 123456,
  "itemId": "1",
  "quantity": 3
}
```

#### DELETE `/cart/remove/:userId/:itemId` - Удаление товара

#### DELETE `/cart/clear/:userId` - Очистка корзины

#### GET `/cart/:userId/total` - Получение суммы корзины

### 📋 Menu Routes (/api/menu)

#### GET `/menu/items` - Получение меню

```typescript
// Query params: ?category_id=1
// Response
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Шаурма Классик",
      "description": "Традиционная шаурма...",
      "price": 220,
      "category": "shawarma",
      "photo": "assets/xxl-2.jpeg",
      "isAvailable": true
    }
  ],
  "meta": {
    "total": 7,
    "category": "shawarma"
  }
}
```

#### GET `/menu/items/:itemId` - Получение товара по ID

#### GET `/menu/categories` - Получение категорий

### 📦 Orders Routes (/api/orders)

#### POST `/orders` - Создание заказа

```typescript
// Request
{
  "userId": 123456,
  "items": [
    {
      "menuItem": { "id": "1", "name": "Шаурма", "price": 220 },
      "quantity": 2
    }
  ],
  "totalPrice": 440
}

// Response
{
  "success": true,
  "data": {
    "orderId": "uuid-order-id",
    "status": "pending"
  }
}
```

#### GET `/orders/:orderId` - Получение заказа по ID

#### GET `/orders/user/:userId` - Заказы пользователя

#### PUT `/orders/:orderId/status` - Обновление статуса заказа

#### GET `/orders/stats` - Статистика заказов

### 💚 Health Routes (/api/health)

#### GET `/health` - Базовая проверка

```typescript
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-05-28T12:00:00.000Z",
  "uptime": 3600.123,
  "version": "1.0.0"
}
```

#### GET `/health/detailed` - Детальная проверка

```typescript
{
  "success": true,
  "status": "healthy",
  "services": {
    "database": { "status": "healthy", "responseTime": 15 },
    "redis": { "status": "healthy", "responseTime": 8 }
  },
  "system": {
    "memory": { "used": "45.2MB", "free": "2.1GB" },
    "cpu": { "usage": "12.5%" }
  }
}
```

## ⚙️ Services Layer

### 🛒 Cart API Service

```typescript
export class CartApiService {
  private cartService = cartService;
  private menuService = new MenuService();

  async getCart(userId: number): Promise<{
    items: CartItem[];
    total: number;
    itemsCount: number;
  }> {
    const items = await this.cartService.getCart(userId);
    const total = await this.cartService.getCartTotal(userId);
    const itemsCount = await this.cartService.getCartItemsCount(userId);

    return { items, total, itemsCount };
  }

  async addToCart(data: CartAddRequest): Promise<void> {
    const menuItem = await this.menuService.getItemById(data.itemId);
    if (!menuItem) {
      throw new Error(`Menu item with id ${data.itemId} not found`);
    }

    await this.cartService.addToCart(data.userId, menuItem, data.quantity || 1);
  }
}
```

### 📋 Menu Service

```typescript
export class MenuService {
  async getItems(categoryId?: number): Promise<MenuItem[]> {
    // Получение из базы данных или статических данных
    return getMenuByCategory(categoryId);
  }

  async getItemById(itemId: string): Promise<MenuItem | null> {
    return getItemById(itemId) || null;
  }

  async getCategories(): Promise<Category[]> {
    return getAllCategories();
  }
}
```

### 📦 Order Service

```typescript
export class OrderService {
  private databaseService = databaseService;

  async createOrder(data: CreateOrderRequest): Promise<string> {
    return await this.databaseService.createOrder(data.userId, data.items, data.totalPrice);
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    return await this.databaseService.getOrderById(orderId);
  }

  async getUserOrders(userId: number, limit?: number): Promise<Order[]> {
    return await this.databaseService.getUserOrders(userId, limit);
  }
}
```

## 📝 Schema Validation

### Zod Schemas

#### Cart Schemas

```typescript
export const CartAddSchema = z.object({
  userId: z.number().int().positive(),
  itemId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).default(1),
});

export const CartUpdateSchema = z.object({
  userId: z.number().int().positive(),
  itemId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const CartParamsSchema = z.object({
  userId: z.string().transform(val => parseInt(val, 10)),
});
```

#### Response Schemas

```typescript
export const CartResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          menuItem: { $ref: '#/definitions/MenuItem' },
          quantity: { type: 'number' },
        },
      },
    },
    meta: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        itemsCount: { type: 'number' },
        userId: { type: 'number' },
      },
    },
  },
};
```

## 🔌 Plugins Architecture

### Database Plugin

```typescript
import fp from 'fastify-plugin';
import { databaseService } from '../../database';

async function databasePlugin(fastify: FastifyInstance) {
  // Проверяем подключение к базе при старте
  const isConnected = await databaseService.testConnection();
  if (!isConnected) {
    throw new Error('Failed to connect to database');
  }

  // Добавляем в декораторы
  fastify.decorate('db', databaseService);

  // Graceful shutdown
  fastify.addHook('onClose', async () => {
    await databaseService.disconnect();
  });
}

export default fp(databasePlugin);
```

## 🛡️ Security & Performance

### Security Features

#### API Key Authentication (для админских функций)

```typescript
const securityDefinitions = {
  apiKey: {
    type: 'apiKey',
    name: 'Authorization',
    in: 'header',
    description: 'API key для доступа к админским функциям',
  },
};
```

#### Input Validation

- **Zod schemas** для валидации всех входных данных
- **Type-safe** обработка параметров и тела запросов
- **Automatic sanitization** входных данных

#### Rate Limiting

- **Публичные API:** 100 req/min
- **Админские API:** 1000 req/min
- **IP-based** ограничения
- **Graceful degradation** при превышении лимитов

### Performance Optimizations

#### Connection Pooling

```typescript
// PostgreSQL Pool
max: 20,                    // Максимум соединений
min: 2,                     // Минимум соединений
idleTimeoutMillis: 30000,   // Таймаут неактивных
connectionTimeoutMillis: 2000 // Таймаут подключения
```

#### Caching Strategy

- **Redis caching** для корзин пользователей
- **Memory caching** для статических данных меню
- **TTL policies** для автоматической очистки

#### Request Optimization

- **Async/await** everywhere
- **Bulk operations** для снижения количества запросов к БД
- **Connection reuse** для внешних API

## 📊 Monitoring & Observability

### Structured Logging

```typescript
fastify.addHook('onRequest', async (request, _reply) => {
  request.log.info(
    {
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    },
    'Incoming request'
  );
});
```

### Health Checks

#### Basic Health Check

- **API availability**
- **Uptime tracking**
- **Version information**

#### Detailed Health Check

- **Database connectivity** с timing
- **Redis connectivity** с timing
- **System resources** (memory, CPU)
- **External dependencies** status

### Metrics

- **Response times** per endpoint
- **Error rates** по типам ошибок
- **Throughput** requests/second
- **Database performance** query times

## 🚀 Deployment & Scaling

### Production Configuration

```bash
# Environment Variables
NODE_ENV=production
API_PORT=3000
API_HOST=0.0.0.0

# Security
API_KEYS=prod-key-1,prod-key-2
CORS_ORIGINS=https://botgarden.store,https://admin.botgarden.store

# Performance
RATE_LIMIT_PUBLIC=100
RATE_LIMIT_ADMIN=1000
REDIS_CACHE_TTL=300
ENABLE_CACHE=true
```

### Docker Support

```dockerfile
# API Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/api/server.js"]
```

### Horizontal Scaling

- **Stateless design** для горизонтального масштабирования
- **Redis sessions** для multi-instance deployment
- **Load balancer ready** с health checks
- **Database connection pooling** для handling concurrent requests

---

**API готов к продакшену с поддержкой высоких нагрузок, полной документацией и современными практиками безопасности.**
