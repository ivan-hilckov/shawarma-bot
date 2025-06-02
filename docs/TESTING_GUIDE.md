# 🧪 Руководство по тестированию - Shawarma Bot

**Версия:** 3.0.0  
**Дата:** 2025-01-03  
**Автор:** Команда разработки

---

## 📋 Обзор

Проект использует Jest для тестирования с TypeScript. За время разработки сформировалась сложная система моков и конфигураций, которая требует четкого понимания для эффективной работы.

## 🗂️ Структура тестов

```
__tests__/
├── setupJest.ts              # Глобальная настройка Jest
├── test-utils.ts             # Утилиты для тестов
├── api/                      # API Route тесты (интеграционные)
│   ├── cart.test.ts          # Тесты Cart API с локальными моками
│   ├── orders.test.ts        # Тесты Orders API с локальными моками
│   ├── menu.test.ts          # Тесты Menu API
│   ├── health.test.ts        # Тесты Health API
│   └── *-schemas.test.ts     # Тесты Zod схем
├── unit/                     # Unit тесты (изолированные)
│   ├── api-client.test.ts    # Тесты HTTP клиента
│   ├── cartApiService.test.ts # Тесты сервиса корзины
│   └── orderService.test.ts  # Тесты сервиса заказов
└── [файлы тестов]            # Основные тесты компонентов
```

## ⚙️ Конфигурация Jest

### jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setupJest.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '__tests__/setupJest.ts', // Игнорируем конфигурационные файлы
    '__tests__/test-utils.ts', // Утилиты не тестируем
  ],
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,
};
```

### Переменные окружения для тестов

```bash
NODE_ENV=test           # Устанавливается автоматически
DEBUG_TESTS=1          # Включает подробное логирование
JEST_CURRENT_TEST      # Автоматически устанавливается Jest
```

## 🔧 Система моков

### 🚨 ПРОБЛЕМЫ которые мы решили

#### 1. Дублирование моков

**Проблема:** Одни и те же моки повторялись в:

- `setupJest.ts` (глобальные)
- `apiSetupJest.ts` (для API тестов)
- Локальных файлах тестов

**Решение:** Используем локальные моки в каждом тестовом файле.

#### 2. Конфликты моков

**Проблема:** Глобальные моки из `setupJest.ts` мешали unit тестам.

**Решение:** Unit тесты отключают глобальные моки через `jest.unmock()`.

#### 3. Проблемы с логированием

**Проблема:** Тесты засорены логами от Fastify, Winston, console.

**Решение:** Система фильтрации логов в `setupJest.ts`.

### 📦 Типы моков

#### 1. Глобальные моки (setupJest.ts)

```typescript
// Применяются ко ВСЕМ тестам автоматически
jest.mock('../src/api-client', () => ({
  /*...*/
}));
jest.mock('../src/logger', () => ({
  /*...*/
}));
jest.mock('../src/api/plugins/database', () => ({
  /*...*/
}));
```

**Использование:** Для базовых зависимостей, которые нужны везде.

#### 2. Локальные моки (в файлах тестов)

```typescript
// API тесты - переопределяем глобальные моки
jest.mock('../../src/api/services/cartApiService', () => ({
  CartApiService: jest.fn().mockImplementation(() => ({
    getCart: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    // ...
  })),
}));
```

**Использование:** Для специфичных тестов API routes.

#### 3. Отключение глобальных моков

```typescript
// Unit тесты - отключаем мешающие глобальные моки
jest.unmock('../../src/api-client');

// Мокируем только то что нужно
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
```

**Использование:** Для изолированного тестирования компонентов.

## 🎯 Стратегии тестирования

### 🛣️ API Route тесты (Интеграционные)

**Цель:** Тестировать HTTP endpoints целиком

**Подход:**

- Запускаем настоящий Fastify сервер
- Используем локальные моки для сервисов
- Тестируем через `server.inject()`

**Пример:**

```typescript
import { buildServer } from '../../src/api/server';

// Локальные моки для изоляции
jest.mock('../../src/api/services/cartApiService', () => ({
  /*...*/
}));

describe('Cart API Routes', () => {
  let server: any;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should validate userId parameter', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/cart/invalid',
    });

    expect(response.statusCode).toBe(400);
  });
});
```

### 🔧 Unit тесты (Изолированные)

**Цель:** Тестировать отдельные классы/функции

**Подход:**

- Отключаем глобальные моки
- Мокируем только внешние зависимости
- Тестируем логику изолированно

**Пример:**

```typescript
// Отключаем глобальный мок
jest.unmock('../../src/api-client');

// Мокируем только axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BotApiClient', () => {
  let client: BotApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    // Мок для axios.create
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    client = new BotApiClient();
  });

  it('should create axios instance with config', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3000/api',
      timeout: 5000,
    });
  });
});
```

### 📋 Component тесты (Основные)

**Цель:** Тестировать bot handlers, services, utilities

**Подход:**

- Используем глобальные моки как есть
- Добавляем специфичные моки при необходимости
- Фокус на бизнес-логике

**Пример:**

```typescript
// Используем глобальные моки из setupJest.ts
// Добавляем специфичные если нужно

describe('Cart Service', () => {
  it('should add item to cart', async () => {
    // Тест использует глобальные моки автоматически
    await cartService.addToCart(123, menuItem, 2);
    // Проверяем логику
  });
});
```

## 📝 Система логирования в тестах

### Проблема

Тесты засорялись логами от:

- Fastify сервера (HTTP запросы)
- Winston логгера (структурированные логи)
- Console.log/warn/error (отладочная информация)
- ts-jest предупреждения

### Решение в setupJest.ts

```typescript
// Подавляем console.warn для библиотечных сообщений
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const message = args[0]?.toString?.() || '';
  if (
    message.includes('ts-jest') ||
    message.includes('deprecated') ||
    message.includes('isolatedModules')
  ) {
    return; // Игнорируем
  }

  // Показываем логи нашего логгера или при DEBUG_TESTS
  if (message.includes('WARN [') || process.env.DEBUG_TESTS) {
    originalWarn.apply(console, args);
    return;
  }

  originalWarn.apply(console, args);
};
```

### Контроль логирования

```bash
# Тихий режим (минимум логов)
npm run test:quiet

# Подробный режим (все логи)
npm run test:verbose

# Отладочный режим (максимум информации)
npm run test:debug
```

## 📊 Команды для тестирования

### Основные команды

```bash
npm test                    # Все тесты
npm run test:coverage       # С покрытием кода
npm run test:watch          # В режиме наблюдения
npm run test:api            # Только API тесты
```

### Специальные режимы

```bash
npm run test:quiet          # Минимум логов
npm run test:verbose        # Подробная информация
npm run test:debug          # Отладочный режим (DEBUG_TESTS=1)
```

### Отладка конкретного теста

```bash
# Запуск одного файла
npm test cart.test.ts

# С отладкой
DEBUG_TESTS=1 npm test cart.test.ts

# Только один тест
npm test -- --testNamePattern="should add item"
```

## 🛠️ Создание новых тестов

### 1. API Route тест

```typescript
// __tests__/api/new-endpoint.test.ts

// Локальные моки для изоляции
jest.mock('../../src/api/services/newService', () => ({
  NewService: jest.fn().mockImplementation(() => ({
    method: jest.fn().mockResolvedValue({}),
  })),
}));

jest.mock('../../src/api/plugins/database', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(async (fastify: any) => {
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

describe('New Endpoint API Tests', () => {
  let server: any;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  // Ваши тесты
});
```

### 2. Unit тест

```typescript
// __tests__/unit/new-component.test.ts

// Отключаем глобальные моки если мешают
jest.unmock('../../src/target-module');

// Мокируем только внешние зависимости
jest.mock('../../src/external-dependency', () => ({
  ExternalClass: jest.fn(),
}));

describe('NewComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Ваши тесты
});
```

### 3. Component тест

```typescript
// __tests__/new-component.test.ts

// Глобальные моки применяются автоматически
// Добавляем специфичные если нужно

describe('NewComponent', () => {
  // Ваши тесты используют глобальные моки
});
```

## 🚨 Частые проблемы и решения

### Проблема: Тесты висят и не завершаются

**Причины:**

- Открытые соединения с БД
- Незакрытые HTTP серверы
- Активные таймеры

**Решения:**

```typescript
afterAll(async () => {
  await server.close();
  // Очистите ресурсы
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});
```

### Проблема: Моки не работают как ожидается

**Причины:**

- Конфликт глобальных и локальных моков
- Кеширование модулей
- Неправильный порядок импорта

**Решения:**

```typescript
// Очистка кеша модуля
beforeEach(() => {
  delete require.cache[require.resolve('../../src/module')];
  const module = await import('../../src/module');
});

// Отключение глобального мока
jest.unmock('../../src/module');

// Очистка всех моков
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Проблема: Много логов в тестах

**Решения:**

```bash
# Используйте тихий режим
npm run test:quiet

# Или отладочные переменные
DEBUG_TESTS=0 npm test
```

### Проблема: Ошибки типизации TypeScript

**Решения:**

```typescript
// Типизированные моки
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Моки с явной типизацией
jest.mock('module', (): typeof import('module') => ({
  function: jest.fn(),
}));
```

## 📈 Метрики качества

### Текущие показатели

- **Всего тестов:** 227
- **Покрытие кода:** 81.7%
- **API Routes:** 40.79% покрытия
- **Core Components:** 85%+ покрытия

### Цели

- **Общее покрытие:** >85%
- **Критичные компоненты:** 100%
- **API Routes:** >60%
- **Время выполнения:** <30 секунд

## 🔄 Рефакторинг и улучшения

### Выполненные улучшения

- ✅ Убрали дублирование моков
- ✅ Решили проблемы с логированием
- ✅ Стандартизировали подходы к тестированию
- ✅ Добавили отладочные команды

### Планы на будущее

- [ ] Автоматические snapshot тесты
- [ ] Performance тесты
- [ ] E2E тесты с реальным Telegram API
- [ ] Интеграционные тесты с реальной БД

---

## 📚 Дополнительные ресурсы

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Fastify Testing](https://www.fastify.io/docs/latest/Guides/Testing/)
- [TypeScript Jest](https://jestjs.io/docs/getting-started#using-typescript)

---

**Помните:** Хорошие тесты - это инвестиция в стабильность проекта. Следуйте этому руководству для поддержания качества!
