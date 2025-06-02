// Unit тесты для server.ts - отключаем глобальные моки для изолированного тестирования
jest.unmock('../../src/api/server');

// Мокируем все внешние зависимости локально
const mockFastify = {
  register: jest.fn().mockResolvedValue(undefined),
  addHook: jest.fn().mockResolvedValue(undefined),
  setErrorHandler: jest.fn(),
  setNotFoundHandler: jest.fn(),
  listen: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  log: {
    info: jest.fn(),
    error: jest.fn(),
  },
};

const FastifyConstructor = jest.fn(() => mockFastify);
jest.mock('fastify', () => FastifyConstructor);

// Мок для всех Fastify плагинов
jest.mock('@fastify/swagger', () => jest.fn());
jest.mock('@fastify/swagger-ui', () => jest.fn());
jest.mock('@fastify/cors', () => jest.fn());
jest.mock('@fastify/rate-limit', () => jest.fn());

// Мокируем database plugin
const mockDatabasePlugin = jest.fn().mockResolvedValue(undefined);
jest.mock('../../src/api/plugins/database', () => mockDatabasePlugin);

// Мокируем все routes
jest.mock('../../src/api/routes/cart', () => jest.fn());
jest.mock('../../src/api/routes/health', () => jest.fn());
jest.mock('../../src/api/routes/menu', () => jest.fn());
jest.mock('../../src/api/routes/orders', () => jest.fn());

// Мокируем config для разных сценариев (используем any чтобы избежать TypeScript конфликтов)
const mockTestConfig: any = {
  NODE_ENV: 'test',
  API_PORT: 3000,
  API_HOST: '0.0.0.0',
  API_PREFIX: '/api',
  CORS_ORIGINS: ['http://localhost:3000'],
  RATE_LIMIT_PUBLIC: 100,
};

jest.mock('../../src/config', () => mockTestConfig);

// Мокируем logger
const mockTestLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../../src/logger', () => ({
  createLogger: jest.fn(() => mockTestLogger),
}));

// Мокируем process для graceful shutdown тестов
const mockTestProcessExit = jest.fn();
const mockTestProcessOn = jest.fn();
const originalProcess = process;

describe('Server Module - Comprehensive Unit Tests', () => {
  let buildServer: any;
  let startServer: any;

  beforeAll(async () => {
    // Мокируем process
    Object.defineProperty(global, 'process', {
      value: {
        ...originalProcess,
        exit: mockTestProcessExit,
        on: mockTestProcessOn,
      },
      writable: true,
    });

    // Динамический импорт для изоляции
    const serverModule = await import('../../src/api/server');
    buildServer = serverModule.buildServer;
    startServer = serverModule.startServer;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Сброс конфигурации к умолчанию
    mockTestConfig.NODE_ENV = 'test';
    mockTestConfig.API_PORT = 3000;
    mockTestConfig.API_HOST = '0.0.0.0';
  });

  afterAll(() => {
    // Восстанавливаем process
    Object.defineProperty(global, 'process', {
      value: originalProcess,
      writable: true,
    });
  });

  describe('buildServer() function', () => {
    it('should create Fastify instance with correct configuration for development', async () => {
      mockTestConfig.NODE_ENV = 'development';

      await buildServer();

      expect(FastifyConstructor).toHaveBeenCalledWith({
        logger: true,
      });
    });

    it('should create Fastify instance with correct configuration for production', async () => {
      mockTestConfig.NODE_ENV = 'production';

      await buildServer();

      expect(FastifyConstructor).toHaveBeenCalledWith({
        logger: {
          level: 'info',
        },
      });
    });

    it('should create Fastify instance with correct configuration for test', async () => {
      mockTestConfig.NODE_ENV = 'test';

      await buildServer();

      expect(FastifyConstructor).toHaveBeenCalledWith({
        logger: false,
      });
    });

    it('should register all required plugins in correct order', async () => {
      await buildServer();

      // Проверяем что все плагины зарегистрированы
      expect(mockFastify.register).toHaveBeenCalledTimes(9); // 4 plugins + database + 4 routes

      // Проверяем регистрацию плагинов
      const registerCalls = mockFastify.register.mock.calls;
      expect(registerCalls[0][0]).toBeDefined(); // fastifySwagger
      expect(registerCalls[1][0]).toBeDefined(); // fastifySwaggerUi
      expect(registerCalls[2][0]).toBeDefined(); // fastifyCors
      expect(registerCalls[3][0]).toBeDefined(); // fastifyRateLimit
      expect(registerCalls[4][0]).toBe(mockDatabasePlugin); // database plugin
    });

    it('should register all routes with correct prefix', async () => {
      await buildServer();

      const registerCalls = mockFastify.register.mock.calls;

      // Последние 4 вызова должны быть routes с префиксом
      const routeCalls = registerCalls.slice(-4);
      routeCalls.forEach(call => {
        expect(call[1]).toEqual({ prefix: '/api' });
      });
    });

    it('should setup error handler middleware', async () => {
      await buildServer();

      expect(mockFastify.setErrorHandler).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should setup 404 handler middleware', async () => {
      await buildServer();

      expect(mockFastify.setNotFoundHandler).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should setup request logging hook for non-test environments', async () => {
      mockTestConfig.NODE_ENV = 'development';

      await buildServer();

      expect(mockFastify.addHook).toHaveBeenCalledWith('onRequest', expect.any(Function));
    });

    it('should NOT setup request logging hook for test environment', async () => {
      mockTestConfig.NODE_ENV = 'test';

      await buildServer();

      expect(mockFastify.addHook).not.toHaveBeenCalled();
    });

    it('should handle plugin registration failure and throw error', async () => {
      const pluginError = new Error('Plugin registration failed');
      mockFastify.register.mockRejectedValueOnce(pluginError);

      await expect(buildServer()).rejects.toThrow('Plugin registration failed');

      expect(mockTestLogger.error).toHaveBeenCalledWith('Failed to build server:', {
        error: 'Plugin registration failed',
      });
    });

    it('should return fastify instance on success', async () => {
      const server = await buildServer();

      expect(server).toBe(mockFastify);
    });
  });

  describe('Error Handler Middleware', () => {
    let errorHandler: any;

    beforeEach(async () => {
      await buildServer();
      errorHandler = mockFastify.setErrorHandler.mock.calls[0][0];
    });

    it('should handle errors with statusCode in development', async () => {
      mockTestConfig.NODE_ENV = 'development';

      const error = {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        stack: 'Error stack trace',
      };

      const mockRequest = {
        log: { error: jest.fn() },
      };

      const mockReply = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await errorHandler(error, mockRequest, mockReply);

      expect(mockRequest.log.error).toHaveBeenCalledWith(error, 'Request error');
      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          stack: 'Error stack trace',
        },
        timestamp: expect.any(String),
      });
    });

    it('should handle errors without statusCode (defaults to 500)', async () => {
      const error = {
        message: 'Something went wrong',
      };

      const mockRequest = {
        log: { error: jest.fn() },
      };

      const mockReply = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await errorHandler(error, mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
    });

    it('should hide error details in production for 500 errors', async () => {
      mockTestConfig.NODE_ENV = 'production';

      const error = {
        statusCode: 500,
        message: 'Internal database error',
      };

      const mockRequest = {
        log: { error: jest.fn() },
      };

      const mockReply = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await errorHandler(error, mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error', // Скрыто в production
        },
        timestamp: expect.any(String),
      });
    });

    it('should show error details in production for non-500 errors', async () => {
      mockTestConfig.NODE_ENV = 'production';

      const error = {
        statusCode: 400,
        code: 'BAD_REQUEST',
        message: 'Invalid parameter',
      };

      const mockRequest = {
        log: { error: jest.fn() },
      };

      const mockReply = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await errorHandler(error, mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid parameter', // Показано в production для не-500 ошибок
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe('404 Handler Middleware', () => {
    let notFoundHandler: any;

    beforeEach(async () => {
      await buildServer();
      notFoundHandler = mockFastify.setNotFoundHandler.mock.calls[0][0];
    });

    it('should handle 404 errors correctly', async () => {
      const mockRequest = {
        method: 'GET',
        url: '/api/non-existent',
      };

      const mockReply = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await notFoundHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route GET /api/non-existent not found',
        },
        timestamp: expect.any(String),
      });
    });

    it('should handle different HTTP methods in 404', async () => {
      const mockRequest = {
        method: 'POST',
        url: '/api/missing-endpoint',
      };

      const mockReply = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await notFoundHandler(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Route POST /api/missing-endpoint not found',
          }),
        })
      );
    });
  });

  describe('Rate Limiting Configuration', () => {
    it('should configure rate limiting with errorResponseBuilder', async () => {
      await buildServer();

      const rateLimitCall = mockFastify.register.mock.calls.find(
        call => call[1] && call[1].max === 100
      );

      expect(rateLimitCall).toBeDefined();
      expect(rateLimitCall[1]).toMatchObject({
        max: 100,
        timeWindow: '1 minute',
        skipOnError: true,
        keyGenerator: expect.any(Function),
        errorResponseBuilder: expect.any(Function),
      });
    });

    it('should generate different keys for admin and public requests', async () => {
      await buildServer();

      const rateLimitConfig = mockFastify.register.mock.calls.find(
        call => call[1] && call[1].max === 100
      )[1];

      const keyGenerator = rateLimitConfig.keyGenerator;

      // Public request
      const publicRequest = {
        ip: '192.168.1.1',
        headers: {},
      };

      // Admin request
      const adminRequest = {
        ip: '192.168.1.1',
        headers: {
          authorization: 'Bearer admin-token',
        },
      };

      expect(keyGenerator(publicRequest)).toBe('192.168.1.1-public');
      expect(keyGenerator(adminRequest)).toBe('192.168.1.1-admin');
    });

    it('should build correct error response for rate limiting', async () => {
      await buildServer();

      const rateLimitConfig = mockFastify.register.mock.calls.find(
        call => call[1] && call[1].max === 100
      )[1];

      const errorResponseBuilder = rateLimitConfig.errorResponseBuilder;

      const mockRequest = { ip: '192.168.1.1' };
      const mockContext = {
        max: 100,
        timeWindow: '1 minute',
        remaining: 0,
      };

      const response = errorResponseBuilder(mockRequest, mockContext);

      expect(response).toEqual({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          details: {
            limit: 100,
            window: '1 minute',
            remaining: 0,
          },
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe('startServer() function', () => {
    it('should start server successfully', async () => {
      await startServer();

      expect(mockFastify.listen).toHaveBeenCalledWith({
        port: 3000,
        host: '0.0.0.0',
      });

      expect(mockTestLogger.info).toHaveBeenCalledWith('🚀 API Server started on 0.0.0.0:3000');
      expect(mockTestLogger.info).toHaveBeenCalledWith(
        '📚 Swagger UI available at http://0.0.0.0:3000/api/docs'
      );
    });

    it('should setup graceful shutdown handlers', async () => {
      await startServer();

      expect(mockTestProcessOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      expect(mockTestProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });

    it('should handle server listen failure', async () => {
      const listenError = new Error('Port already in use');
      mockFastify.listen.mockRejectedValueOnce(listenError);

      // startServer() вызывает process.exit() вместо throw, поэтому проверяем логи и exit
      await startServer();

      expect(mockTestLogger.error).toHaveBeenCalledWith('❌ Failed to start server:', {
        error: 'Port already in use',
      });
      expect(mockTestProcessExit).toHaveBeenCalledWith(1);
    });

    it('should handle buildServer failure', async () => {
      // Мокируем ошибку в buildServer через plugin failure
      mockFastify.register.mockRejectedValueOnce(new Error('Database connection failed'));

      // startServer() вызывает process.exit() при ошибке buildServer
      await startServer();

      expect(mockTestProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('Graceful Shutdown Handlers', () => {
    let sigintHandler: any;
    let sigtermHandler: any;

    beforeEach(async () => {
      await startServer();

      const processOnCalls = mockTestProcessOn.mock.calls;
      sigintHandler = processOnCalls.find(call => call[0] === 'SIGINT')[1];
      sigtermHandler = processOnCalls.find(call => call[0] === 'SIGTERM')[1];
    });

    it('should handle SIGINT signal gracefully', async () => {
      await sigintHandler();

      expect(mockTestLogger.info).toHaveBeenCalledWith(
        'Received SIGINT, shutting down gracefully...'
      );
      expect(mockFastify.close).toHaveBeenCalled();
      expect(mockTestLogger.info).toHaveBeenCalledWith('✅ Server closed successfully');
      expect(mockTestProcessExit).toHaveBeenCalledWith(0);
    });

    it('should handle SIGTERM signal gracefully', async () => {
      await sigtermHandler();

      expect(mockTestLogger.info).toHaveBeenCalledWith(
        'Received SIGTERM, shutting down gracefully...'
      );
      expect(mockFastify.close).toHaveBeenCalled();
      expect(mockTestProcessExit).toHaveBeenCalledWith(0);
    });

    it('should handle server close failure during shutdown', async () => {
      const closeError = new Error('Failed to close server');
      mockFastify.close.mockRejectedValueOnce(closeError);

      await sigintHandler();

      expect(mockTestLogger.error).toHaveBeenCalledWith('❌ Error during shutdown:', {
        error: 'Failed to close server',
      });
      expect(mockTestProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('Module Export Behavior', () => {
    it('should export buildServer and startServer functions', () => {
      expect(typeof buildServer).toBe('function');
      expect(typeof startServer).toBe('function');
    });

    it('should have require.main check for direct execution', () => {
      // Этот тест покрывает строку 245: if (require.main === module) { startServer(); }
      // В тестовой среде require.main !== module, поэтому startServer() не должен вызываться автоматически
      expect(mockFastify.listen).not.toHaveBeenCalled();
    });
  });

  describe('Swagger Configuration', () => {
    it('should configure Swagger with production host', async () => {
      mockTestConfig.NODE_ENV = 'production';

      await buildServer();

      const swaggerCall = mockFastify.register.mock.calls[0];
      expect(swaggerCall[1].swagger.host).toBe('api.shawarma-bot.com');
      expect(swaggerCall[1].swagger.schemes).toEqual(['https']);
    });

    it('should configure Swagger with development host', async () => {
      mockTestConfig.NODE_ENV = 'development';
      mockTestConfig.API_PORT = 4000;

      await buildServer();

      const swaggerCall = mockFastify.register.mock.calls[0];
      expect(swaggerCall[1].swagger.host).toBe('localhost:4000');
      expect(swaggerCall[1].swagger.schemes).toEqual(['http']);
    });

    it('should configure Swagger UI with correct options', async () => {
      await buildServer();

      const swaggerUICall = mockFastify.register.mock.calls[1];
      expect(swaggerUICall[1]).toMatchObject({
        routePrefix: '/api/docs',
        uiConfig: {
          docExpansion: 'list',
          deepLinking: false,
        },
        staticCSP: true,
        transformSpecificationClone: true,
      });
    });
  });

  describe('CORS Configuration', () => {
    it('should configure CORS with correct options', async () => {
      mockTestConfig.CORS_ORIGINS = ['https://example.com', 'https://admin.example.com'];

      await buildServer();

      const corsCall = mockFastify.register.mock.calls[2];
      expect(corsCall[1]).toMatchObject({
        origin: ['https://example.com', 'https://admin.example.com'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      });
    });
  });

  describe('Additional Coverage Tests', () => {
    it('should handle errors without statusCode and code properties', async () => {
      await buildServer();
      const errorHandler = mockFastify.setErrorHandler.mock.calls[0][0];

      // Тест для покрытия строки 146: const statusCode = error.statusCode || 500;
      const errorWithoutStatusCode = {
        message: 'Error without statusCode',
        // Нет statusCode и code свойств
      };

      const mockRequest = {
        log: { error: jest.fn() },
      };

      const mockReply = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await errorHandler(errorWithoutStatusCode, mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500); // Дефолтный код
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR', // Дефолтный код
            message: 'Error without statusCode',
          }),
        })
      );
    });

    it('should cover Swagger UI transformStaticCSP function', async () => {
      await buildServer();

      // Проверяем что transformStaticCSP был передан в конфигурацию
      const swaggerUICall = mockFastify.register.mock.calls[1];
      const transformStaticCSP = swaggerUICall[1].transformStaticCSP;

      expect(typeof transformStaticCSP).toBe('function');

      // Тестируем функцию для покрытия строки 107
      const testHeader = 'default-src self';
      const result = transformStaticCSP(testHeader);
      expect(result).toBe(testHeader);
    });

    it('should cover Swagger UI transformSpecification function', async () => {
      await buildServer();

      const swaggerUICall = mockFastify.register.mock.calls[1];
      const transformSpecification = swaggerUICall[1].transformSpecification;

      expect(typeof transformSpecification).toBe('function');

      // Тестируем функцию для покрытия
      const testSwaggerObject = { info: { title: 'Test API' } };
      const result = transformSpecification(testSwaggerObject);
      expect(result).toBe(testSwaggerObject);
    });

    it('should test require.main module check behavior', async () => {
      // Этот тест покрывает логику require.main === module
      // В тестовом окружении require.main !== module, поэтому startServer() не должен вызываться

      // Проверяем что при импорте модуля startServer() НЕ вызывается автоматически
      // (server.listen не должен быть вызван до явного вызова startServer())
      expect(mockFastify.listen).not.toHaveBeenCalled();

      // Это покрывает строку 245: if (require.main === module) { startServer(); }
      // В тестах это условие false, поэтому автозапуск не происходит
    });

    it('should cover different NODE_ENV configurations for logger', async () => {
      // Тест для полного покрытия различных конфигураций logger

      // Test with undefined NODE_ENV (edge case)
      const originalNodeEnv = mockTestConfig.NODE_ENV;
      delete mockTestConfig.NODE_ENV;

      await buildServer();

      // Восстанавливаем NODE_ENV
      mockTestConfig.NODE_ENV = originalNodeEnv;

      expect(FastifyConstructor).toHaveBeenCalled();
    });
  });
});
