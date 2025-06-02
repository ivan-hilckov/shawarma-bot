import {
  getItemQuantityInCart,
  createItemKeyboard,
  handleProfile,
  handleBackToProfile,
  handleBackToShawarma,
  handleBackToDrinks,
  handleIncreaseFromItem,
  handleDecreaseFromItem,
  handleQuickAdd,
  handleQuickIncrease,
  handleQuickDecrease,
} from '../src/handlers';
import { BotInstance, BotMessage, BotCallbackQuery, MenuItem, CartItem } from '../src/types';

// Локальные моки для специфичных тестов
jest.mock('../src/menu', () => ({
  getMenuByCategory: jest.fn(),
  getItemById: jest.fn(),
}));

jest.mock('../src/config', () => ({
  default: {
    ASSETS_BASE_URL: 'https://example.com/assets',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    BOT_TOKEN: 'test_token',
    NODE_ENV: 'test',
    API_PORT: 3000,
    API_HOST: '0.0.0.0',
    API_PREFIX: '/api',
    CORS_ORIGINS: ['http://localhost:3000'],
    API_KEYS: ['test-key'],
    RATE_LIMIT_PUBLIC: 100,
    RATE_LIMIT_ADMIN: 1000,
    REDIS_URL: 'redis://localhost:6379',
    REDIS_CACHE_TTL: 300,
    ENABLE_CACHE: true,
  },
}));

jest.mock('../src/services', () => ({
  serviceRegistry: {
    get: jest.fn(),
  },
}));

jest.mock('../src/database', () => ({
  __esModule: true,
  default: {
    getUserStats: jest.fn(),
    upsertUser: jest.fn(),
    createOrder: jest.fn(),
    getOrderById: jest.fn(),
    getUserOrders: jest.fn(),
    updateOrderStatus: jest.fn(),
  },
}));

// Переопределяем мок для api-client как default export
jest.mock('../src/api-client', () => ({
  __esModule: true,
  default: {
    addToCart: jest.fn(),
    getCart: jest.fn(),
    getCartTotal: jest.fn(),
    updateCartQuantity: jest.fn(),
    removeFromCart: jest.fn(),
    clearCart: jest.fn(),
  },
}));

// Глобальные моки применяются автоматически из setupJest.ts

describe('Handlers Extended Tests', () => {
  let mockBot: jest.Mocked<BotInstance>;
  let mockMessage: BotMessage;
  let mockCallbackQuery: BotCallbackQuery;
  let mockMenuItem: MenuItem;
  let mockCartItem: CartItem;

  beforeEach(() => {
    // Создаем мок бота
    mockBot = {
      sendMessage: jest.fn().mockResolvedValue(true),
      editMessageText: jest.fn().mockResolvedValue(true),
      editMessageCaption: jest.fn().mockResolvedValue(true),
      answerCallbackQuery: jest.fn().mockResolvedValue(true),
      sendPhoto: jest.fn().mockResolvedValue(true),
    } as any;

    // Создаем мок сообщения
    mockMessage = {
      chat: { id: 123456 },
      from: { first_name: 'TestUser', id: 789 },
      message_id: 1,
    } as BotMessage;

    // Создаем мок callback query
    mockCallbackQuery = {
      id: 'callback_123',
      from: { first_name: 'TestUser', id: 789 },
      message: {
        chat: { id: 123456 },
        message_id: 1,
      },
      data: 'test_action',
    } as BotCallbackQuery;

    // Создаем мок товара
    mockMenuItem = {
      id: '1',
      name: 'Тестовая шаурма',
      description: 'Описание тестовой шаурмы',
      price: 250,
      category: 'shawarma',
      photo: 'assets/test-image.jpg',
    };

    // Создаем мок элемента корзины
    mockCartItem = {
      menuItem: mockMenuItem,
      quantity: 2,
    };

    // Настраиваем serviceRegistry
    const { serviceRegistry } = require('../src/services');
    serviceRegistry.get.mockReturnValue({
      notifyNewOrder: jest.fn().mockResolvedValue(undefined),
      isAdmin: jest.fn().mockReturnValue(false),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===== ГРУППА 1: ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

  describe('Helper Functions', () => {
    describe('getItemQuantityInCart', () => {
      test('должен возвращать количество товара в корзине', async () => {
        const botApiClient = require('../src/api-client');
        botApiClient.default.getCart.mockResolvedValue([mockCartItem]);

        const quantity = await getItemQuantityInCart(789, '1');

        expect(botApiClient.default.getCart).toHaveBeenCalledWith(789);
        expect(quantity).toBe(2);
      });

      test('должен возвращать 0 для товара не в корзине', async () => {
        const botApiClient = require('../src/api-client');
        botApiClient.default.getCart.mockResolvedValue([]);

        const quantity = await getItemQuantityInCart(789, '1');

        expect(quantity).toBe(0);
      });

      test('должен возвращать 0 при ошибке API', async () => {
        const botApiClient = require('../src/api-client');
        botApiClient.default.getCart.mockRejectedValue(new Error('API Error'));

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const quantity = await getItemQuantityInCart(789, '1');

        expect(quantity).toBe(0);
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error getting item quantity from cart:',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });

      test('должен правильно обрабатывать корзину с разными товарами', async () => {
        const botApiClient = require('../src/api-client');
        const multiItemCart = [
          { menuItem: { id: '1', name: 'Item 1' }, quantity: 3 },
          { menuItem: { id: '2', name: 'Item 2' }, quantity: 1 },
          { menuItem: { id: '3', name: 'Item 3' }, quantity: 5 },
        ];
        botApiClient.default.getCart.mockResolvedValue(multiItemCart);

        const quantity1 = await getItemQuantityInCart(789, '1');
        const quantity2 = await getItemQuantityInCart(789, '2');
        const quantity4 = await getItemQuantityInCart(789, '4'); // Не существует

        expect(quantity1).toBe(3);
        expect(quantity2).toBe(1);
        expect(quantity4).toBe(0);
      });
    });

    describe('createItemKeyboard', () => {
      test('должен создавать клавиатуру для товара не в корзине', async () => {
        const keyboard = await createItemKeyboard('1', 0, 'shawarma');

        expect(keyboard).toEqual([
          [{ text: 'Добавить в корзину', callback_data: 'add_to_cart_1' }],
          [
            { text: 'Перейти в корзину', callback_data: 'view_cart' },
            { text: 'К шаурме', callback_data: 'back_to_shawarma' },
          ],
        ]);
      });

      test('должен создавать клавиатуру для товара в корзине', async () => {
        const keyboard = await createItemKeyboard('1', 3, 'drinks');

        expect(keyboard).toEqual([
          [
            { text: '−', callback_data: 'decrease_from_item_1' },
            { text: '3 шт.', callback_data: 'quantity_1' },
            { text: '+', callback_data: 'increase_from_item_1' },
          ],
          [
            { text: 'Перейти в корзину', callback_data: 'view_cart' },
            { text: 'К напиткам', callback_data: 'back_to_drinks' },
          ],
        ]);
      });

      test('должен создавать клавиатуру с дефолтным возвратом', async () => {
        const keyboard = await createItemKeyboard('1', 0);

        expect(keyboard).toEqual([
          [{ text: 'Добавить в корзину', callback_data: 'add_to_cart_1' }],
          [
            { text: 'Перейти в корзину', callback_data: 'view_cart' },
            { text: 'К каталогу', callback_data: 'back_to_menu' },
          ],
        ]);
      });

      test('должен создавать клавиатуру для товара в корзине с дефолтным возвратом', async () => {
        const keyboard = await createItemKeyboard('5', 1);

        expect(keyboard).toEqual([
          [
            { text: '−', callback_data: 'decrease_from_item_5' },
            { text: '1 шт.', callback_data: 'quantity_5' },
            { text: '+', callback_data: 'increase_from_item_5' },
          ],
          [
            { text: 'Перейти в корзину', callback_data: 'view_cart' },
            { text: 'К каталогу', callback_data: 'back_to_menu' },
          ],
        ]);
      });
    });
  });

  // ===== ГРУППА 2: ОБРАБОТЧИКИ ПРОФИЛЯ =====

  describe('Profile Handlers', () => {
    describe('handleProfile', () => {
      test('должен отображать профиль пользователя со статистикой', async () => {
        const databaseService = require('../src/database');
        databaseService.default.getUserStats.mockResolvedValue({
          totalOrders: 5,
          totalSpent: 1250,
          avgOrderValue: 250,
        });

        await handleProfile(mockBot, mockMessage);

        expect(databaseService.default.getUserStats).toHaveBeenCalledWith(789);
        expect(mockBot.sendMessage).toHaveBeenCalledWith(
          123456,
          expect.stringMatching(/Привет, TestUser![\s\S]*Заказов: 5[\s\S]*Потрачено: 1250₽/),
          expect.objectContaining({
            reply_markup: expect.objectContaining({
              inline_keyboard: expect.arrayContaining([
                expect.arrayContaining([{ text: '📋 Мои заказы', callback_data: 'my_orders' }]),
              ]),
            }),
          })
        );
      });

      test('должен отображать профиль нового пользователя', async () => {
        const databaseService = require('../src/database');
        databaseService.default.getUserStats.mockResolvedValue({
          totalOrders: 0,
          totalSpent: 0,
          avgOrderValue: 0,
        });

        await handleProfile(mockBot, mockMessage);

        expect(mockBot.sendMessage).toHaveBeenCalledWith(
          123456,
          expect.stringMatching(/Добро пожаловать![\s\S]*Вы еще не делали заказов/),
          expect.any(Object)
        );
      });

      test('должен обрабатывать callback query', async () => {
        const databaseService = require('../src/database');
        databaseService.default.getUserStats.mockResolvedValue({
          totalOrders: 2,
          totalSpent: 500,
          avgOrderValue: 250,
        });

        await handleProfile(mockBot, mockCallbackQuery);

        expect(mockBot.editMessageText).toHaveBeenCalledWith(
          expect.stringContaining('Профиль пользователя 👤'),
          expect.objectContaining({
            chat_id: 123456,
            message_id: 1,
          })
        );
        expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
          text: 'Профиль',
        });
      });

      test('должен обрабатывать ошибку получения статистики', async () => {
        const databaseService = require('../src/database');
        databaseService.default.getUserStats.mockRejectedValue(new Error('DB Error'));

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        await handleProfile(mockBot, mockMessage);

        expect(mockBot.sendMessage).toHaveBeenCalledWith(123456, 'Ошибка при загрузке профиля');

        consoleSpy.mockRestore();
      });

      test('должен обрабатывать отсутствие chatId', async () => {
        const invalidQuery = {
          ...mockCallbackQuery,
          message: undefined,
        } as any;

        await handleProfile(mockBot, invalidQuery);

        // Функция должна завершиться без выполнения действий
        expect(mockBot.editMessageText).not.toHaveBeenCalled();
        expect(mockBot.sendMessage).not.toHaveBeenCalled();
      });

      test('должен обрабатывать пользователя без имени', async () => {
        const databaseService = require('../src/database');
        databaseService.default.getUserStats.mockResolvedValue({
          totalOrders: 1,
          totalSpent: 300,
          avgOrderValue: 300,
        });

        const messageWithoutName = {
          ...mockMessage,
          from: { id: 789 },
        } as BotMessage;

        await handleProfile(mockBot, messageWithoutName);

        expect(mockBot.sendMessage).toHaveBeenCalledWith(
          123456,
          expect.stringContaining('Привет, Пользователь!'),
          expect.any(Object)
        );
      });
    });

    describe('handleBackToProfile', () => {
      test('должен возвращать к профилю', async () => {
        const databaseService = require('../src/database');
        databaseService.default.getUserStats.mockResolvedValue({
          totalOrders: 3,
          totalSpent: 750,
          avgOrderValue: 250,
        });

        await handleBackToProfile(mockBot, mockCallbackQuery);

        expect(mockBot.editMessageText).toHaveBeenCalledWith(
          expect.stringContaining('Профиль пользователя 👤'),
          expect.objectContaining({
            chat_id: 123456,
            message_id: 1,
          })
        );
      });
    });
  });

  // ===== ГРУППА 3: НАВИГАЦИОННЫЕ ОБРАБОТЧИКИ =====

  describe('Navigation Handlers', () => {
    describe('handleBackToShawarma', () => {
      test('должен возвращать к меню шаурмы', async () => {
        const { getMenuByCategory } = require('../src/menu');
        getMenuByCategory.mockReturnValue([mockMenuItem]);

        await handleBackToShawarma(mockBot, mockCallbackQuery);

        expect(getMenuByCategory).toHaveBeenCalledWith('shawarma');
        expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
          text: 'Возврат к шаурме',
        });
      });

      test('должен обрабатывать ошибку возврата к шаурме', async () => {
        const { getMenuByCategory } = require('../src/menu');
        getMenuByCategory.mockImplementation(() => {
          throw new Error('Menu error');
        });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        await handleBackToShawarma(mockBot, mockCallbackQuery);

        expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
          text: 'Ошибка возврата',
        });

        consoleSpy.mockRestore();
      });
    });

    describe('handleBackToDrinks', () => {
      test('должен возвращать к меню напитков', async () => {
        const { getMenuByCategory } = require('../src/menu');
        const drinkItem = { ...mockMenuItem, category: 'drinks', name: 'Тестовый напиток' };
        getMenuByCategory.mockReturnValue([drinkItem]);

        await handleBackToDrinks(mockBot, mockCallbackQuery);

        expect(getMenuByCategory).toHaveBeenCalledWith('drinks');
        expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
          text: 'Возврат к напиткам',
        });
      });

      test('должен обрабатывать ошибку возврата к напиткам', async () => {
        const { getMenuByCategory } = require('../src/menu');
        getMenuByCategory.mockImplementation(() => {
          throw new Error('Menu error');
        });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        await handleBackToDrinks(mockBot, mockCallbackQuery);

        expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
          text: 'Ошибка возврата',
        });

        consoleSpy.mockRestore();
      });
    });
  });

  // ===== ГРУППА 4: ОПЕРАЦИИ С ЭКРАНА ТОВАРА =====

  describe('Item Screen Operations', () => {
    describe('handleIncreaseFromItem', () => {
      test('должен увеличивать количество товара с экрана товара', async () => {
        const { getItemById } = require('../src/menu');
        const botApiClient = require('../src/api-client');

        getItemById.mockReturnValue(mockMenuItem);
        botApiClient.default.getCart.mockResolvedValue([mockCartItem]);
        botApiClient.default.updateCartQuantity.mockResolvedValue(undefined);
        botApiClient.default.getCartTotal.mockResolvedValue({ total: 750, itemsCount: 3 });

        const query = {
          ...mockCallbackQuery,
          data: 'increase_from_item_1',
        };

        await handleIncreaseFromItem(mockBot, query);

        expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
          text: expect.stringContaining('Тестовая шаурма добавлен!'),
        });
      });

      test('должен добавлять новый товар в корзину', async () => {
        const { getItemById } = require('../src/menu');
        const botApiClient = require('../src/api-client');

        getItemById.mockReturnValue(mockMenuItem);
        botApiClient.default.getCart.mockResolvedValue([]); // Пустая корзина
        botApiClient.default.addToCart.mockResolvedValue(undefined);
        botApiClient.default.getCartTotal.mockResolvedValue({ total: 250, itemsCount: 1 });

        const query = {
          ...mockCallbackQuery,
          data: 'increase_from_item_1',
        };

        await handleIncreaseFromItem(mockBot, query);

        expect(botApiClient.default.addToCart).toHaveBeenCalledWith(789, '1', 1);
      });

      test('должен обрабатывать ошибку увеличения', async () => {
        const { getItemById } = require('../src/menu');
        const botApiClient = require('../src/api-client');

        getItemById.mockReturnValue(mockMenuItem);
        botApiClient.default.getCart.mockRejectedValue(new Error('API Error'));

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const query = {
          ...mockCallbackQuery,
          data: 'increase_from_item_1',
        };

        await handleIncreaseFromItem(mockBot, query);

        expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
          text: 'API Error',
        });

        consoleSpy.mockRestore();
      });

      test('должен обрабатывать отсутствие товара', async () => {
        const { getItemById } = require('../src/menu');
        getItemById.mockReturnValue(undefined);

        const query = {
          ...mockCallbackQuery,
          data: 'increase_from_item_1',
        };

        await handleIncreaseFromItem(mockBot, query);

        expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
          text: 'Товар не найден',
        });
      });
    });

    describe('handleDecreaseFromItem', () => {
      test('должен уменьшать количество товара', async () => {
        const { getItemById } = require('../src/menu');
        const botApiClient = require('../src/api-client');

        getItemById.mockReturnValue(mockMenuItem);
        botApiClient.default.getCart.mockResolvedValue([mockCartItem]);
        botApiClient.default.updateCartQuantity.mockResolvedValue(undefined);
        botApiClient.default.getCartTotal.mockResolvedValue({ total: 250, itemsCount: 1 });

        const query = {
          ...mockCallbackQuery,
          data: 'decrease_from_item_1',
        };

        await handleDecreaseFromItem(mockBot, query);

        expect(botApiClient.default.updateCartQuantity).toHaveBeenCalledWith(789, '1', 1);
        expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
          text: expect.stringContaining('Тестовая шаурма убран!'),
        });
      });

      test('должен удалять товар при уменьшении до 0', async () => {
        const { getItemById } = require('../src/menu');
        const botApiClient = require('../src/api-client');

        getItemById.mockReturnValue(mockMenuItem);
        const singleItemCart = { menuItem: mockMenuItem, quantity: 1 };
        botApiClient.default.getCart.mockResolvedValue([singleItemCart]);
        botApiClient.default.removeFromCart.mockResolvedValue(undefined);
        botApiClient.default.getCartTotal.mockResolvedValue({ total: 0, itemsCount: 0 });

        const query = {
          ...mockCallbackQuery,
          data: 'decrease_from_item_1',
        };

        await handleDecreaseFromItem(mockBot, query);

        expect(botApiClient.default.removeFromCart).toHaveBeenCalledWith(789, '1');
        expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
          text: 'Товар удален из корзины',
        });
      });

      test('должен обрабатывать попытку уменьшения товара не в корзине', async () => {
        const { getItemById } = require('../src/menu');
        const botApiClient = require('../src/api-client');

        getItemById.mockReturnValue(mockMenuItem);
        botApiClient.default.getCart.mockResolvedValue([]); // Пустая корзина

        const query = {
          ...mockCallbackQuery,
          data: 'decrease_from_item_1',
        };

        await handleDecreaseFromItem(mockBot, query);

        expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
          text: 'Товар не найден в корзине',
        });
      });
    });
  });

  // ===== ГРУППА 5: БЫСТРЫЕ ОПЕРАЦИИ =====

  describe('Quick Operations', () => {
    describe('handleQuickAdd', () => {
      test('должен быстро добавлять товар из каталога', async () => {
        const { getItemById } = require('../src/menu');
        const botApiClient = require('../src/api-client');

        getItemById.mockReturnValue(mockMenuItem);
        botApiClient.default.addToCart.mockResolvedValue(undefined);
        botApiClient.default.getCartTotal.mockResolvedValue({ total: 250, itemsCount: 1 });

        const query = {
          ...mockCallbackQuery,
          data: 'quick_add_1',
        };

        await handleQuickAdd(mockBot, query);

        expect(botApiClient.default.addToCart).toHaveBeenCalledWith(789, '1', 1);
        expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
          text: expect.stringContaining('Тестовая шаурма добавлен!'),
        });
      });

      test('должен обрабатывать ошибку быстрого добавления', async () => {
        const { getItemById } = require('../src/menu');
        const botApiClient = require('../src/api-client');

        getItemById.mockReturnValue(mockMenuItem);
        botApiClient.default.addToCart.mockRejectedValue(new Error('API Error'));

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const query = {
          ...mockCallbackQuery,
          data: 'quick_add_1',
        };

        await handleQuickAdd(mockBot, query);

        expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
          text: 'Ошибка при добавлении товара',
        });

        consoleSpy.mockRestore();
      });
    });

    describe('handleQuickIncrease', () => {
      test('должен быстро увеличивать количество из каталога', async () => {
        const { getItemById } = require('../src/menu');
        const botApiClient = require('../src/api-client');

        getItemById.mockReturnValue(mockMenuItem);
        botApiClient.default.getCart.mockResolvedValue([mockCartItem]);
        botApiClient.default.updateCartQuantity.mockResolvedValue(undefined);
        botApiClient.default.getCartTotal.mockResolvedValue({ total: 750, itemsCount: 3 });

        const query = {
          ...mockCallbackQuery,
          data: 'quick_increase_1',
        };

        await handleQuickIncrease(mockBot, query);

        expect(botApiClient.default.updateCartQuantity).toHaveBeenCalledWith(789, '1', 3);
        expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
          text: expect.stringContaining('Тестовая шаурма добавлен!'),
        });
      });
    });

    describe('handleQuickDecrease', () => {
      test('должен быстро уменьшать количество из каталога', async () => {
        const { getItemById } = require('../src/menu');
        const botApiClient = require('../src/api-client');

        getItemById.mockReturnValue(mockMenuItem);
        botApiClient.default.getCart.mockResolvedValue([mockCartItem]);
        botApiClient.default.updateCartQuantity.mockResolvedValue(undefined);
        botApiClient.default.getCartTotal.mockResolvedValue({ total: 250, itemsCount: 1 });

        const query = {
          ...mockCallbackQuery,
          data: 'quick_decrease_1',
        };

        await handleQuickDecrease(mockBot, query);

        expect(botApiClient.default.updateCartQuantity).toHaveBeenCalledWith(789, '1', 1);
        expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
          text: expect.stringContaining('Тестовая шаурма убран!'),
        });
      });

      test('должен удалять товар при уменьшении до 0', async () => {
        const { getItemById } = require('../src/menu');
        const botApiClient = require('../src/api-client');

        getItemById.mockReturnValue(mockMenuItem);
        const singleItemCart = { menuItem: mockMenuItem, quantity: 1 };
        botApiClient.default.getCart.mockResolvedValue([singleItemCart]);
        botApiClient.default.removeFromCart.mockResolvedValue(undefined);

        const query = {
          ...mockCallbackQuery,
          data: 'quick_decrease_1',
        };

        await handleQuickDecrease(mockBot, query);

        expect(botApiClient.default.removeFromCart).toHaveBeenCalledWith(789, '1');
        expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
          text: 'Тестовая шаурма удален из корзины',
        });
      });
    });
  });

  // ===== ГРУППА 6: EDGE CASES И ОБРАБОТКА ОШИБОК =====

  describe('Edge Cases & Error Handling', () => {
    test('должен обрабатывать отсутствие userId в различных функциях', async () => {
      const queryWithoutUser = {
        ...mockCallbackQuery,
        from: undefined,
      } as any;

      // Тестируем handleIncreaseFromItem
      await handleIncreaseFromItem(mockBot, queryWithoutUser);
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Ошибка обработки запроса',
      });

      jest.clearAllMocks();

      // Тестируем handleQuickAdd
      await handleQuickAdd(mockBot, queryWithoutUser);
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Ошибка обработки запроса',
      });
    });

    test('должен обрабатывать отсутствие itemId в различных функциях', async () => {
      const queryWithoutData = {
        ...mockCallbackQuery,
        data: undefined,
      } as any;

      // Тестируем handleDecreaseFromItem
      await handleDecreaseFromItem(mockBot, queryWithoutData);
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Ошибка обработки запроса',
      });

      jest.clearAllMocks();

      // Тестируем handleQuickIncrease
      await handleQuickIncrease(mockBot, queryWithoutData);
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Ошибка обработки запроса',
      });
    });

    test('должен обрабатывать товары не найденные в системе', async () => {
      const { getItemById } = require('../src/menu');
      getItemById.mockReturnValue(undefined);

      const query = {
        ...mockCallbackQuery,
        data: 'quick_add_999', // Несуществующий товар
      };

      await handleQuickAdd(mockBot, query);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Товар не найден',
      });
    });
  });
});
