// Устанавливаем NODE_ENV для тестов
process.env.NODE_ENV = 'test';

// Подавляем console.warn в тестах для более чистого вывода
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  // Фильтруем предупреждения ts-jest и других библиотек
  const message = args[0]?.toString?.() || '';
  if (
    message.includes('ts-jest') ||
    message.includes('deprecated') ||
    message.includes('isolatedModules')
  ) {
    return;
  }
  // Разрешаем логи от логгера в тестах
  if (message.includes('WARN [') || process.env.DEBUG_TESTS) {
    originalWarn.apply(console, args);
    return;
  }
  originalWarn.apply(console, args);
};

// Подавляем console.error для тестов, если это не критические ошибки
const originalError = console.error;
console.error = (...args: any[]) => {
  const message = args[0]?.toString?.() || '';
  // Показываем только критические ошибки в тестах, или если это тест логгера
  if (
    process.env.DEBUG_TESTS ||
    message.includes('FAIL') ||
    message.includes('Error:') ||
    message.includes('ERROR [') ||
    message.includes('WARN [')
  ) {
    originalError.apply(console, args);
  }
};

// Глобальные моки для тестов
jest.mock('../src/api-client', () => ({
  addToCart: jest.fn(),
  getCart: jest.fn(),
  getCartTotal: jest.fn(),
  updateCartQuantity: jest.fn(),
  removeFromCart: jest.fn(),
  clearCart: jest.fn(),
}));

// Мок для логгера чтобы избежать лишних выводов в тестах
jest.mock('../src/logger', () => {
  // Создаем мок класса Logger
  const MockLogger = jest.fn().mockImplementation((_context = 'App') => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    }),
  }));

  return {
    __esModule: true,
    default: MockLogger, // export default Logger
    LogLevel: {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
    },
    createLogger: jest.fn(context => new MockLogger(context)),
  };
});

// Мок для database plugin
jest.mock('../src/api/plugins/database', () => {
  const mockPool = {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    }),
    query: jest.fn().mockImplementation((sql: string, _params?: any[]) => {
      // Возвращаем разные моки в зависимости от запроса
      if (sql.includes('COUNT(*)') && sql.includes('total')) {
        return Promise.resolve({ rows: [{ total: '0' }] });
      }
      if (sql.includes('total_orders')) {
        return Promise.resolve({
          rows: [
            {
              total_orders: '0',
              total_revenue: '0.00',
              avg_order_value: '0.00',
            },
          ],
        });
      }
      if (sql.includes('orders_today')) {
        return Promise.resolve({
          rows: [
            {
              orders_today: '0',
              revenue_today: '0.00',
            },
          ],
        });
      }
      if (sql.includes('GROUP BY status')) {
        return Promise.resolve({ rows: [] });
      }
      if (sql.includes('total_ordered')) {
        return Promise.resolve({ rows: [] });
      }
      // Основные запросы orders
      if (sql.includes('FROM orders o') && sql.includes('JOIN users u')) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    }),
    end: jest.fn().mockResolvedValue(undefined),
  };

  return jest.fn().mockImplementation(async (fastify: any) => {
    fastify.decorate('db', mockPool);
    return Promise.resolve();
  });
});

// Глобальный мок для console методов в тестовой среде
const consoleMethods = ['log', 'info', 'debug'] as const;
const originalConsoleMethods: Record<string, any> = {};

// Сохраняем оригинальные методы
consoleMethods.forEach(method => {
  originalConsoleMethods[method] = console[method];
});

// Подавляем логи в тестовой среде, если не установлена переменная DEBUG_TESTS
// Исключаем тесты логгера
if (!process.env.DEBUG_TESTS && !process.env.JEST_CURRENT_TEST?.includes('logger.test')) {
  consoleMethods.forEach(method => {
    const originalMethod = console[method];
    console[method] = (...args: any[]) => {
      const message = args[0]?.toString?.() || '';
      // Разрешаем сообщения от логгера
      if (message.includes('INFO [') || message.includes('DEBUG [')) {
        originalMethod.apply(console, args);
      }
    };
  });
}

// Восстанавливаем console методы после всех тестов
const restoreConsoleMethods = () => {
  if (!process.env.DEBUG_TESTS) {
    consoleMethods.forEach(method => {
      console[method] = originalConsoleMethods[method];
    });
  }
  // Восстанавливаем warn и error
  console.warn = originalWarn;
  console.error = originalError;
};

// Устанавливаем таймаут для всех тестов
jest.setTimeout(10000);

// Очистка ресурсов после всех тестов
afterAll(() => {
  restoreConsoleMethods();
});
