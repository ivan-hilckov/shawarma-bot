import { handleItemSelection } from '../src/handlers';
import { BotInstance, BotCallbackQuery } from '../src/types';

// Мокаем все внешние зависимости
jest.mock('../src/menu', () => ({
  getItemById: jest.fn(),
}));

jest.mock('../src/api-client', () => ({
  default: {
    getCart: jest.fn(),
    getCartTotal: jest.fn(),
  },
}));

jest.mock('../src/database', () => ({
  default: {
    isInFavorites: jest.fn(),
  },
}));

jest.mock('../src/config', () => ({
  default: {
    ASSETS_BASE_URL: 'https://botgarden.store/assets',
  },
}));

// Подавляем console логи в тестах
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

describe('Item Selection Handler', () => {
  let mockBot: jest.Mocked<BotInstance>;
  let mockQuery: BotCallbackQuery;

  beforeEach(() => {
    jest.clearAllMocks();

    mockBot = {
      answerCallbackQuery: jest.fn().mockResolvedValue({}),
      sendPhoto: jest.fn().mockResolvedValue({}),
      sendMessage: jest.fn().mockResolvedValue({}),
      editMessageText: jest.fn().mockResolvedValue({}),
    } as any;

    mockQuery = {
      id: 'callback_123',
      from: {
        id: 123456,
        first_name: 'TestUser',
        is_bot: false,
      },
      data: 'item_1',
      message: {
        chat: { id: 789, type: 'private' },
        message_id: 456,
        date: Date.now(),
      },
    } as BotCallbackQuery;

    // Настройка моков
    const { getItemById } = require('../src/menu');
    getItemById.mockReturnValue({
      id: '1',
      name: 'Тестовая шаурма',
      price: 250,
      description: 'Вкусная тестовая шаурма',
      category: 'shawarma',
      photo: 'assets/test-shawarma.jpg',
    });

    const botApiClient = require('../src/api-client').default;
    botApiClient.getCart.mockResolvedValue([]);
    botApiClient.getCartTotal.mockResolvedValue({ total: 0, itemsCount: 0 });

    const databaseService = require('../src/database').default;
    databaseService.isInFavorites.mockResolvedValue(false);
  });

  test('должен отвечать на callback query при выборе товара', async () => {
    await handleItemSelection(mockBot, mockQuery);

    expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
      text: 'Загружаем Тестовая шаурма...',
    });
  });

  test('должен обрабатывать товар без фото', async () => {
    const { getItemById } = require('../src/menu');
    getItemById.mockReturnValue({
      id: '8',
      name: 'Кола',
      price: 100,
      description: 'Освежающая Coca-Cola',
      category: 'drinks',
      // нет поля photo
    });

    await handleItemSelection(mockBot, mockQuery);

    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      789,
      expect.stringContaining('Кола'),
      expect.objectContaining({
        reply_markup: expect.objectContaining({
          inline_keyboard: expect.any(Array),
        }),
      })
    );
  });

  test('должен обрабатывать ошибку при отсутствии товара', async () => {
    const { getItemById } = require('../src/menu');
    getItemById.mockReturnValue(undefined);

    await handleItemSelection(mockBot, mockQuery);

    expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
      text: 'Товар не найден',
    });
  });

  test('должен обрабатывать ошибку при отсутствии chatId', async () => {
    const queryWithoutChat = {
      ...mockQuery,
      message: undefined,
    } as BotCallbackQuery;

    await handleItemSelection(mockBot, queryWithoutChat);

    expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
      text: 'Ошибка обработки запроса',
    });
  });
});
