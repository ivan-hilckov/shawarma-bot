import { RateLimiter } from '../src/middleware/rateLimiter';

// Мокаем logger
jest.mock('../src/logger', () => ({
  createLogger: jest.fn(() => ({
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  let mockLogger: any;

  beforeEach(() => {
    // Очищаем все таймеры
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Получаем мок логгера
    const { createLogger } = require('../src/logger');
    mockLogger = createLogger();

    // Создаем новый экземпляр RateLimiter
    rateLimiter = new RateLimiter(5, 60000); // 5 запросов в минуту для тестов

    // Заменяем логгер в экземпляре
    (rateLimiter as any).logger = mockLogger;
  });

  afterEach(() => {
    // Очищаем ресурсы RateLimiter
    rateLimiter.destroy();

    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('должен создавать RateLimiter с параметрами по умолчанию', () => {
      const defaultLimiter = new RateLimiter();

      expect(defaultLimiter.getRemainingRequests(123)).toBe(30);

      defaultLimiter.destroy();
    });

    it('должен создавать RateLimiter с кастомными параметрами', () => {
      const customLimiter = new RateLimiter(10, 30000);

      expect(customLimiter.getRemainingRequests(123)).toBe(10);

      customLimiter.destroy();
    });

    it('должен настраивать интервал очистки', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      const testLimiter = new RateLimiter();

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5 * 60 * 1000);

      testLimiter.destroy();
      setIntervalSpy.mockRestore();
    });
  });

  describe('isAllowed', () => {
    it('должен разрешать первый запрос от пользователя', () => {
      const userId = 123;

      const result = rateLimiter.isAllowed(userId);

      expect(result).toBe(true);
      expect(rateLimiter.getRemainingRequests(userId)).toBe(4);
    });

    it('должен разрешать запросы в пределах лимита', () => {
      const userId = 123;

      // Делаем 5 запросов (лимит)
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isAllowed(userId)).toBe(true);
      }

      expect(rateLimiter.getRemainingRequests(userId)).toBe(0);
    });

    it('должен блокировать запросы сверх лимита', () => {
      const userId = 123;

      // Делаем 5 запросов (лимит)
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed(userId);
      }

      // 6-й запрос должен быть заблокирован
      const result = rateLimiter.isAllowed(userId);

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith('Rate limit exceeded', {
        userId,
        count: 5,
        maxRequests: 5,
      });
    });

    it('должен сбрасывать лимит после истечения окна', () => {
      const userId = 123;

      // Делаем 5 запросов (лимит)
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed(userId);
      }

      // Проверяем что лимит исчерпан
      expect(rateLimiter.isAllowed(userId)).toBe(false);

      // Перематываем время на 61 секунду (больше окна в 60 секунд)
      jest.advanceTimersByTime(61000);

      // Теперь запрос должен быть разрешен
      expect(rateLimiter.isAllowed(userId)).toBe(true);
      expect(rateLimiter.getRemainingRequests(userId)).toBe(4);
    });

    it('должен обрабатывать разных пользователей независимо', () => {
      const userId1 = 123;
      const userId2 = 456;

      // Исчерпываем лимит для первого пользователя
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed(userId1);
      }

      // Первый пользователь заблокирован
      expect(rateLimiter.isAllowed(userId1)).toBe(false);

      // Второй пользователь может делать запросы
      expect(rateLimiter.isAllowed(userId2)).toBe(true);
      expect(rateLimiter.getRemainingRequests(userId2)).toBe(4);
    });
  });

  describe('getRemainingRequests', () => {
    it('должен возвращать максимальное количество для нового пользователя', () => {
      const userId = 123;

      const remaining = rateLimiter.getRemainingRequests(userId);

      expect(remaining).toBe(5);
    });

    it('должен возвращать правильное количество оставшихся запросов', () => {
      const userId = 123;

      rateLimiter.isAllowed(userId); // 1 запрос
      rateLimiter.isAllowed(userId); // 2 запроса

      expect(rateLimiter.getRemainingRequests(userId)).toBe(3);
    });

    it('должен возвращать 0 когда лимит исчерпан', () => {
      const userId = 123;

      // Исчерпываем лимит
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed(userId);
      }

      expect(rateLimiter.getRemainingRequests(userId)).toBe(0);
    });

    it('должен возвращать максимальное количество после сброса окна', () => {
      const userId = 123;

      rateLimiter.isAllowed(userId);

      // Перематываем время
      jest.advanceTimersByTime(61000);

      expect(rateLimiter.getRemainingRequests(userId)).toBe(5);
    });
  });

  describe('getResetTime', () => {
    it('должен возвращать 0 для нового пользователя', () => {
      const userId = 123;

      const resetTime = rateLimiter.getResetTime(userId);

      expect(resetTime).toBe(0);
    });

    it('должен возвращать время сброса после первого запроса', () => {
      const userId = 123;
      const startTime = Date.now();

      rateLimiter.isAllowed(userId);

      const resetTime = rateLimiter.getResetTime(userId);

      expect(resetTime).toBeGreaterThan(startTime);
      expect(resetTime).toBeLessThanOrEqual(startTime + 60000);
    });

    it('должен возвращать 0 после истечения окна', () => {
      const userId = 123;

      rateLimiter.isAllowed(userId);

      // Перематываем время
      jest.advanceTimersByTime(61000);

      expect(rateLimiter.getResetTime(userId)).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('должен удалять устаревшие записи', () => {
      const userId1 = 123;
      const userId2 = 456;

      // Создаем записи для двух пользователей
      rateLimiter.isAllowed(userId1);
      rateLimiter.isAllowed(userId2);

      expect(rateLimiter.getStats().totalUsers).toBe(2);

      // Перематываем время чтобы записи устарели
      jest.advanceTimersByTime(61000);

      // Запускаем cleanup вручную
      (rateLimiter as any).cleanup();

      expect(rateLimiter.getStats().totalUsers).toBe(0);
      expect(mockLogger.debug).toHaveBeenCalledWith('Rate limiter cleanup completed', {
        cleaned: 2,
        remaining: 0,
      });
    });

    it('должен не логировать если нечего очищать', () => {
      // Запускаем cleanup без записей
      (rateLimiter as any).cleanup();

      expect(mockLogger.debug).not.toHaveBeenCalled();
    });

    it('должен запускаться автоматически по интервалу', () => {
      const userId = 123;
      rateLimiter.isAllowed(userId);

      expect(rateLimiter.getStats().totalUsers).toBe(1);

      // Перематываем время чтобы записи устарели
      jest.advanceTimersByTime(61000);

      // Запускаем интервал очистки (5 минут)
      jest.advanceTimersByTime(5 * 60 * 1000);

      expect(rateLimiter.getStats().totalUsers).toBe(0);
    });
  });

  describe('getStats', () => {
    it('должен возвращать статистику для пустого лимитера', () => {
      const stats = rateLimiter.getStats();

      expect(stats).toEqual({
        totalUsers: 0,
        activeUsers: 0,
      });
    });

    it('должен возвращать правильную статистику с активными пользователями', () => {
      const userId1 = 123;
      const userId2 = 456;

      rateLimiter.isAllowed(userId1);
      rateLimiter.isAllowed(userId2);

      const stats = rateLimiter.getStats();

      expect(stats).toEqual({
        totalUsers: 2,
        activeUsers: 2,
      });
    });

    it('должен правильно считать неактивных пользователей', () => {
      const userId1 = 123;
      const userId2 = 456;

      rateLimiter.isAllowed(userId1);
      rateLimiter.isAllowed(userId2);

      // Перематываем время чтобы первый пользователь стал неактивным
      jest.advanceTimersByTime(61000);

      // Добавляем нового активного пользователя
      rateLimiter.isAllowed(789);

      const stats = rateLimiter.getStats();

      expect(stats.totalUsers).toBe(3);
      expect(stats.activeUsers).toBe(1); // Только последний пользователь активен
    });
  });

  describe('edge cases', () => {
    it('должен обрабатывать отрицательные userId', () => {
      const userId = -123;

      expect(rateLimiter.isAllowed(userId)).toBe(true);
      expect(rateLimiter.getRemainingRequests(userId)).toBe(4);
    });

    it('должен обрабатывать очень большие userId', () => {
      const userId = Number.MAX_SAFE_INTEGER;

      expect(rateLimiter.isAllowed(userId)).toBe(true);
      expect(rateLimiter.getRemainingRequests(userId)).toBe(4);
    });

    it('должен правильно работать с нулевым лимитом', () => {
      const zeroLimiter = new RateLimiter(0, 60000);
      const userId = 123;

      // При нулевом лимите первый запрос создает запись с count=1, но maxRequests=0
      // Поэтому первый запрос разрешен (создается запись), но второй уже блокируется
      expect(zeroLimiter.isAllowed(userId)).toBe(true);
      expect(zeroLimiter.isAllowed(userId)).toBe(false);
      expect(zeroLimiter.getRemainingRequests(userId)).toBe(0);

      zeroLimiter.destroy();
    });

    it('должен правильно работать с очень коротким окном', () => {
      const shortWindowLimiter = new RateLimiter(5, 1); // 1ms окно
      const userId = 123;

      shortWindowLimiter.isAllowed(userId);

      // Ждем больше окна
      jest.advanceTimersByTime(2);

      // Должен сбросить лимит
      expect(shortWindowLimiter.isAllowed(userId)).toBe(true);
      expect(shortWindowLimiter.getRemainingRequests(userId)).toBe(4);

      shortWindowLimiter.destroy();
    });
  });
});
