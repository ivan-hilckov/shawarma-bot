// Отключаем глобальный мок из setupJest.ts
jest.unmock('../../src/logger');

describe('Logger', () => {
  let Logger: any;
  let LogLevel: any;
  let createLogger: any;

  // Моки для console методов
  let originalConsoleError: any;
  let originalConsoleWarn: any;
  let originalConsoleInfo: any;
  let originalConsoleDebug: any;

  let mockConsoleError: jest.Mock;
  let mockConsoleWarn: jest.Mock;
  let mockConsoleInfo: jest.Mock;
  let mockConsoleDebug: jest.Mock;

  beforeAll(async () => {
    // Сохраняем оригинальные console методы
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    originalConsoleInfo = console.info;
    originalConsoleDebug = console.debug;

    // Создаем моки
    mockConsoleError = jest.fn();
    mockConsoleWarn = jest.fn();
    mockConsoleInfo = jest.fn();
    mockConsoleDebug = jest.fn();

    // Заменяем console методы на моки
    console.error = mockConsoleError;
    console.warn = mockConsoleWarn;
    console.info = mockConsoleInfo;
    console.debug = mockConsoleDebug;

    // Импортируем модуль после настройки моков
    const module = await import('../../src/logger');
    Logger = module.default;
    LogLevel = module.LogLevel;
    createLogger = module.createLogger;
  });

  afterAll(() => {
    // Восстанавливаем оригинальные console методы
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
    console.debug = originalConsoleDebug;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
  });

  describe('LogLevel enum', () => {
    it('should have correct numeric values', () => {
      expect(LogLevel.ERROR).toBe(0);
      expect(LogLevel.WARN).toBe(1);
      expect(LogLevel.INFO).toBe(2);
      expect(LogLevel.DEBUG).toBe(3);
    });

    it('should be accessible by string keys', () => {
      expect(LogLevel['ERROR']).toBe(0);
      expect(LogLevel['WARN']).toBe(1);
      expect(LogLevel['INFO']).toBe(2);
      expect(LogLevel['DEBUG']).toBe(3);
    });
  });

  describe('Logger constructor', () => {
    it('should create logger with default context and DEBUG level in development', () => {
      const logger = new Logger();

      logger.debug('test message');

      expect(mockConsoleDebug).toHaveBeenCalledWith(
        expect.stringMatching(/DEBUG \[App\] test message/)
      );
    });

    it('should create logger with custom context', () => {
      const logger = new Logger('TestService');

      logger.info('test message');

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringMatching(/INFO \[TestService\] test message/)
      );
    });

    it('should use INFO level in production mode', () => {
      process.env.NODE_ENV = 'production';

      const logger = new Logger('TestService');

      // DEBUG should be filtered out
      logger.debug('debug message');
      expect(mockConsoleDebug).not.toHaveBeenCalled();

      // INFO should be logged
      logger.info('info message');
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringMatching(/INFO \[TestService\] info message/)
      );
    });

    it('should accept custom log level', () => {
      const logger = new Logger('TestService', LogLevel.WARN);

      // DEBUG and INFO should be filtered out
      logger.debug('debug message');
      logger.info('info message');
      expect(mockConsoleDebug).not.toHaveBeenCalled();
      expect(mockConsoleInfo).not.toHaveBeenCalled();

      // WARN should be logged
      logger.warn('warn message');
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringMatching(/WARN \[TestService\] warn message/)
      );
    });
  });

  describe('Logging methods', () => {
    let logger: any;

    beforeEach(() => {
      logger = new Logger('TestLogger', LogLevel.DEBUG);
    });

    describe('error method', () => {
      it('should log error messages', () => {
        logger.error('error message');

        expect(mockConsoleError).toHaveBeenCalledWith(
          expect.stringMatching(/ERROR \[TestLogger\] error message/)
        );
      });

      it('should log error with metadata', () => {
        const metadata = { userId: 123, action: 'login' };
        logger.error('error message', metadata);

        expect(mockConsoleError).toHaveBeenCalledWith(
          expect.stringMatching(
            /ERROR \[TestLogger\] error message {"userId":123,"action":"login"}/
          )
        );
      });

      it('should always log errors regardless of log level', () => {
        const errorLogger = new Logger('ErrorLogger', LogLevel.ERROR);
        errorLogger.error('critical error');

        expect(mockConsoleError).toHaveBeenCalled();
      });
    });

    describe('warn method', () => {
      it('should log warning messages', () => {
        logger.warn('warning message');

        expect(mockConsoleWarn).toHaveBeenCalledWith(
          expect.stringMatching(/WARN \[TestLogger\] warning message/)
        );
      });

      it('should log warning with metadata', () => {
        const metadata = { threshold: 90, current: 95 };
        logger.warn('high usage warning', metadata);

        expect(mockConsoleWarn).toHaveBeenCalledWith(
          expect.stringMatching(
            /WARN \[TestLogger\] high usage warning {"threshold":90,"current":95}/
          )
        );
      });

      it('should be filtered out when log level is ERROR', () => {
        const errorLogger = new Logger('ErrorLogger', LogLevel.ERROR);
        errorLogger.warn('filtered warning');

        expect(mockConsoleWarn).not.toHaveBeenCalled();
      });
    });

    describe('info method', () => {
      it('should log info messages', () => {
        logger.info('info message');

        expect(mockConsoleInfo).toHaveBeenCalledWith(
          expect.stringMatching(/INFO \[TestLogger\] info message/)
        );
      });

      it('should log info with metadata', () => {
        const metadata = { requestId: 'req-123', duration: 150 };
        logger.info('request completed', metadata);

        expect(mockConsoleInfo).toHaveBeenCalledWith(
          expect.stringMatching(
            /INFO \[TestLogger\] request completed {"requestId":"req-123","duration":150}/
          )
        );
      });

      it('should be filtered out when log level is WARN', () => {
        const warnLogger = new Logger('WarnLogger', LogLevel.WARN);
        warnLogger.info('filtered info');

        expect(mockConsoleInfo).not.toHaveBeenCalled();
      });
    });

    describe('debug method', () => {
      it('should log debug messages', () => {
        logger.debug('debug message');

        expect(mockConsoleDebug).toHaveBeenCalledWith(
          expect.stringMatching(/DEBUG \[TestLogger\] debug message/)
        );
      });

      it('should log debug with metadata', () => {
        const metadata = { step: 'validation', data: { id: 1 } };
        logger.debug('processing step', metadata);

        expect(mockConsoleDebug).toHaveBeenCalledWith(
          expect.stringMatching(
            /DEBUG \[TestLogger\] processing step {"step":"validation","data":{"id":1}}/
          )
        );
      });

      it('should be filtered out when log level is INFO', () => {
        const infoLogger = new Logger('InfoLogger', LogLevel.INFO);
        infoLogger.debug('filtered debug');

        expect(mockConsoleDebug).not.toHaveBeenCalled();
      });
    });
  });

  describe('Log level filtering', () => {
    it('should respect ERROR level filtering', () => {
      const logger = new Logger('ErrorLogger', LogLevel.ERROR);

      logger.error('error'); // Should log
      logger.warn('warn'); // Should NOT log
      logger.info('info'); // Should NOT log
      logger.debug('debug'); // Should NOT log

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(mockConsoleWarn).not.toHaveBeenCalled();
      expect(mockConsoleInfo).not.toHaveBeenCalled();
      expect(mockConsoleDebug).not.toHaveBeenCalled();
    });

    it('should respect WARN level filtering', () => {
      const logger = new Logger('WarnLogger', LogLevel.WARN);

      logger.error('error'); // Should log
      logger.warn('warn'); // Should log
      logger.info('info'); // Should NOT log
      logger.debug('debug'); // Should NOT log

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
      expect(mockConsoleInfo).not.toHaveBeenCalled();
      expect(mockConsoleDebug).not.toHaveBeenCalled();
    });

    it('should respect INFO level filtering', () => {
      const logger = new Logger('InfoLogger', LogLevel.INFO);

      logger.error('error'); // Should log
      logger.warn('warn'); // Should log
      logger.info('info'); // Should log
      logger.debug('debug'); // Should NOT log

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
      expect(mockConsoleInfo).toHaveBeenCalledTimes(1);
      expect(mockConsoleDebug).not.toHaveBeenCalled();
    });

    it('should respect DEBUG level filtering', () => {
      const logger = new Logger('DebugLogger', LogLevel.DEBUG);

      logger.error('error'); // Should log
      logger.warn('warn'); // Should log
      logger.info('info'); // Should log
      logger.debug('debug'); // Should log

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
      expect(mockConsoleInfo).toHaveBeenCalledTimes(1);
      expect(mockConsoleDebug).toHaveBeenCalledTimes(1);
    });
  });

  describe('Message formatting', () => {
    let logger: any;

    beforeEach(() => {
      logger = new Logger('FormatLogger', LogLevel.DEBUG);
    });

    it('should format timestamp correctly', () => {
      const beforeTime = new Date().getTime();
      logger.info('test message');
      const afterTime = new Date().getTime();

      const loggedMessage = mockConsoleInfo.mock.calls[0][0];
      const timestampMatch = loggedMessage.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);

      expect(timestampMatch).toBeTruthy();

      const loggedTime = new Date(timestampMatch[1]).getTime();
      expect(loggedTime).toBeGreaterThanOrEqual(beforeTime);
      expect(loggedTime).toBeLessThanOrEqual(afterTime);
    });

    it('should include level name in message', () => {
      logger.error('error message');
      logger.warn('warn message');
      logger.info('info message');
      logger.debug('debug message');

      expect(mockConsoleError.mock.calls[0][0]).toMatch(/ERROR/);
      expect(mockConsoleWarn.mock.calls[0][0]).toMatch(/WARN/);
      expect(mockConsoleInfo.mock.calls[0][0]).toMatch(/INFO/);
      expect(mockConsoleDebug.mock.calls[0][0]).toMatch(/DEBUG/);
    });

    it('should include context in brackets', () => {
      const customLogger = new Logger('CustomContext', LogLevel.DEBUG);
      customLogger.info('test message');

      expect(mockConsoleInfo.mock.calls[0][0]).toMatch(/\[CustomContext\]/);
    });

    it('should handle empty context', () => {
      const emptyLogger = new Logger('', LogLevel.DEBUG);
      emptyLogger.info('test message');

      const message = mockConsoleInfo.mock.calls[0][0];
      expect(message).toMatch(/INFO {2}test message/);
    });

    it('should append metadata as JSON', () => {
      const metadata = { key1: 'value1', key2: 42, key3: { nested: true } };
      logger.info('test message', metadata);

      const message = mockConsoleInfo.mock.calls[0][0];
      expect(message).toMatch(/test message {"key1":"value1","key2":42,"key3":{"nested":true}}/);
    });

    it('should handle undefined metadata gracefully', () => {
      logger.info('test message', undefined);

      const message = mockConsoleInfo.mock.calls[0][0];
      expect(message).toMatch(/INFO \[FormatLogger\] test message$/);
      expect(message).not.toMatch(/undefined/);
    });

    it('should handle null metadata gracefully', () => {
      logger.info('test message', null);

      const message = mockConsoleInfo.mock.calls[0][0];
      expect(message).toMatch(/INFO \[FormatLogger\] test message$/);
      expect(message).not.toMatch(/null/);
    });
  });

  describe('child method', () => {
    it('should create child logger with extended context', () => {
      const parentLogger = new Logger('Parent', LogLevel.DEBUG);
      const childLogger = parentLogger.child('Child');

      childLogger.info('child message');

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringMatching(/INFO \[Parent:Child\] child message/)
      );
    });

    it('should preserve parent log level in child', () => {
      const parentLogger = new Logger('Parent', LogLevel.WARN);
      const childLogger = parentLogger.child('Child');

      // DEBUG should be filtered out (parent level is WARN)
      childLogger.debug('debug message');
      expect(mockConsoleDebug).not.toHaveBeenCalled();

      // WARN should be logged
      childLogger.warn('warn message');
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringMatching(/WARN \[Parent:Child\] warn message/)
      );
    });

    it('should allow multiple levels of nesting', () => {
      const parentLogger = new Logger('Parent', LogLevel.DEBUG);
      const childLogger = parentLogger.child('Child');
      const grandChildLogger = childLogger.child('GrandChild');

      grandChildLogger.info('nested message');

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringMatching(/INFO \[Parent:Child:GrandChild\] nested message/)
      );
    });

    it('should create independent child loggers', () => {
      const parentLogger = new Logger('Parent', LogLevel.DEBUG);
      const child1 = parentLogger.child('Child1');
      const child2 = parentLogger.child('Child2');

      child1.info('message from child1');
      child2.info('message from child2');

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringMatching(/INFO \[Parent:Child1\] message from child1/)
      );
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringMatching(/INFO \[Parent:Child2\] message from child2/)
      );
    });
  });

  describe('createLogger function', () => {
    it('should create logger with specified context', () => {
      const logger = createLogger('TestService');

      logger.info('test message');

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringMatching(/INFO \[TestService\] test message/)
      );
    });

    it('should use default log level based on NODE_ENV', () => {
      process.env.NODE_ENV = 'production';

      const logger = createLogger('ProdService');

      // DEBUG should be filtered out in production
      logger.debug('debug message');
      expect(mockConsoleDebug).not.toHaveBeenCalled();

      // INFO should be logged in production
      logger.info('info message');
      expect(mockConsoleInfo).toHaveBeenCalled();
    });

    it('should work with development environment', () => {
      process.env.NODE_ENV = 'development';

      const logger = createLogger('DevService');

      // DEBUG should be logged in development
      logger.debug('debug message');
      expect(mockConsoleDebug).toHaveBeenCalledWith(
        expect.stringMatching(/DEBUG \[DevService\] debug message/)
      );
    });

    it('should handle missing NODE_ENV (default to DEBUG)', () => {
      delete process.env.NODE_ENV;

      const logger = createLogger('DefaultService');

      // DEBUG should be logged when NODE_ENV is not set
      logger.debug('debug message');
      expect(mockConsoleDebug).toHaveBeenCalledWith(
        expect.stringMatching(/DEBUG \[DefaultService\] debug message/)
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle very long messages', () => {
      const logger = new Logger('EdgeCase', LogLevel.DEBUG);
      const longMessage = 'x'.repeat(1000);

      logger.info(longMessage);

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`INFO \\[EdgeCase\\] ${longMessage}`))
      );
    });

    it('should handle special characters in messages', () => {
      const logger = new Logger('EdgeCase', LogLevel.DEBUG);
      const specialMessage = 'Message with "quotes", newlines\n, tabs\t, and unicode: 🌯';

      logger.info(specialMessage);

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringMatching(/INFO \[EdgeCase\] Message with "quotes"/)
      );
    });

    it('should handle complex metadata objects', () => {
      const logger = new Logger('EdgeCase', LogLevel.DEBUG);
      const complexMetadata = {
        array: [1, 2, 3],
        object: { nested: { deep: 'value' } },
        null: null,
        undefined: undefined,
        boolean: true,
        number: 42.5,
        date: new Date('2025-01-01'),
      };

      logger.info('complex metadata', complexMetadata);

      const message = mockConsoleInfo.mock.calls[0][0];
      expect(message).toMatch(/INFO \[EdgeCase\] complex metadata/);
      expect(message).toMatch(/"array":\[1,2,3\]/);
      expect(message).toMatch(/"nested":{"deep":"value"}/);
      expect(message).toMatch(/"boolean":true/);
      expect(message).toMatch(/"number":42.5/);
    });

    it('should handle circular references in metadata gracefully', () => {
      const logger = new Logger('EdgeCase', LogLevel.DEBUG);
      const circularObject: any = { name: 'test' };
      circularObject.self = circularObject;

      // Should not throw error
      expect(() => {
        logger.info('circular metadata', circularObject);
      }).not.toThrow();

      expect(mockConsoleInfo).toHaveBeenCalled();

      // Should log the circular reference message
      const message = mockConsoleInfo.mock.calls[0][0];
      expect(message).toMatch(
        /INFO \[EdgeCase\] circular metadata \[Circular or invalid JSON object\]/
      );
    });
  });
});
