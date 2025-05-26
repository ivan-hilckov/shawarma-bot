import Logger, { LogLevel, createLogger } from '../src/logger';

// Мокаем console методы
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation();
const mockConsoleDebug = jest.spyOn(console, 'debug').mockImplementation();

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleInfo.mockRestore();
    mockConsoleDebug.mockRestore();
  });

  describe('LogLevel enum', () => {
    it('should have correct values', () => {
      expect(LogLevel.ERROR).toBe(0);
      expect(LogLevel.WARN).toBe(1);
      expect(LogLevel.INFO).toBe(2);
      expect(LogLevel.DEBUG).toBe(3);
    });
  });

  describe('Logger class', () => {
    it('should create logger with default context', () => {
      const logger = new Logger();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create logger with custom context', () => {
      const logger = new Logger('TestContext');
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should log error messages', () => {
      const logger = new Logger('Test');
      logger.error('Test error message');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('ERROR [Test] Test error message')
      );
    });

    it('should log warn messages', () => {
      const logger = new Logger('Test');
      logger.warn('Test warn message');

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('WARN [Test] Test warn message')
      );
    });

    it('should log info messages', () => {
      const logger = new Logger('Test');
      logger.info('Test info message');

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('INFO [Test] Test info message')
      );
    });

    it('should log debug messages', () => {
      const logger = new Logger('Test');
      logger.debug('Test debug message');

      expect(mockConsoleDebug).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG [Test] Test debug message')
      );
    });

    it('should include metadata in log messages', () => {
      const logger = new Logger('Test');
      const metadata = { userId: 123, action: 'test' };

      logger.info('Test message with metadata', metadata);

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(metadata))
      );
    });

    it('should create child logger with extended context', () => {
      const parentLogger = new Logger('Parent');
      const childLogger = parentLogger.child('Child');

      childLogger.info('Child message');

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('[Parent:Child]')
      );
    });

    it('should respect log level filtering', () => {
      // В тестовой среде уровень DEBUG, поэтому все сообщения должны проходить
      const logger = new Logger('Test');

      logger.error('Error message');
      logger.warn('Warn message');
      logger.info('Info message');
      logger.debug('Debug message');

      expect(mockConsoleError).toHaveBeenCalled();
      expect(mockConsoleWarn).toHaveBeenCalled();
      expect(mockConsoleInfo).toHaveBeenCalled();
      expect(mockConsoleDebug).toHaveBeenCalled();
    });
  });

  describe('createLogger function', () => {
    it('should create logger with specified context', () => {
      const logger = createLogger('TestContext');
      expect(logger).toBeInstanceOf(Logger);

      logger.info('Test message');
      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('[TestContext]')
      );
    });
  });

  describe('Log message formatting', () => {
        it('should include timestamp in ISO format', () => {
      const logger = new Logger('Test');
      logger.info('Test message');

      const logCall = mockConsoleInfo.mock.calls[0]?.[0];
      expect(logCall).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });

    it('should include log level in message', () => {
      const logger = new Logger('Test');
      logger.error('Error message');
      logger.warn('Warn message');
      logger.info('Info message');
      logger.debug('Debug message');

      expect(mockConsoleError.mock.calls[0]?.[0]).toContain('ERROR');
      expect(mockConsoleWarn.mock.calls[0]?.[0]).toContain('WARN');
      expect(mockConsoleInfo.mock.calls[0]?.[0]).toContain('INFO');
      expect(mockConsoleDebug.mock.calls[0]?.[0]).toContain('DEBUG');
    });

    it('should include context in brackets', () => {
      const logger = new Logger('MyContext');
      logger.info('Test message');

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('[MyContext]')
      );
    });
  });
});
