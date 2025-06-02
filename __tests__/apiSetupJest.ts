// Setup для API тестов

// Мок для CartApiService
jest.mock('../src/api/services/cartApiService', () => ({
  CartApiService: jest.fn().mockImplementation(() => ({
    getCart: jest.fn().mockResolvedValue({ items: [], total: 0, itemsCount: 0 }),
    addToCart: jest.fn().mockResolvedValue(undefined),
    updateQuantity: jest.fn().mockResolvedValue(undefined),
    removeFromCart: jest.fn().mockResolvedValue(undefined),
    clearCart: jest.fn().mockResolvedValue(undefined),
    getCartTotal: jest.fn().mockResolvedValue({ total: 0, itemsCount: 0 }),
  })),
}));

// Мок для OrderService
jest.mock('../src/api/services/orderService', () => ({
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

// Мок для database plugin
jest.mock('../src/api/plugins/database', () => {
  const mockPool = {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    }),
    query: jest.fn().mockImplementation((sql: string, _params?: any[]) => {
      // Возвращаем разные моки в зависимости от запроса
      if (sql.includes('COUNT(*)')) {
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
      if (sql.includes('FROM orders o')) {
        return Promise.resolve({ rows: [] });
      }

      return Promise.resolve({ rows: [] });
    }),
    end: jest.fn().mockResolvedValue(undefined),
  };

  return {
    __esModule: true,
    default: jest.fn().mockImplementation(async (fastify: any) => {
      fastify.decorate('db', mockPool);
      fastify.addHook('onClose', async () => {
        try {
          await mockPool.end();
        } catch (error) {
          // Игнорируем ошибки при закрытии мок соединений
        }
      });
      return Promise.resolve();
    }),
  };
});

// Мок для логгера
jest.mock('../src/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Таймаут настроен в основном setup.ts
