// Отключаем глобальный мок из setupJest.ts
jest.unmock('../../src/bot');

// Мокируем TelegramBot
const mockBot = {
  onText: jest.fn(),
  on: jest.fn(),
  getMe: jest.fn().mockResolvedValue({ id: 123, username: 'test_bot' }),
  stopPolling: jest.fn(),
  sendMessage: jest.fn(),
  answerCallbackQuery: jest.fn().mockResolvedValue(true),
};

jest.mock('node-telegram-bot-api', () => jest.fn(() => mockBot));

// Мокируем config с полными настройками
jest.mock('../../src/config', () => ({
  BOT_TOKEN: 'valid_bot_token',
  DATABASE_URL: 'postgresql://user:pass@postgres:5432/testdb',
  DATABASE_HOST: 'postgres',
  DATABASE_PORT: 5432,
  DATABASE_NAME: 'testdb',
  DATABASE_USER: 'user',
  DATABASE_PASSWORD: 'pass',
}));

// Мокируем handlers
const mockHandlers = {
  handleStart: jest.fn(),
  handleShawarmaMenu: jest.fn(),
  handleDrinksMenu: jest.fn(),
  handleAbout: jest.fn(),
  handleProfile: jest.fn(),
  handleItemSelection: jest.fn(),
  handleViewCart: jest.fn(),
  handleAddToCart: jest.fn(),
  handleIncreaseQuantity: jest.fn(),
  handleDecreaseQuantity: jest.fn(),
  handleRemoveFromCart: jest.fn(),
  handleClearCart: jest.fn(),
  handleCheckout: jest.fn(),
  handleMyOrders: jest.fn(),
  handleAdminOrderAction: jest.fn(),
  handleBackToMenu: jest.fn(),
  handleBackToProfile: jest.fn(),
  handleBackToShawarma: jest.fn(),
  handleBackToDrinks: jest.fn(),
  handleAboutMiniApp: jest.fn(),
  handleBackToStart: jest.fn(),
  handleIncreaseFromItem: jest.fn(),
  handleDecreaseFromItem: jest.fn(),
  getItemQuantityInCart: jest.fn(),
};

jest.mock('../../src/handlers', () => mockHandlers);

// Мокируем остальные зависимости
jest.mock('../../src/menu', () => ({
  getItemById: jest.fn(),
}));

jest.mock('../../src/notifications', () =>
  jest.fn(() => ({
    getStatus: () => 'Notification service ready',
  }))
);

jest.mock('../../src/services', () => ({
  serviceRegistry: {
    register: jest.fn(),
  },
}));

jest.mock('../../src/database', () => ({
  __esModule: true,
  default: jest.fn(),
  databaseService: {},
}));

jest.mock('../../src/cart', () => ({
  cartService: {},
}));

jest.mock('../../src/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  }),
}));

jest.mock('../../src/types', () => ({}));

// Мокируем process
const mockProcessExit = jest.fn();
const originalProcessExit = process.exit;
const originalConsole = { log: console.log, error: console.error };

describe('Bot Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.exit = mockProcessExit as any;
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    process.exit = originalProcessExit;
    console.log = originalConsole.log;
    console.error = originalConsole.error;
  });

  describe('Initialization', () => {
    it('should setup bot with valid token', async () => {
      // Импортируем после мокинга
      await import('../../src/bot');

      // Проверяем что bot был создан
      expect(mockBot.onText).toHaveBeenCalledWith(/\/start/, expect.any(Function));
      expect(mockBot.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockBot.on).toHaveBeenCalledWith('callback_query', expect.any(Function));
      expect(mockBot.on).toHaveBeenCalledWith('polling_error', expect.any(Function));
    });
  });

  describe('Message Routing', () => {
    let messageHandler: any;

    beforeEach(async () => {
      jest.resetModules();
      await import('../../src/bot');

      // Получаем message handler
      messageHandler = mockBot.on.mock.calls.find(call => call[0] === 'message')?.[1];
    });

    it('should route shawarma menu message', () => {
      const mockMsg = {
        chat: { id: 123 },
        text: '🌯 Шаурма',
        from: { first_name: 'Test' },
      };

      messageHandler(mockMsg);

      expect(mockHandlers.handleShawarmaMenu).toHaveBeenCalledWith(expect.any(Object), mockMsg);
    });

    it('should route drinks menu message', () => {
      const mockMsg = {
        chat: { id: 123 },
        text: '🥤 Напитки',
        from: { first_name: 'Test' },
      };

      messageHandler(mockMsg);

      expect(mockHandlers.handleDrinksMenu).toHaveBeenCalledWith(expect.any(Object), mockMsg);
    });

    it('should route about message', () => {
      const mockMsg = {
        chat: { id: 123 },
        text: 'ℹ️ О нас',
        from: { first_name: 'Test' },
      };

      messageHandler(mockMsg);

      expect(mockHandlers.handleAbout).toHaveBeenCalledWith(expect.any(Object), mockMsg);
    });

    it('should route profile message', () => {
      const mockMsg = {
        chat: { id: 123 },
        text: '👤 Профиль',
        from: { first_name: 'Test' },
      };

      messageHandler(mockMsg);

      expect(mockHandlers.handleProfile).toHaveBeenCalledWith(expect.any(Object), mockMsg);
    });

    it('should route cart message', () => {
      const mockMsg = {
        chat: { id: 123 },
        text: '🛒 Корзина (2)',
        from: { first_name: 'Test' },
      };

      messageHandler(mockMsg);

      expect(mockHandlers.handleViewCart).toHaveBeenCalledWith(expect.any(Object), mockMsg);
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

    it('should ignore command messages', () => {
      const mockMsg = {
        chat: { id: 123 },
        text: '/help',
        from: { first_name: 'Test' },
      };

      messageHandler(mockMsg);

      // Проверяем что handlers не вызывались
      expect(mockHandlers.handleShawarmaMenu).not.toHaveBeenCalled();
      expect(mockHandlers.handleDrinksMenu).not.toHaveBeenCalled();
    });
  });

  describe('Callback Query Routing', () => {
    let callbackHandler: any;

    beforeEach(async () => {
      jest.resetModules();
      await import('../../src/bot');

      // Получаем callback handler
      callbackHandler = mockBot.on.mock.calls.find(call => call[0] === 'callback_query')?.[1];
    });

    it('should route item selection callback', () => {
      const mockQuery = {
        id: 'callback123',
        data: 'item_shawarma1',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockHandlers.handleItemSelection).toHaveBeenCalledWith(expect.any(Object), mockQuery);
    });

    it('should route add to cart callback', () => {
      const mockQuery = {
        id: 'callback123',
        data: 'add_to_cart_item1',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockHandlers.handleAddToCart).toHaveBeenCalledWith(expect.any(Object), mockQuery);
    });

    it('should route view cart callback', () => {
      const mockQuery = {
        id: 'callback123',
        data: 'view_cart',
        from: { first_name: 'Test', id: 123 },
      };

      callbackHandler(mockQuery);

      expect(mockHandlers.handleViewCart).toHaveBeenCalledWith(expect.any(Object), mockQuery);
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
  });

  describe('Error Handling', () => {
    it('should handle polling errors', async () => {
      jest.resetModules();
      await import('../../src/bot');

      const errorHandler = mockBot.on.mock.calls.find(call => call[0] === 'polling_error')?.[1];

      if (errorHandler) {
        const testError = new Error('Polling failed');
        errorHandler(testError);

        expect(console.error).toHaveBeenCalledWith('❌ Ошибка polling:', 'Polling failed');
      }
    });
  });
});
