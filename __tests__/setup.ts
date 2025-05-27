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
jest.mock('../src/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Мок для database plugin
jest.mock('../src/api/plugins/database', () => {
  const mockPool = {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    }),
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn().mockResolvedValue(undefined),
  };

  return jest.fn().mockImplementation(async (fastify: any) => {
    fastify.decorate('db', mockPool);
    return Promise.resolve();
  });
});

// Увеличиваем таймаут для всех тестов
jest.setTimeout(15000);
