// Комплексные тесты для bot.ts - покрытие всех областей
// Следуя стратегии MOCKING_STRATEGY.md - используем локальные моки

// Отключаем глобальные моки для изолированного тестирования
jest.unmock('../../src/bot');

// === ЛОКАЛЬНЫЕ МОКИ ===

// Mock TelegramBot с полным API
const mockBot = {
  onText: jest.fn(),
  on: jest.fn(),
  getMe: jest.fn(),
  stopPolling: jest.fn(),
  sendMessage: jest.fn().mockResolvedValue(true),
  answerCallbackQuery: jest.fn().mockResolvedValue(true),
};

// Mock TelegramBot constructor
const TelegramBotConstructor = jest.fn(() => mockBot);
jest.mock('node-telegram-bot-api', () => TelegramBotConstructor);

// Mock config с различными сценариями
let mockConfig = {
  BOT_TOKEN: 'valid_bot_token',
  DATABASE_URL: 'postgresql://user:pass@postgres:5432/testdb',
};

jest.mock('../../src/config', () => mockConfig);

// Mock всех handlers
const mockHandlers = {
  handleStart: jest.fn(),
  handleShawarmaMenu: jest.fn(),
  handleDrinksMenu: jest.fn(),
  handleAbout: jest.fn(),
  handleProfile: jest.fn(),
  handleItemSelection: jest.fn(),
  handleBackToMenu: jest.fn(),
  handleBackToProfile: jest.fn(),
  handleBackToShawarma: jest.fn(),
  handleBackToDrinks: jest.fn(),
  handleAddToCart: jest.fn(),
  handleViewCart: jest.fn(),
  handleIncreaseQuantity: jest.fn(),
  handleDecreaseQuantity: jest.fn(),
  handleRemoveFromCart: jest.fn(),
  handleClearCart: jest.fn(),
  handleCheckout: jest.fn(),
  handleMyOrders: jest.fn(),
  handleAdminOrderAction: jest.fn(),
  handleAboutMiniApp: jest.fn(),
  handleBackToStart: jest.fn(),
  handleIncreaseFromItem: jest.fn(),
  handleDecreaseFromItem: jest.fn(),
  getItemQuantityInCart: jest.fn().mockResolvedValue(2),
};

jest.mock('../../src/handlers', () => mockHandlers);

// Mock menu
const mockMenu = {
  getItemById: jest.fn().mockReturnValue({
    id: '1',
    name: 'Test Item',
    price: 100,
  }),
};

jest.mock('../../src/menu', () => mockMenu);

// Mock NotificationService
const mockNotificationService = {
  getStatus: jest.fn().mockReturnValue('Notification service ready'),
};

const NotificationServiceConstructor = jest.fn(() => mockNotificationService);
jest.mock('../../src/notifications', () => NotificationServiceConstructor);

// Mock serviceRegistry
const mockServiceRegistry = {
  register: jest.fn(),
};

jest.mock('../../src/services', () => ({
  serviceRegistry: mockServiceRegistry,
}));

// Mock других сервисов
jest.mock('../../src/database', () => ({
  databaseService: { test: 'database' },
}));

jest.mock('../../src/cart', () => ({
  cartService: { test: 'cart' },
}));

jest.mock('../../src/logger', () => ({
  createLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock('../../src/types', () => ({}));

// === HELPER FUNCTIONS ===

const mockProcessExit = jest.fn();
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();

// Store originals
const originalProcessExit = process.exit;
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('Bot.ts Comprehensive Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.resetModules();

    // Mock process and console
    process.exit = mockProcessExit as any;
    console.log = mockConsoleLog;
    console.error = mockConsoleError;

    // Reset config to valid state
    mockConfig = {
      BOT_TOKEN: 'valid_bot_token',
      DATABASE_URL: 'postgresql://user:pass@postgres:5432/testdb',
    };

    // Reset bot mocks
    mockBot.getMe.mockResolvedValue({
      id: 123456789,
      username: 'test_bot',
      first_name: 'Test Bot',
    });
  });

  afterEach(() => {
    // Restore originals
    process.exit = originalProcessExit;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Token Validation', () => {
    it('should exit with error for missing token', async () => {
      mockConfig.BOT_TOKEN = '';

      await import('../../src/bot');

      expect(mockConsoleError).toHaveBeenCalledWith('❌ Ошибка: BOT_TOKEN не установлен!');
      expect(mockConsoleLog).toHaveBeenCalledWith('📝 Создайте файл .env и добавьте:');
      expect(mockConsoleLog).toHaveBeenCalledWith('BOT_TOKEN=ваш_токен_от_BotFather');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should exit with error for default token', async () => {
      mockConfig.BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';

      await import('../../src/bot');

      expect(mockConsoleError).toHaveBeenCalledWith('❌ Ошибка: BOT_TOKEN не установлен!');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should continue with valid token', async () => {
      mockConfig.BOT_TOKEN = 'valid_bot_token';

      await import('../../src/bot');

      expect(mockProcessExit).not.toHaveBeenCalled();
      expect(TelegramBotConstructor).toHaveBeenCalledWith('valid_bot_token', { polling: true });
    });
  });

  describe('Bot Initialization', () => {
    it('should create TelegramBot instance with correct config', async () => {
      await import('../../src/bot');

      expect(TelegramBotConstructor).toHaveBeenCalledWith('valid_bot_token', { polling: true });
    });

    it('should create NotificationService', async () => {
      await import('../../src/bot');

      expect(NotificationServiceConstructor).toHaveBeenCalledWith(mockBot);
    });

    it('should log startup message', async () => {
      await import('../../src/bot');

      expect(mockConsoleLog).toHaveBeenCalledWith('🤖 Шаурма Бот запускается...');
    });
  });

  describe('Service Registration', () => {
    it('should register all services in serviceRegistry', async () => {
      await import('../../src/bot');

      expect(mockServiceRegistry.register).toHaveBeenCalledWith('bot', mockBot);
      expect(mockServiceRegistry.register).toHaveBeenCalledWith(
        'notifications',
        mockNotificationService
      );
      expect(mockServiceRegistry.register).toHaveBeenCalledWith('database', { test: 'database' });
      expect(mockServiceRegistry.register).toHaveBeenCalledWith('cart', { test: 'cart' });
      expect(mockServiceRegistry.register).toHaveBeenCalledWith('logger', expect.any(Object));
    });
  });

  describe('Event Handlers Registration', () => {
    it('should register /start command handler', async () => {
      await import('../../src/bot');

      expect(mockBot.onText).toHaveBeenCalledWith(/\/start/, expect.any(Function));
    });

    it('should register message handler', async () => {
      await import('../../src/bot');

      expect(mockBot.on).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should register callback_query handler', async () => {
      await import('../../src/bot');

      expect(mockBot.on).toHaveBeenCalledWith('callback_query', expect.any(Function));
    });

    it('should register polling_error handler', async () => {
      await import('../../src/bot');

      expect(mockBot.on).toHaveBeenCalledWith('polling_error', expect.any(Function));
    });
  });

  describe('/start Command Handler', () => {
    it('should handle /start command', async () => {
      await import('../../src/bot');

      const startHandler = mockBot.onText.mock.calls.find(
        call => call[0].toString() === '/\\/start/'
      )?.[1];

      const mockMsg = {
        chat: { id: 123 },
        from: { id: 456, first_name: 'Test User' },
        text: '/start',
      };

      startHandler(mockMsg);

      expect(mockConsoleLog).toHaveBeenCalledWith('👤 Пользователь Test User (456) запустил бота');
      expect(mockHandlers.handleStart).toHaveBeenCalledWith(mockBot, mockMsg);
    });
  });

  describe('Message Handler', () => {
    let messageHandler: any;

    beforeEach(async () => {
      await import('../../src/bot');
      messageHandler = mockBot.on.mock.calls.find(call => call[0] === 'message')?.[1];
    });

    it('should ignore command messages', () => {
      const mockMsg = {
        chat: { id: 123 },
        text: '/help',
        from: { first_name: 'Test' },
      };

      messageHandler(mockMsg);

      expect(mockHandlers.handleShawarmaMenu).not.toHaveBeenCalled();
    });

    it('should route shawarma menu message', () => {
      const mockMsg = {
        chat: { id: 123 },
        text: '🌯 Шаурма',
        from: { first_name: 'Test' },
      };

      messageHandler(mockMsg);

      expect(mockConsoleLog).toHaveBeenCalledWith('💬 Сообщение от Test: 🌯 Шаурма');
      expect(mockHandlers.handleShawarmaMenu).toHaveBeenCalledWith(mockBot, mockMsg);
    });

    it('should route drinks menu message', () => {
      const mockMsg = {
        chat: { id: 123 },
        text: '🥤 Напитки',
        from: { first_name: 'Test' },
      };

      messageHandler(mockMsg);

      expect(mockHandlers.handleDrinksMenu).toHaveBeenCalledWith(mockBot, mockMsg);
    });

    it('should route about message', () => {
      const mockMsg = {
        chat: { id: 123 },
        text: 'ℹ️ О нас',
        from: { first_name: 'Test' },
      };

      messageHandler(mockMsg);

      expect(mockHandlers.handleAbout).toHaveBeenCalledWith(mockBot, mockMsg);
    });

    it('should route profile message', () => {
      const mockMsg = {
        chat: { id: 123 },
        text: '👤 Профиль',
        from: { first_name: 'Test' },
      };

      messageHandler(mockMsg);

      expect(mockHandlers.handleProfile).toHaveBeenCalledWith(mockBot, mockMsg);
    });

    it('should route cart message with indicator', () => {
      const mockMsg = {
        chat: { id: 123 },
        text: '🛒 Корзина (3)',
        from: { first_name: 'Test' },
      };

      messageHandler(mockMsg);

      expect(mockHandlers.handleViewCart).toHaveBeenCalledWith(mockBot, mockMsg);
    });

    it('should route simple cart message', () => {
      const mockMsg = {
        chat: { id: 123 },
        text: '🛒 Корзина',
        from: { first_name: 'Test' },
      };

      messageHandler(mockMsg);

      expect(mockHandlers.handleViewCart).toHaveBeenCalledWith(mockBot, mockMsg);
    });

    it('should show help for unknown messages', () => {
      const mockMsg = {
        chat: { id: 123 },
        text: 'Unknown message',
        from: { first_name: 'Test' },
      };

      messageHandler(mockMsg);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123,
        'Используйте кнопки меню или команду /start для начала работы с ботом! 😊'
      );
    });
  });

  describe('Callback Query Handler', () => {
    let callbackHandler: any;

    beforeEach(async () => {
      await import('../../src/bot');
      callbackHandler = mockBot.on.mock.calls.find(call => call[0] === 'callback_query')?.[1];
    });

    it('should route item selection callback', () => {
      const mockQuery = {
        id: 'callback123',
        data: 'item_1',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockConsoleLog).toHaveBeenCalledWith('🔘 Callback от Test: item_1');
      expect(mockHandlers.handleItemSelection).toHaveBeenCalledWith(mockBot, mockQuery);
    });

    it('should route add to cart callback', () => {
      const mockQuery = {
        id: 'callback123',
        data: 'add_to_cart_1',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockHandlers.handleAddToCart).toHaveBeenCalledWith(mockBot, mockQuery);
    });

    it('should route view cart callback', () => {
      const mockQuery = {
        id: 'callback123',
        data: 'view_cart',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockHandlers.handleViewCart).toHaveBeenCalledWith(mockBot, mockQuery);
    });

    it('should route increase from item callback', () => {
      const mockQuery = {
        id: 'callback123',
        data: 'increase_from_item_1',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockHandlers.handleIncreaseFromItem).toHaveBeenCalledWith(mockBot, mockQuery);
    });

    it('should route decrease from item callback', () => {
      const mockQuery = {
        id: 'callback123',
        data: 'decrease_from_item_1',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockHandlers.handleDecreaseFromItem).toHaveBeenCalledWith(mockBot, mockQuery);
    });

    it('should route increase quantity callback', () => {
      const mockQuery = {
        id: 'callback123',
        data: 'increase_1',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockHandlers.handleIncreaseQuantity).toHaveBeenCalledWith(mockBot, mockQuery);
    });

    it('should route decrease quantity callback', () => {
      const mockQuery = {
        id: 'callback123',
        data: 'decrease_1',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockHandlers.handleDecreaseQuantity).toHaveBeenCalledWith(mockBot, mockQuery);
    });

    it('should route remove from cart callback', () => {
      const mockQuery = {
        id: 'callback123',
        data: 'remove_1',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockHandlers.handleRemoveFromCart).toHaveBeenCalledWith(mockBot, mockQuery);
    });

    it('should route clear cart callback', () => {
      const mockQuery = {
        id: 'callback123',
        data: 'clear_cart',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockHandlers.handleClearCart).toHaveBeenCalledWith(mockBot, mockQuery);
    });

    it('should route checkout callback', () => {
      const mockQuery = {
        id: 'callback123',
        data: 'checkout',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockHandlers.handleCheckout).toHaveBeenCalledWith(mockBot, mockQuery);
    });

    it('should route profile callback', () => {
      const mockQuery = {
        id: 'callback123',
        data: 'profile',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockHandlers.handleProfile).toHaveBeenCalledWith(mockBot, mockQuery);
    });

    it('should route my orders callback', () => {
      const mockQuery = {
        id: 'callback123',
        data: 'my_orders',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockHandlers.handleMyOrders).toHaveBeenCalledWith(mockBot, mockQuery);
    });

    it('should route admin callback', () => {
      const mockQuery = {
        id: 'callback123',
        data: 'admin_action',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockHandlers.handleAdminOrderAction).toHaveBeenCalledWith(mockBot, mockQuery);
    });

    it('should route navigation callbacks', () => {
      const callbacks = [
        'back_to_menu',
        'back_to_profile',
        'back_to_shawarma',
        'back_to_drinks',
        'about_miniapp',
        'back_to_start',
      ];

      const handlers = [
        mockHandlers.handleBackToMenu,
        mockHandlers.handleBackToProfile,
        mockHandlers.handleBackToShawarma,
        mockHandlers.handleBackToDrinks,
        mockHandlers.handleAboutMiniApp,
        mockHandlers.handleBackToStart,
      ];

      callbacks.forEach((data, index) => {
        const mockQuery = {
          id: 'callback123',
          data,
          from: { first_name: 'Test', id: 123 },
        };

        callbackHandler(mockQuery);

        expect(handlers[index]).toHaveBeenCalledWith(mockBot, mockQuery);
      });
    });

    it('should handle quantity callback', async () => {
      const mockQuery = {
        id: 'callback123',
        data: 'quantity_1',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockHandlers.getItemQuantityInCart).toHaveBeenCalledWith(123, '1');

      // Дожидаемся выполнения async операции
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback123', {
        text: 'В корзине: 2 шт. Test Item',
      });
    });

    it('should handle quantity callback with error', async () => {
      mockHandlers.getItemQuantityInCart.mockRejectedValueOnce(new Error('Cart error'));

      const mockQuery = {
        id: 'callback123',
        data: 'quantity_1',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      // Дожидаемся выполнения async операции
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback123', {
        text: 'Ошибка получения количества',
      });
    });

    it('should handle unknown callback', () => {
      const mockQuery = {
        id: 'callback123',
        data: 'unknown_action',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback123', {
        text: 'Неизвестная команда',
      });
    });

    it('should handle callback errors gracefully', () => {
      // Мокируем ошибку в одном из handlers
      mockHandlers.handleItemSelection.mockImplementationOnce(() => {
        throw new Error('Handler error');
      });

      const mockQuery = {
        id: 'callback123',
        data: 'item_1',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Ошибка при обработке callback:',
        expect.any(Error)
      );
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback123', {
        text: 'Произошла ошибка',
      });
    });
  });

  describe('Polling Error Handler', () => {
    it('should handle polling errors', async () => {
      await import('../../src/bot');

      const errorHandler = mockBot.on.mock.calls.find(call => call[0] === 'polling_error')?.[1];

      const testError = new Error('Connection failed');
      errorHandler(testError);

      expect(mockConsoleError).toHaveBeenCalledWith('❌ Ошибка polling:', 'Connection failed');
    });
  });

  describe('Bot Info Initialization', () => {
    it('should handle successful bot.getMe()', async () => {
      mockBot.getMe.mockResolvedValueOnce({
        id: 123456789,
        username: 'test_shawarma_bot',
        first_name: 'Shawarma Bot',
      });

      await import('../../src/bot');

      // Даем время для выполнения getMe
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockBot.getMe).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Бот успешно запущен!');
      expect(mockConsoleLog).toHaveBeenCalledWith('🤖 Имя бота: @test_shawarma_bot');
      expect(mockConsoleLog).toHaveBeenCalledWith('🆔 ID бота: 123456789');
      expect(mockConsoleLog).toHaveBeenCalledWith('📢 Notification service ready');
      expect(mockConsoleLog).toHaveBeenCalledWith('📱 Бот готов к работе!');
    });

    it('should handle failed bot.getMe()', async () => {
      const getMeError = new Error('Invalid token');
      mockBot.getMe.mockRejectedValueOnce(getMeError);

      await import('../../src/bot');

      // Даем время для выполнения getMe
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Ошибка при получении информации о боте:',
        'Invalid token'
      );
      expect(mockConsoleLog).toHaveBeenCalledWith('🔍 Проверьте правильность BOT_TOKEN');
    });
  });

  describe('Graceful Shutdown', () => {
    let processListeners: { [key: string]: () => void } = {};

    beforeEach(() => {
      // Mock process.on
      const originalProcessOn = process.on;
      process.on = jest.fn((event: string, listener: () => void) => {
        processListeners[event] = listener;
        return process;
      }) as any;
    });

    afterEach(() => {
      processListeners = {};
    });

    it('should handle SIGINT signal', async () => {
      await import('../../src/bot');

      const sigintHandler = processListeners['SIGINT'];
      expect(sigintHandler).toBeDefined();

      if (sigintHandler) {
        sigintHandler();
      }

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '\n🛑 Получен сигнал SIGINT. Завершение работы...'
      );
      expect(mockBot.stopPolling).toHaveBeenCalled();
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('should handle SIGTERM signal', async () => {
      await import('../../src/bot');

      const sigtermHandler = processListeners['SIGTERM'];
      expect(sigtermHandler).toBeDefined();

      if (sigtermHandler) {
        sigtermHandler();
      }

      expect(mockConsoleLog).toHaveBeenCalledWith(
        '\n🛑 Получен сигнал SIGTERM. Завершение работы...'
      );
      expect(mockBot.stopPolling).toHaveBeenCalled();
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });
  });
});
