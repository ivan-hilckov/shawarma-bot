// Setup для API тестов

// Мок для database plugin
jest.mock('../src/api/plugins/database', () => {
  const mockPool = {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] as any[] }),
      release: jest.fn(),
    }),
    query: jest.fn().mockResolvedValue({ rows: [] as any[] }),
    end: jest.fn().mockResolvedValue(undefined),
  };

  return {
    __esModule: true,
    default: jest.fn().mockImplementation(async (fastify: any) => {
      fastify.decorate('db', mockPool);
      fastify.addHook('onClose', async () => {
        await mockPool.end();
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

// Увеличиваем таймаут для API тестов
jest.setTimeout(30000);
