import fastify, { FastifyInstance } from 'fastify';

// Отключаем глобальный мок из setupJest.ts для этого файла
jest.unmock('../../src/api/plugins/database');

// Моки для зависимостей database plugin
const mockConnect = jest.fn();
const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockEnd = jest.fn();
const mockClientQuery = jest.fn();

const mockClient = {
  query: mockClientQuery,
  release: mockRelease,
};

const mockPool = {
  connect: mockConnect,
  query: mockQuery,
  end: mockEnd,
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// Мокаем зависимости ПЕРЕД импортом database plugin
jest.doMock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => mockPool),
}));

jest.doMock('../../src/config', () => ({
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
}));

jest.doMock('../../src/logger', () => ({
  createLogger: jest.fn(() => mockLogger),
}));

// ТЕПЕРЬ импортируем реальный database plugin
import databasePlugin from '../../src/api/plugins/database';

describe('Database Plugin (Real Implementation Tests)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    // Сброс всех моков
    jest.clearAllMocks();

    // Настройка успешных моков по умолчанию
    mockConnect.mockResolvedValue(mockClient);
    mockClientQuery.mockResolvedValue({ rows: [{ now: new Date() }] });
    mockEnd.mockResolvedValue(undefined);

    // Создание нового экземпляра Fastify
    app = fastify({ logger: false });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Successful initialization', () => {
    it('should register plugin successfully', async () => {
      await app.register(databasePlugin);

      const { Pool } = require('pg');
      expect(Pool).toHaveBeenCalledWith({
        connectionString: 'postgresql://test:test@localhost:5432/test_db',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });

    it('should test database connection on startup', async () => {
      await app.register(databasePlugin);

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockClientQuery).toHaveBeenCalledWith('SELECT NOW()');
      expect(mockRelease).toHaveBeenCalledTimes(1);
    });

    it('should decorate fastify instance with db pool', async () => {
      await app.register(databasePlugin);

      expect(app.db).toBeDefined();
      expect(app.db).toBe(mockPool);
    });

    it('should log successful connection', async () => {
      await app.register(databasePlugin);

      expect(mockLogger.info).toHaveBeenCalledWith('✅ Database connected successfully');
    });

    it('should register onClose hook', async () => {
      const mockAddHook = jest.spyOn(app, 'addHook');

      await app.register(databasePlugin);

      expect(mockAddHook).toHaveBeenCalledWith('onClose', expect.any(Function));

      mockAddHook.mockRestore();
    });
  });

  describe('Connection error handling', () => {
    it('should handle pool connection errors', async () => {
      const connectionError = new Error('Connection failed');
      mockConnect.mockRejectedValue(connectionError);

      await expect(app.register(databasePlugin)).rejects.toThrow('Connection failed');

      expect(mockLogger.error).toHaveBeenCalledWith('❌ Database connection failed:', {
        error: 'Connection failed',
      });
    });

    it('should handle SQL query errors', async () => {
      const queryError = new Error('Query failed');
      mockClientQuery.mockRejectedValue(queryError);

      await expect(app.register(databasePlugin)).rejects.toThrow('Query failed');

      expect(mockLogger.error).toHaveBeenCalledWith('❌ Database connection failed:', {
        error: 'Query failed',
      });
      // В реальном коде при ошибке query клиент НЕ освобождается
      expect(mockRelease).toHaveBeenCalledTimes(0);
    });

    it('should handle non-Error objects', async () => {
      const errorObject = { message: 'Custom error' };
      mockConnect.mockRejectedValue(errorObject);

      await expect(app.register(databasePlugin)).rejects.toEqual(errorObject);

      expect(mockLogger.error).toHaveBeenCalledWith('❌ Database connection failed:', {
        error: errorObject,
      });
    });
  });

  describe('Plugin lifecycle', () => {
    it('should close pool on app shutdown', async () => {
      await app.register(databasePlugin);

      // Закрываем приложение
      await app.close();

      expect(mockEnd).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('🔌 Database connection closed');
    });

    it('should handle pool close errors', async () => {
      const closeError = new Error('Close failed');
      mockEnd.mockRejectedValue(closeError);

      await app.register(databasePlugin);

      // В реальном коде нет try/catch в onClose hook, поэтому ошибка пробрасывается
      await expect(app.close()).rejects.toThrow('Close failed');

      expect(mockEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('Plugin configuration', () => {
    it('should be a function', () => {
      expect(typeof databasePlugin).toBe('function');
    });

    it('should be wrapped with fastify-plugin', () => {
      expect(databasePlugin).toBeDefined();
      expect(typeof databasePlugin).toBe('function');

      // Проверяем свойства fastify-plugin
      expect((databasePlugin as any)[Symbol.for('fastify.display-name')]).toBe('database');
    });
  });

  describe('TypeScript integration', () => {
    it('should properly extend FastifyInstance interface', async () => {
      await app.register(databasePlugin);

      expect(app.db).toBeDefined();
      expect(typeof app.db.connect).toBe('function');
      expect(typeof app.db.query).toBe('function');
      expect(typeof app.db.end).toBe('function');
    });
  });

  describe('Error scenarios', () => {
    it('should handle database connection timeout', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.name = 'ConnectionTimeoutError';
      mockConnect.mockRejectedValue(timeoutError);

      await expect(app.register(databasePlugin)).rejects.toThrow('Connection timeout');

      expect(mockLogger.error).toHaveBeenCalledWith('❌ Database connection failed:', {
        error: 'Connection timeout',
      });
    });

    it('should handle database unavailable', async () => {
      const unavailableError = new Error('database "test_db" does not exist');
      mockClientQuery.mockRejectedValue(unavailableError);

      await expect(app.register(databasePlugin)).rejects.toThrow(
        'database "test_db" does not exist'
      );

      // В реальном коде при ошибке query клиент НЕ освобождается
      expect(mockRelease).toHaveBeenCalledTimes(0);
    });
  });
});
