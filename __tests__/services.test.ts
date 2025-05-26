import { ServiceRegistry, ServiceContainer } from '../src/services';
import { BotInstance } from '../src/types';
import { DatabaseService } from '../src/database';
import { CartService } from '../src/cart';
import NotificationService from '../src/notifications';

// Мокаем зависимости
jest.mock('../src/database');
jest.mock('../src/cart');
jest.mock('../src/notifications');
jest.mock('../src/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('ServiceRegistry', () => {
  let serviceRegistry: ServiceRegistry;
  let mockBot: jest.Mocked<BotInstance>;
  let mockDatabase: jest.Mocked<DatabaseService>;
  let mockCart: jest.Mocked<CartService>;
  let mockNotifications: jest.Mocked<NotificationService>;
  let mockLogger: any;

  beforeEach(() => {
    serviceRegistry = new ServiceRegistry();

    // Создаем моки сервисов
    mockBot = {
      sendMessage: jest.fn(),
      editMessageText: jest.fn(),
      answerCallbackQuery: jest.fn(),
    } as any;

    mockDatabase = {
      getClient: jest.fn(),
      disconnect: jest.fn(),
      upsertUser: jest.fn(),
      getMenuItemById: jest.fn(),
      createOrder: jest.fn(),
      getOrderById: jest.fn(),
      getUserOrders: jest.fn(),
      updateOrderStatus: jest.fn(),
      getOrdersStats: jest.fn(),
      testConnection: jest.fn(),
    } as any;

    mockCart = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      addToCart: jest.fn(),
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
      getCart: jest.fn(),
      clearCart: jest.fn(),
      getCartTotal: jest.fn(),
      getCartItemsCount: jest.fn(),
      getActiveCartsCount: jest.fn(),
    } as any;

    mockNotifications = {
      notifyNewOrder: jest.fn(),
      notifyStatusChange: jest.fn(),
      isAdmin: jest.fn(),
      isConfigured: jest.fn(),
      getStatus: jest.fn(),
    } as any;

    const { createLogger } = require('../src/logger');
    mockLogger = createLogger();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('должен регистрировать сервис bot', () => {
      serviceRegistry.register('bot', mockBot);

      const registeredBot = serviceRegistry.get('bot');
      expect(registeredBot).toBe(mockBot);
    });

    it('должен регистрировать сервис database', () => {
      serviceRegistry.register('database', mockDatabase);

      const registeredDatabase = serviceRegistry.get('database');
      expect(registeredDatabase).toBe(mockDatabase);
    });

    it('должен регистрировать сервис cart', () => {
      serviceRegistry.register('cart', mockCart);

      const registeredCart = serviceRegistry.get('cart');
      expect(registeredCart).toBe(mockCart);
    });

    it('должен регистрировать сервис notifications', () => {
      serviceRegistry.register('notifications', mockNotifications);

      const registeredNotifications = serviceRegistry.get('notifications');
      expect(registeredNotifications).toBe(mockNotifications);
    });

    it('должен регистрировать сервис logger', () => {
      serviceRegistry.register('logger', mockLogger);

      const registeredLogger = serviceRegistry.get('logger');
      expect(registeredLogger).toBe(mockLogger);
    });

    it('должен перезаписывать существующий сервис', () => {
      const firstBot = mockBot;
      const secondBot = { ...mockBot } as any;

      serviceRegistry.register('bot', firstBot);
      serviceRegistry.register('bot', secondBot);

      const registeredBot = serviceRegistry.get('bot');
      expect(registeredBot).toBe(secondBot);
      expect(registeredBot).not.toBe(firstBot);
    });
  });

  describe('get', () => {
    it('должен возвращать зарегистрированный сервис', () => {
      serviceRegistry.register('bot', mockBot);

      const result = serviceRegistry.get('bot');
      expect(result).toBe(mockBot);
    });

    it('должен выбрасывать ошибку для незарегистрированного сервиса', () => {
      expect(() => {
        serviceRegistry.get('bot');
      }).toThrow('Service bot not registered');
    });

    it('должен выбрасывать ошибку с правильным именем сервиса', () => {
      expect(() => {
        serviceRegistry.get('database');
      }).toThrow('Service database not registered');

      expect(() => {
        serviceRegistry.get('cart');
      }).toThrow('Service cart not registered');

      expect(() => {
        serviceRegistry.get('notifications');
      }).toThrow('Service notifications not registered');

      expect(() => {
        serviceRegistry.get('logger');
      }).toThrow('Service logger not registered');
    });
  });

  describe('getAll', () => {
    it('должен возвращать пустой объект если сервисы не зарегистрированы', () => {
      const result = serviceRegistry.getAll();
      expect(result).toEqual({});
    });

    it('должен возвращать все зарегистрированные сервисы', () => {
      serviceRegistry.register('bot', mockBot);
      serviceRegistry.register('database', mockDatabase);
      serviceRegistry.register('cart', mockCart);
      serviceRegistry.register('notifications', mockNotifications);
      serviceRegistry.register('logger', mockLogger);

      const result = serviceRegistry.getAll();

      expect(result).toEqual({
        bot: mockBot,
        database: mockDatabase,
        cart: mockCart,
        notifications: mockNotifications,
        logger: mockLogger,
      });
    });

    it('должен возвращать частично заполненный контейнер', () => {
      serviceRegistry.register('bot', mockBot);
      serviceRegistry.register('database', mockDatabase);

      const result = serviceRegistry.getAll();

      expect(result).toEqual({
        bot: mockBot,
        database: mockDatabase,
      });
    });

    it('должен возвращать актуальное состояние после изменений', () => {
      serviceRegistry.register('bot', mockBot);

      let result = serviceRegistry.getAll();
      expect(result).toEqual({ bot: mockBot });

      serviceRegistry.register('database', mockDatabase);

      result = serviceRegistry.getAll();
      expect(result).toEqual({
        bot: mockBot,
        database: mockDatabase,
      });
    });
  });

  describe('integration scenarios', () => {
    it('должен поддерживать полный жизненный цикл сервисов', () => {
      // Регистрируем все сервисы
      serviceRegistry.register('bot', mockBot);
      serviceRegistry.register('database', mockDatabase);
      serviceRegistry.register('cart', mockCart);
      serviceRegistry.register('notifications', mockNotifications);
      serviceRegistry.register('logger', mockLogger);

      // Проверяем что все сервисы доступны
      expect(serviceRegistry.get('bot')).toBe(mockBot);
      expect(serviceRegistry.get('database')).toBe(mockDatabase);
      expect(serviceRegistry.get('cart')).toBe(mockCart);
      expect(serviceRegistry.get('notifications')).toBe(mockNotifications);
      expect(serviceRegistry.get('logger')).toBe(mockLogger);

      // Проверяем getAll
      const allServices = serviceRegistry.getAll();
      expect(Object.keys(allServices)).toHaveLength(5);
    });

    it('должен работать с частичной регистрацией сервисов', () => {
      // Регистрируем только критические сервисы
      serviceRegistry.register('bot', mockBot);
      serviceRegistry.register('database', mockDatabase);

      expect(serviceRegistry.get('bot')).toBe(mockBot);
      expect(serviceRegistry.get('database')).toBe(mockDatabase);

      // Остальные сервисы должны выбрасывать ошибки
      expect(() => serviceRegistry.get('cart')).toThrow();
      expect(() => serviceRegistry.get('notifications')).toThrow();
      expect(() => serviceRegistry.get('logger')).toThrow();
    });

    it('должен поддерживать замену сервисов во время выполнения', () => {
      const originalBot = mockBot;
      const newBot = { ...mockBot, newProperty: 'test' } as any;

      serviceRegistry.register('bot', originalBot);
      expect(serviceRegistry.get('bot')).toBe(originalBot);

      // Заменяем сервис
      serviceRegistry.register('bot', newBot);
      expect(serviceRegistry.get('bot')).toBe(newBot);
      expect(serviceRegistry.get('bot')).not.toBe(originalBot);
    });
  });

  describe('type safety', () => {
    it('должен обеспечивать типобезопасность для bot', () => {
      serviceRegistry.register('bot', mockBot);
      const bot = serviceRegistry.get('bot');

      // TypeScript должен знать что это BotInstance
      expect(typeof bot.sendMessage).toBe('function');
      expect(typeof bot.editMessageText).toBe('function');
      expect(typeof bot.answerCallbackQuery).toBe('function');
    });

    it('должен обеспечивать типобезопасность для database', () => {
      serviceRegistry.register('database', mockDatabase);
      const database = serviceRegistry.get('database');

      // TypeScript должен знать что это DatabaseService
      expect(typeof database.getClient).toBe('function');
      expect(typeof database.createOrder).toBe('function');
      expect(typeof database.getUserOrders).toBe('function');
    });

    it('должен обеспечивать типобезопасность для cart', () => {
      serviceRegistry.register('cart', mockCart);
      const cart = serviceRegistry.get('cart');

      // TypeScript должен знать что это CartService
      expect(typeof cart.addToCart).toBe('function');
      expect(typeof cart.getCart).toBe('function');
      expect(typeof cart.clearCart).toBe('function');
    });
  });

  describe('error handling', () => {
    it('должен обрабатывать null/undefined сервисы', () => {
      expect(() => {
        serviceRegistry.register('bot', null as any);
      }).not.toThrow();

      expect(() => {
        serviceRegistry.register('bot', undefined as any);
      }).not.toThrow();

      // Но get должен выбрасывать ошибку для null/undefined
      expect(() => {
        serviceRegistry.get('bot');
      }).toThrow('Service bot not registered');
    });

    it('должен правильно обрабатывать повторные вызовы get', () => {
      serviceRegistry.register('bot', mockBot);

      const bot1 = serviceRegistry.get('bot');
      const bot2 = serviceRegistry.get('bot');

      expect(bot1).toBe(bot2);
      expect(bot1).toBe(mockBot);
    });
  });
});
