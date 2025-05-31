import {
  handleStart,
  handleShawarmaMenu,
  handleDrinksMenu,
  handleAbout,
  handleItemSelection,
  handleBackToMenu,
  handleMiniApp,
  handleAboutMiniApp,
  handleBackToStart,
} from '../src/handlers';
import { BotInstance, BotMessage, BotCallbackQuery } from '../src/types';

// Мокаем модуль menu
jest.mock('../src/menu', () => ({
  getMenuByCategory: jest.fn(),
  getItemById: jest.fn(),
}));

// Мокаем API клиент
jest.mock('../src/api-client', () => ({
  default: {
    getCart: jest.fn().mockResolvedValue([]),
    getCartTotal: jest.fn().mockResolvedValue({ itemsCount: 0, total: 0 }),
    addToCart: jest.fn().mockResolvedValue({}),
    updateCartQuantity: jest.fn().mockResolvedValue({}),
    removeFromCart: jest.fn().mockResolvedValue({}),
    clearCart: jest.fn().mockResolvedValue({}),
  },
}));

// Мокаем database service
jest.mock('../src/database', () => ({
  isInFavorites: jest.fn().mockResolvedValue(false),
  addToFavorites: jest.fn().mockResolvedValue(undefined),
  removeFromFavorites: jest.fn().mockResolvedValue(undefined),
  getUserFavorites: jest.fn().mockResolvedValue([]),
  getUserRecommendations: jest.fn().mockResolvedValue([]),
  getUserStats: jest.fn().mockResolvedValue({
    totalOrders: 0,
    totalSpent: 0,
    favoriteCategory: 'shawarma',
    avgOrderValue: 0,
  }),
}));

describe('Handlers Module', () => {
  let mockBot: jest.Mocked<BotInstance>;
  let mockMessage: BotMessage;
  let mockCallbackQuery: BotCallbackQuery;

  beforeEach(() => {
    // Создаем мок бота
    mockBot = {
      sendMessage: jest.fn(),
      editMessageText: jest.fn().mockResolvedValue(true),
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
      data: 'item_1',
    } as BotCallbackQuery;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleStart', () => {
    test('должен отправлять приветственное сообщение с упрощенной клавиатурой', async () => {
      await handleStart(mockBot, mockMessage);

      // Проверяем сообщение с новой упрощенной клавиатурой
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining('Привет, TestUser!'),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            keyboard: expect.arrayContaining([
              expect.arrayContaining([{ text: '🌯 Шаурма' }, { text: '🥤 Напитки' }]),
              expect.arrayContaining([{ text: '🛒 Корзина' }, { text: '👤 Профиль' }]),
              expect.arrayContaining([{ text: 'ℹ️ О нас' }]),
            ]),
          }),
        })
      );
    });

    test('должен отправлять одно сообщение', async () => {
      await handleStart(mockBot, mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledTimes(1);
    });

    test("должен использовать 'Друг' если имя пользователя не указано", async () => {
      const messageWithoutName = {
        ...mockMessage,
        from: { id: 789 },
      } as BotMessage;

      await handleStart(mockBot, messageWithoutName);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining('Привет, Друг!'),
        expect.any(Object)
      );
    });
  });

  describe('handleAbout', () => {
    test('должен отправлять информацию о заведении с Mini App кнопками', () => {
      handleAbout(mockBot, mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining('О нас ℹ️'),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: '🌯 Открыть Шаурма App',
                  web_app: { url: 'https://botgarden.store/' },
                }),
              ]),
              expect.arrayContaining([
                expect.objectContaining({
                  callback_data: 'about_miniapp',
                  text: '📱 Что такое Mini App?',
                }),
              ]),
            ]),
          }),
        })
      );
    });
  });

  describe('handleShawarmaMenu', () => {
    test('должен отправлять меню шаурмы', async () => {
      const { getMenuByCategory } = require('../src/menu');
      getMenuByCategory.mockReturnValue([
        {
          id: '1',
          name: 'Тестовая шаурма',
          price: 250,
          description: 'Тестовое описание',
          category: 'shawarma',
        },
      ]);

      await handleShawarmaMenu(mockBot, mockMessage);

      expect(getMenuByCategory).toHaveBeenCalledWith('shawarma');
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining('Наша шаурма 🌯'),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.any(Array),
          }),
        })
      );
    });

    test('должен обрабатывать пустое меню шаурмы', async () => {
      const { getMenuByCategory } = require('../src/menu');
      getMenuByCategory.mockReturnValue([]);

      await handleShawarmaMenu(mockBot, mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining('Наша шаурма 🌯'),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: [[{ callback_data: 'back_to_menu', text: 'Назад в меню' }]],
          }),
        })
      );
    });

    test('должен правильно форматировать множественные товары', async () => {
      const { getMenuByCategory } = require('../src/menu');
      getMenuByCategory.mockReturnValue([
        {
          id: '1',
          name: 'Шаурма 1',
          price: 250,
          description: 'Описание 1',
          category: 'shawarma',
        },
        {
          id: '2',
          name: 'Шаурма 2',
          price: 300,
          description: 'Описание 2',
          category: 'shawarma',
        },
      ]);

      await handleShawarmaMenu(mockBot, mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringMatching(/1\. Шаурма 1[\s\S]*2\. Шаурма 2/),
        expect.any(Object)
      );
    });
  });

  describe('handleDrinksMenu', () => {
    test('должен отправлять меню напитков', async () => {
      const { getMenuByCategory } = require('../src/menu');
      getMenuByCategory.mockReturnValue([
        {
          id: '4',
          name: 'Тестовый напиток',
          price: 100,
          description: 'Тестовое описание',
          category: 'drinks',
        },
      ]);

      await handleDrinksMenu(mockBot, mockMessage);

      expect(getMenuByCategory).toHaveBeenCalledWith('drinks');
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining('Наши напитки 🥤'),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.any(Array),
          }),
        })
      );
    });

    test('должен обрабатывать пустое меню напитков', async () => {
      const { getMenuByCategory } = require('../src/menu');
      getMenuByCategory.mockReturnValue([]);

      await handleDrinksMenu(mockBot, mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining('Наши напитки 🥤'),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: [[{ callback_data: 'back_to_menu', text: 'Назад в меню' }]],
          }),
        })
      );
    });
  });

  describe('handleItemSelection', () => {
    test('должен обрабатывать выбор товара', async () => {
      const { getItemById } = require('../src/menu');
      getItemById.mockReturnValue({
        id: '1',
        name: 'Тестовая шаурма',
        price: 250,
        description: 'Тестовое описание',
        category: 'shawarma',
      });

      await handleItemSelection(mockBot, mockCallbackQuery);

      expect(getItemById).toHaveBeenCalledWith('1');
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith(
        'callback_123',
        expect.objectContaining({ text: '📝 Информация загружена' })
      );
    });

    test('должен обрабатывать ошибку когда chatId отсутствует', async () => {
      const queryWithoutChat = {
        ...mockCallbackQuery,
        message: undefined,
      } as BotCallbackQuery;

      await handleItemSelection(mockBot, queryWithoutChat);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Ошибка обработки запроса',
      });
    });

    test('должен обрабатывать ошибку когда itemId отсутствует', async () => {
      const queryWithoutData = {
        ...mockCallbackQuery,
        data: undefined,
      } as BotCallbackQuery;

      await handleItemSelection(mockBot, queryWithoutData);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Ошибка обработки запроса',
      });
    });

    test('должен обрабатывать ошибку когда товар не найден', async () => {
      const { getItemById } = require('../src/menu');
      getItemById.mockReturnValue(undefined);

      await handleItemSelection(mockBot, mockCallbackQuery);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Товар не найден',
      });
    });

    test('должен работать без message_id', async () => {
      const { getItemById } = require('../src/menu');
      getItemById.mockReturnValue({
        id: '1',
        name: 'Тестовая шаурма',
        price: 250,
        description: 'Тестовое описание',
        category: 'shawarma',
      });

      const queryWithoutMessageId = {
        ...mockCallbackQuery,
        message: {
          chat: { id: 123456 },
        },
      } as BotCallbackQuery;

      await handleItemSelection(mockBot, queryWithoutMessageId);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith(
        'callback_123',
        expect.objectContaining({ text: '📝 Информация загружена' })
      );
    });
  });

  describe('handleBackToMenu', () => {
    test('должен возвращать в главное меню', async () => {
      const backQuery = {
        ...mockCallbackQuery,
        data: 'back_to_menu',
      } as BotCallbackQuery;

      await handleBackToMenu(mockBot, backQuery);

      expect(mockBot.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Привет, TestUser!'),
        expect.objectContaining({
          chat_id: 123456,
          message_id: 1,
        })
      );
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith(
        'callback_123',
        expect.objectContaining({ text: expect.stringContaining('Возврат в главное меню') })
      );
    });

    test("должен использовать 'Друг' если имя пользователя не указано", async () => {
      const queryWithoutName = {
        ...mockCallbackQuery,
        from: { id: 789 },
        data: 'back_to_menu',
      } as BotCallbackQuery;

      await handleBackToMenu(mockBot, queryWithoutName);

      expect(mockBot.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Привет, Друг!'),
        expect.any(Object)
      );
    });

    test('должен обрабатывать ошибку когда chatId отсутствует', async () => {
      const queryWithoutChat = {
        ...mockCallbackQuery,
        message: undefined,
        data: 'back_to_menu',
      } as BotCallbackQuery;

      await handleBackToMenu(mockBot, queryWithoutChat);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Ошибка обработки запроса',
      });
    });

    test('должен работать без message_id', async () => {
      const queryWithoutMessageId = {
        ...mockCallbackQuery,
        message: {
          chat: { id: 123456 },
        },
        data: 'back_to_menu',
      } as BotCallbackQuery;

      await handleBackToMenu(mockBot, queryWithoutMessageId);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith(
        'callback_123',
        expect.objectContaining({ text: expect.stringContaining('Возврат в главное меню') })
      );
    });
  });

  describe('handleMiniApp', () => {
    test('должен отправлять информацию о Mini App с кнопкой запуска', () => {
      handleMiniApp(mockBot, mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining('Привет, TestUser! 👋'),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: '🌯 Открыть Шаурма App',
                  web_app: { url: 'https://botgarden.store/' },
                }),
              ]),
              expect.arrayContaining([
                expect.objectContaining({
                  callback_data: 'about_miniapp',
                  text: '📱 Что такое Mini App?',
                }),
              ]),
              expect.arrayContaining([
                expect.objectContaining({
                  callback_data: 'back_to_menu',
                  text: 'Назад в меню',
                }),
              ]),
            ]),
          }),
        })
      );
    });

    test("должен использовать 'Друг' если имя пользователя не указано", () => {
      const messageWithoutName = {
        ...mockMessage,
        from: { id: 789 },
      } as BotMessage;

      handleMiniApp(mockBot, messageWithoutName);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining('Привет, Друг! 👋'),
        expect.any(Object)
      );
    });

    test('должен отправлять сообщение с корректным содержимым', () => {
      handleMiniApp(mockBot, mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringMatching(
          /Полное меню с фотографиями[\s\S]*Удобное добавление товаров в корзину[\s\S]*Оформление заказов онлайн/
        ),
        expect.any(Object)
      );
    });
  });

  describe('handleAboutMiniApp', () => {
    test('должен отправлять информацию о Mini App', async () => {
      await handleAboutMiniApp(mockBot, mockCallbackQuery);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Информация о Mini App',
      });

      expect(mockBot.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Что такое Telegram Mini App? 📱'),
        expect.objectContaining({
          chat_id: 123456,
          message_id: 1,
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: '🌯 Открыть Шаурма App',
                  web_app: { url: 'https://botgarden.store/' },
                }),
              ]),
              expect.arrayContaining([
                expect.objectContaining({
                  callback_data: 'back_to_start',
                  text: 'Назад к началу',
                }),
              ]),
            ]),
          }),
        })
      );
    });

    test('должен обрабатывать ошибку когда сообщение отсутствует', async () => {
      const queryWithoutMessage = {
        ...mockCallbackQuery,
        message: undefined,
      } as BotCallbackQuery;

      await handleAboutMiniApp(mockBot, queryWithoutMessage);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Информация о Mini App',
      });
      expect(mockBot.editMessageText).not.toHaveBeenCalled();
    });

    test('должен обрабатывать ошибки при редактировании сообщения', async () => {
      mockBot.editMessageText.mockRejectedValue(new Error('Edit failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await handleAboutMiniApp(mockBot, mockCallbackQuery);

      expect(consoleSpy).toHaveBeenCalledWith('Error handling about mini app:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('handleBackToStart', () => {
    test('должен возвращать к начальному сообщению с Mini App', async () => {
      await handleBackToStart(mockBot, mockCallbackQuery);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Возврат к началу',
      });

      expect(mockBot.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Попробуйте наше мини-приложение! 🚀'),
        expect.objectContaining({
          chat_id: 123456,
          message_id: 1,
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: '🌯 Открыть Шаурма App',
                  web_app: { url: 'https://botgarden.store/' },
                }),
              ]),
              expect.arrayContaining([
                expect.objectContaining({
                  callback_data: 'about_miniapp',
                  text: '📱 Что такое Mini App?',
                }),
              ]),
            ]),
          }),
        })
      );
    });

    test('должен обрабатывать ошибку когда сообщение отсутствует', async () => {
      const queryWithoutMessage = {
        ...mockCallbackQuery,
        message: undefined,
      } as BotCallbackQuery;

      await handleBackToStart(mockBot, queryWithoutMessage);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Возврат к началу',
      });
      expect(mockBot.editMessageText).not.toHaveBeenCalled();
    });

    test('должен обрабатывать ошибки при редактировании сообщения', async () => {
      mockBot.editMessageText.mockRejectedValue(new Error('Edit failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await handleBackToStart(mockBot, mockCallbackQuery);

      expect(consoleSpy).toHaveBeenCalledWith('Error handling back to start:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
