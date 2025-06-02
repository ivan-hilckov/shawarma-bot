# 🎭 Стратегия моков - Shawarma Bot

**Версия:** 3.0.0  
**Дата:** 2025-01-03  
**Автор:** Команда разработки

---

## 📋 Обзор

Этот документ описывает стратегию использования моков в проекте, основанную на решении реальных проблем, с которыми мы столкнулись в процессе разработки.

## 🚨 История проблем

### Проблема #1: Дублирование моков

**Что было:**

```
setupJest.ts        ← Глобальные моки
apiSetupJest.ts     ← Дублированные моки для API
cart.test.ts        ← Локальные моки (те же самые)
orders.test.ts      ← Локальные моки (те же самые)
```

**Проблемы:**

- Одинаковый код в 4 местах
- Несинхронизированные изменения
- Сложность поддержки

**Решение:**

- ✅ Убрали `apiSetupJest.ts` (декабрь 2024)
- ✅ Локальные моки в каждом тесте
- ✅ Глобальные моки только для общих зависимостей

### Проблема #2: Конфликты моков

**Что было:**

```typescript
// setupJest.ts - глобальный мок
jest.mock('../src/api-client', () => ({
  /*...*/
}));

// unit/api-client.test.ts
import { BotApiClient } from '../../src/api-client'; // Получаем мок вместо класса!
```

**Проблемы:**

- Unit тесты не могли тестировать реальный код
- Неочевидные ошибки типизации
- Невозможность изолированного тестирования

**Решение:**

```typescript
// unit/api-client.test.ts
jest.unmock('../../src/api-client'); // Отключаем глобальный мок
jest.mock('axios'); // Мокируем только внешние зависимости
```

### Проблема #3: Зависающие тесты orders.test.ts

**Что было:**

```typescript
// Использовали apiSetupJest.ts
// Тесты зависали и не завершались
// Jest ждал закрытия ресурсов
```

**Причина:**

- Конфликт моков database plugin
- Неправильная очистка ресурсов
- Shared state между тестами

**Решение:**

```typescript
// Локальные моки с правильной очисткой
jest.mock('../../src/api/plugins/database', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(async (fastify: any) => {
    const mockPool = {
      /* ... */
    };
    fastify.decorate('db', mockPool);
    return Promise.resolve();
  }),
}));
```

## 🎯 Текущая стратегия моков

### 1. Глобальные моки (setupJest.ts)

**Используем для:**

- Базовые зависимости, нужные везде
- Сложные системные компоненты
- Логгер и утилиты

```typescript
// setupJest.ts
jest.mock('../src/logger', () => ({
  /*...*/
}));
jest.mock('../src/api-client', () => ({
  /*...*/
}));
jest.mock('../src/api/plugins/database', () => ({
  /*...*/
}));
```

**Плюсы:**

- Настройка один раз
- Работает для большинства тестов
- Не нужно повторять

**Минусы:**

- Может мешать unit тестам
- Скрывает реальные ошибки
- Сложно отлаживать

### 2. Локальные моки (в тестах)

**Используем для:**

- API route тесты
- Специфичные сценарии
- Когда нужен контроль

```typescript
// __tests__/api/cart.test.ts
jest.mock('../../src/api/services/cartApiService', () => ({
  CartApiService: jest.fn().mockImplementation(() => ({
    getCart: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    // ...
  })),
}));
```

**Плюсы:**

- Полный контроль
- Изоляция тестов
- Специфичная настройка

**Минусы:**

- Повторение кода
- Больше настройки
- Можно забыть обновить

### 3. Отключение глобальных моков

**Используем для:**

- Unit тесты компонентов
- Когда нужен реальный код
- Тестирование интеграций

```typescript
// __tests__/unit/api-client.test.ts
jest.unmock('../../src/api-client');
jest.mock('axios'); // Мокируем только внешние зависимости
```

**Плюсы:**

- Тестируем реальный код
- Нет скрытых зависимостей
- Четкий контроль

**Минусы:**

- Нужно мокировать вручную
- Может сломаться от изменений
- Сложнее настроить

## 📚 Каталог моков

### Database Plugin Mock

```typescript
jest.mock('../../src/api/plugins/database', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(async (fastify: any) => {
    const mockPool = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      end: jest.fn().mockResolvedValue(undefined),
    };
    fastify.decorate('db', mockPool);
    return Promise.resolve();
  }),
}));
```

**Использование:** API route тесты, интеграционные тесты

### Logger Mock

```typescript
jest.mock('../../src/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));
```

**Использование:** Везде где есть логирование

### CartApiService Mock

```typescript
jest.mock('../../src/api/services/cartApiService', () => ({
  CartApiService: jest.fn().mockImplementation(() => ({
    getCart: jest.fn().mockResolvedValue({ items: [], total: 0, itemsCount: 0 }),
    addToCart: jest.fn().mockResolvedValue(undefined),
    updateQuantity: jest.fn().mockResolvedValue(undefined),
    removeFromCart: jest.fn().mockResolvedValue(undefined),
    clearCart: jest.fn().mockResolvedValue(undefined),
    getCartTotal: jest.fn().mockResolvedValue({ total: 0, itemsCount: 0 }),
  })),
}));
```

**Использование:** API route тесты для корзины

### OrderService Mock

```typescript
jest.mock('../../src/api/services/orderService', () => ({
  OrderService: jest.fn().mockImplementation(() => ({
    getOrders: jest.fn().mockResolvedValue({ orders: [], total: 0 }),
    getOrderById: jest.fn().mockResolvedValue(null),
    getOrderStats: jest.fn().mockResolvedValue({
      total_orders: 0,
      pending_orders: 0,
      confirmed_orders: 0,
      preparing_orders: 0,
      ready_orders: 0,
      delivered_orders: 0,
      total_revenue: 0,
      avg_order_value: 0,
      orders_today: 0,
      revenue_today: 0,
      popular_items: [],
    }),
  })),
}));
```

**Использование:** API route тесты для заказов

### Axios Mock (для unit тестов)

```typescript
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeAll(() => {
  mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  mockedAxios.create.mockReturnValue(mockAxiosInstance);
});
```

**Использование:** Unit тесты api-client

## 🛠️ Правила использования

### Когда использовать глобальные моки

✅ **ДА:**

- Логгер (используется везде)
- Базовые утилиты
- Системные компоненты

❌ **НЕТ:**

- Компоненты которые тестируем
- Сложная бизнес-логика
- API клиенты

### Когда использовать локальные моки

✅ **ДА:**

- API route тесты
- Интеграционные тесты
- Специфичные сценарии
- Когда нужен контроль

❌ **НЕТ:**

- Простые unit тесты
- Когда глобальный мок подходит

### Когда отключать моки

✅ **ДА:**

- Unit тесты классов
- Тестирование реальной логики
- Проверка интеграций

❌ **НЕТ:**

- Когда есть внешние зависимости
- Тесты которые должны быть изолированы

## 🔧 Практические примеры

### Пример 1: API Route тест

```typescript
// __tests__/api/new-feature.test.ts

// Локальные моки для полного контроля
jest.mock('../../src/api/services/newFeatureService', () => ({
  NewFeatureService: jest.fn().mockImplementation(() => ({
    process: jest.fn().mockResolvedValue({ success: true }),
  })),
}));

jest.mock('../../src/api/plugins/database', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(async (fastify: any) => {
    const mockPool = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      end: jest.fn().mockResolvedValue(undefined),
    };
    fastify.decorate('db', mockPool);
    return Promise.resolve();
  }),
}));

jest.mock('../../src/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

import { buildServer } from '../../src/api/server';

describe('New Feature API', () => {
  let server: any;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should process request', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/new-feature',
      payload: { data: 'test' },
    });

    expect(response.statusCode).toBe(200);
  });
});
```

### Пример 2: Unit тест

```typescript
// __tests__/unit/new-service.test.ts

// Отключаем глобальные моки
jest.unmock('../../src/new-service');

// Мокируем только внешние зависимости
jest.mock('../../src/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

jest.mock('../../src/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

import { NewService } from '../../src/new-service';
import database from '../../src/database';

describe('NewService', () => {
  let service: NewService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NewService();
  });

  it('should process data correctly', async () => {
    // Настраиваем мок базы данных
    (database.query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] });

    const result = await service.processData('test');

    expect(database.query).toHaveBeenCalledWith('SELECT * FROM table WHERE data = $1', ['test']);
    expect(result).toEqual({ id: 1 });
  });

  it('should handle errors', async () => {
    (database.query as jest.Mock).mockRejectedValue(new Error('DB Error'));

    await expect(service.processData('test')).rejects.toThrow('DB Error');
  });
});
```

### Пример 3: Component тест с глобальными моками

```typescript
// __tests__/handlers.test.ts

// Используем глобальные моки как есть
// Добавляем только специфичные

describe('Bot Handlers', () => {
  // Глобальные моки применяются автоматически

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle start command', async () => {
    const mockMsg = {
      chat: { id: 123 },
      from: { id: 456 },
      text: '/start',
    };

    await handleStart(mockBot, mockMsg);

    // Проверяем что бот ответил
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('Добро пожаловать')
    );
  });
});
```

## 🚨 Частые ошибки

### 1. Забыли очистить моки

```typescript
// ❌ НЕПРАВИЛЬНО
describe('Tests', () => {
  it('test 1', () => {
    mockFunction.mockReturnValue('value1');
    // тест
  });

  it('test 2', () => {
    // mockFunction все еще возвращает 'value1'!
    // тест может сломаться
  });
});

// ✅ ПРАВИЛЬНО
describe('Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // теперь каждый тест чистый
});
```

### 2. Неправильный порядок импортов

```typescript
// ❌ НЕПРАВИЛЬНО
import { Component } from '../src/component';
jest.mock('../src/dependency'); // Мок не применится!

// ✅ ПРАВИЛЬНО
jest.mock('../src/dependency');
import { Component } from '../src/component';
```

### 3. Забыли отключить глобальный мок

```typescript
// ❌ НЕПРАВИЛЬНО - тестируем мок вместо реального кода
import { RealClass } from '../src/real-class'; // Это мок!

// ✅ ПРАВИЛЬНО
jest.unmock('../src/real-class');
import { RealClass } from '../src/real-class'; // Это реальный класс
```

### 4. Не закрыли ресурсы

```typescript
// ❌ НЕПРАВИЛЬНО - тесты могут висеть
describe('API Tests', () => {
  let server;

  beforeAll(async () => {
    server = await buildServer();
  });

  // Забыли afterAll!
});

// ✅ ПРАВИЛЬНО
describe('API Tests', () => {
  let server;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });
});
```

## 📊 Чек-лист для новых тестов

### Перед написанием теста

- [ ] Определили тип теста (unit/integration/API route)
- [ ] Выбрали стратегию моков
- [ ] Проверили что нужные моки есть в каталоге
- [ ] Понимаем какие зависимости мокировать

### При написании теста

- [ ] Мок импорты идут перед основными импортами
- [ ] Очищаем моки в beforeEach
- [ ] Закрываем ресурсы в afterAll
- [ ] Проверяем что тест изолирован

### После написания теста

- [ ] Тест проходит в изоляции
- [ ] Тест проходит в suite
- [ ] Нет утечек ресурсов
- [ ] Логи чистые (без лишнего мусора)

---

**Помните:** Моки - это инструмент изоляции, а не цель. Используйте их осознанно!
