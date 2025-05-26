# 🚀 План реализации REST API

## 📋 Обзор

REST API для доступа к данным шаурма-бота. Первая версия будет **только для чтения** (GET запросы) для админки и лендинга.

### 🎯 Цели API v1.0

- ✅ **Админка** - просмотр заказов, статистики, управление меню
- ✅ **Лендинг** - отображение меню, цен, доступности
- ✅ **Аналитика** - статистика продаж, популярные товары
- ✅ **Мониторинг** - health checks, метрики

## 🏗️ Архитектура API

### Технологический стек

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   REST API      │    │   Database      │
│                 │    │                 │    │                 │
│ • Админка       │◄───┤ • Express.js    │◄───┤ • PostgreSQL    │
│ • Лендинг       │    │ • TypeScript    │    │ • Redis (cache) │
│ • Дашборд       │    │ • Swagger UI    │    │ • Connection    │
│                 │    │ • Rate Limiting │    │   Pooling       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Структура проекта

```
src/
├── api/                    # API модули
│   ├── server.ts          # Express сервер
│   ├── routes/            # Маршруты API
│   │   ├── menu.ts        # /api/menu
│   │   ├── orders.ts      # /api/orders
│   │   ├── users.ts       # /api/users
│   │   ├── analytics.ts   # /api/analytics
│   │   └── health.ts      # /api/health
│   ├── middleware/        # Middleware
│   │   ├── auth.ts        # Аутентификация
│   │   ├── cors.ts        # CORS настройки
│   │   ├── rateLimit.ts   # Rate limiting
│   │   └── validation.ts  # Валидация запросов
│   ├── controllers/       # Контроллеры
│   ├── services/          # Бизнес-логика
│   └── swagger/           # Swagger документация
└── shared/                # Общие модули
    ├── database.ts        # Уже существует
    ├── types.ts           # Уже существует
    └── logger.ts          # Уже существует
```

## 📡 API Endpoints

### 🍽️ Menu API - `/api/menu`

#### GET /api/menu/categories

Получение всех категорий меню

```typescript
interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  emoji: string;
  items_count: number;
  created_at: string;
}

// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "shawarma",
      "description": "Вкусная шаурма",
      "emoji": "🌯",
      "items_count": 12,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 2,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

#### GET /api/menu/items

Получение всех товаров с фильтрацией

**Query параметры:**

- `category_id` - фильтр по категории
- `available` - только доступные товары (true/false)
- `min_price` - минимальная цена
- `max_price` - максимальная цена
- `limit` - количество записей (по умолчанию 50)
- `offset` - смещение для пагинации

```typescript
interface MenuItemResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  category: {
    id: number;
    name: string;
    emoji: string;
  };
  image_url?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Шаурма Вегетарианская большая",
      "description": "Большая порция вегетарианской шаурмы",
      "price": 270.00,
      "category": {
        "id": 1,
        "name": "shawarma",
        "emoji": "🌯"
      },
      "image_url": "/assets/shawarma-veg-big.jpg",
      "is_available": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 15,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

#### GET /api/menu/items/:id

Получение конкретного товара

```typescript
// Response
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Шаурма Вегетарианская большая",
    "description": "Большая порция вегетарианской шаурмы",
    "price": 270.00,
    "category": {
      "id": 1,
      "name": "shawarma",
      "emoji": "🌯"
    },
    "image_url": "/assets/shawarma-veg-big.jpg",
    "is_available": true,
    "stats": {
      "total_ordered": 45,
      "orders_count": 23,
      "avg_rating": 4.8
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 📦 Orders API - `/api/orders`

#### GET /api/orders

Получение заказов с фильтрацией (только для админов)

**Query параметры:**

- `status` - фильтр по статусу
- `user_id` - заказы конкретного пользователя
- `date_from` - с какой даты
- `date_to` - по какую дату
- `limit` - количество записей
- `offset` - смещение

```typescript
interface OrderResponse {
  id: number;
  user: {
    id: number;
    first_name: string;
    username?: string;
  };
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
  total_price: number;
  items_count: number;
  created_at: string;
  updated_at: string;
}

// Response
{
  "success": true,
  "data": [
    {
      "id": 42,
      "user": {
        "id": 123456789,
        "first_name": "Иван",
        "username": "ivan_user"
      },
      "status": "pending",
      "total_price": 520.00,
      "items_count": 3,
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "total": 156,
    "limit": 20,
    "offset": 0,
    "filters": {
      "status": "pending"
    }
  }
}
```

#### GET /api/orders/:id

Получение детальной информации о заказе

```typescript
interface OrderDetailResponse {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  status: string;
  total_price: number;
  items: Array<{
    id: number;
    menu_item: {
      id: number;
      name: string;
      price: number;
    };
    quantity: number;
    price: number; // цена на момент заказа
    subtotal: number;
  }>;
  created_at: string;
  updated_at: string;
}
```

#### GET /api/orders/stats

Статистика заказов

```typescript
interface OrderStatsResponse {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  preparing_orders: number;
  ready_orders: number;
  delivered_orders: number;
  total_revenue: number;
  avg_order_value: number;
  orders_today: number;
  revenue_today: number;
  popular_items: Array<{
    item_id: number;
    name: string;
    total_ordered: number;
    revenue: number;
  }>;
}
```

### 👥 Users API - `/api/users`

#### GET /api/users

Получение пользователей (только для админов)

```typescript
interface UserResponse {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  orders_count: number;
  total_spent: number;
  last_order_date?: string;
  created_at: string;
}
```

#### GET /api/users/:id

Профиль пользователя

#### GET /api/users/stats

Статистика пользователей

### 📊 Analytics API - `/api/analytics`

#### GET /api/analytics/dashboard

Данные для дашборда

```typescript
interface DashboardResponse {
  overview: {
    total_orders: number;
    total_revenue: number;
    total_users: number;
    avg_order_value: number;
  };
  today: {
    orders: number;
    revenue: number;
    new_users: number;
  };
  trends: {
    orders_by_hour: Array<{ hour: number; count: number }>;
    revenue_by_day: Array<{ date: string; revenue: number }>;
  };
  popular_items: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
  status_distribution: {
    pending: number;
    confirmed: number;
    preparing: number;
    ready: number;
    delivered: number;
  };
}
```

#### GET /api/analytics/sales

Аналитика продаж

#### GET /api/analytics/items

Аналитика товаров

### 🏥 Health API - `/api/health`

#### GET /api/health

Health check для мониторинга

```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: {
      status: 'up' | 'down';
      response_time: number;
    };
    redis: {
      status: 'up' | 'down';
      response_time: number;
    };
    telegram_bot: {
      status: 'up' | 'down';
      last_update: string;
    };
  };
  metrics: {
    memory_usage: number;
    cpu_usage: number;
    active_connections: number;
  };
}
```

## 🔒 Безопасность и аутентификация

### Уровни доступа

1. **Публичный** - меню, цены (без аутентификации)
2. **Админский** - заказы, пользователи, статистика (API ключ)
3. **Внутренний** - health checks (IP whitelist)

### Аутентификация

```typescript
// Middleware для проверки API ключа
interface AuthMiddleware {
  validateApiKey(req: Request): boolean;
  checkPermissions(req: Request, resource: string): boolean;
}

// Заголовки запроса
{
  "Authorization": "Bearer your-api-key",
  "Content-Type": "application/json"
}
```

### Rate Limiting

- **Публичные endpoints**: 100 запросов/минуту
- **Админские endpoints**: 1000 запросов/минуту
- **Health checks**: без ограничений

## 📝 Swagger документация

### Структура документации

```yaml
openapi: 3.0.0
info:
  title: Shawarma Bot API
  version: 1.0.0
  description: REST API для доступа к данным шаурма-бота
  contact:
    name: API Support
    email: support@shawarma-bot.com

servers:
  - url: http://localhost:3000/api
    description: Development server
  - url: https://api.shawarma-bot.com/api
    description: Production server

paths:
  /menu/categories:
    get:
      summary: Получить категории меню
      tags: [Menu]
      responses:
        200:
          description: Список категорий
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CategoriesResponse'
```

### Автогенерация документации

- **Swagger UI** на `/api/docs`
- **OpenAPI JSON** на `/api/docs.json`
- **Postman коллекция** для тестирования

## 🚀 План реализации

### Фаза 1: Базовая инфраструктура (1-2 дня)

1. **Настройка Express сервера**

   - Базовая структура проекта
   - Middleware (CORS, rate limiting, логирование)
   - Подключение к существующей БД

2. **Health API**

   - Проверка состояния сервисов
   - Базовые метрики

3. **Swagger документация**
   - Настройка Swagger UI
   - Базовые схемы данных

### Фаза 2: Menu API ✅ (завершено)

1. **Категории меню** ✅

   - GET /api/menu/categories ✅
   - Кэширование в Redis (отложено)

2. **Товары меню** ✅
   - GET /api/menu/items (с фильтрацией) ✅
   - GET /api/menu/items/:id ✅
   - Оптимизация запросов ✅

### Фаза 3: Orders API ✅ (завершено)

1. **Список заказов** ✅

   - GET /api/orders (с фильтрацией) ✅
   - Пагинация и сортировка ✅

2. **Детали заказа** ✅

   - GET /api/orders/:id ✅
   - Оптимизация JOIN запросов ✅

3. **Статистика заказов** ✅
   - GET /api/orders/stats ✅
   - Агрегированные данные ✅

### Фаза 4: Analytics API (1-2 дня)

1. **Дашборд**

   - Основные метрики
   - Тренды и графики

2. **Детальная аналитика**
   - Продажи по периодам
   - Популярные товары

### Фаза 5: Безопасность и оптимизация (1 день)

1. **Аутентификация**

   - API ключи для админов
   - Проверка прав доступа

2. **Кэширование**

   - Redis для часто запрашиваемых данных
   - Cache invalidation

3. **Мониторинг**
   - Логирование запросов
   - Метрики производительности

## 🔧 Конфигурация

### Переменные окружения

```env
# API Configuration
API_PORT=3000
API_HOST=0.0.0.0
API_PREFIX=/api

# Security
API_KEYS=admin-key-1,admin-key-2
CORS_ORIGINS=http://localhost:3000,https://admin.shawarma-bot.com

# Rate Limiting
RATE_LIMIT_PUBLIC=100
RATE_LIMIT_ADMIN=1000

# Cache
REDIS_CACHE_TTL=300
ENABLE_CACHE=true
```

### Docker интеграция

```yaml
# Добавление в docker-compose.yml
api:
  build: .
  container_name: shawarma-api
  restart: unless-stopped
  ports:
    - '3000:3000'
  environment:
    - NODE_ENV=production
    - API_PORT=3000
    - DATABASE_URL=postgresql://shawarma_user:shawarma_pass@postgres:5432/shawarma_db
    - REDIS_URL=redis://redis:6379
  depends_on:
    - postgres
    - redis
  networks:
    - shawarma-network
```

## 📊 Метрики и мониторинг

### Ключевые метрики

- **Производительность**: время ответа, RPS
- **Доступность**: uptime, health checks
- **Использование**: популярные endpoints
- **Ошибки**: 4xx/5xx статусы

### Инструменты мониторинга

- **Логирование**: Winston + structured logs
- **Метрики**: Prometheus (в будущем)
- **Алерты**: при превышении лимитов

## 🎯 Следующие версии

### API v2.0 (будущее)

- **POST/PUT/DELETE** операции
- **WebSocket** для real-time обновлений
- **GraphQL** endpoint
- **Файловые загрузки** (изображения меню)
- **Push уведомления** через API

### Интеграции

- **Платежные системы** (Stripe, ЮKassa)
- **Доставка** (Яндекс.Доставка, CDEK)
- **CRM системы** (amoCRM, Битрикс24)
- **Аналитика** (Google Analytics, Яндекс.Метрика)
