import { handleItemSelection } from '../src/handlers';
import { BotInstance, BotCallbackQuery } from '../src/types';

// Мокаем модули
jest.mock('../src/menu', () => ({
  getItemById: jest.fn(),
}));

// Правильно мокаем api-client с default export
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

describe('Item Selection Handler', () => {
  let mockBot: jest.Mocked<BotInstance>;
  let mockQuery: BotCallbackQuery;

  beforeEach(() => {
    // Сброс всех моков
    jest.clearAllMocks();

    // Настройка мок-бота
    mockBot = {
      answerCallbackQuery: jest.fn().mockResolvedValue({}),
      sendPhoto: jest.fn().mockResolvedValue({}),
      sendMessage: jest.fn().mockResolvedValue({}),
      editMessageText: jest.fn().mockResolvedValue({}),
    } as any;

    // Настройка мок-query
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

    // Настройка моков модулей
    const { getItemById } = require('../src/menu');
    getItemById.mockReturnValue({
      id: '1',
      name: 'Тестовая шаурма',
      price: 250,
      description: 'Вкусная тестовая шаурма',
      category: 'shawarma',
      photo: 'assets/test-shawarma.jpg',
    });

    // Правильно настраиваем мок для default export
    const botApiClient = require('../src/api-client').default;
    botApiClient.getCart.mockResolvedValue([]);
    botApiClient.getCartTotal.mockResolvedValue({ total: 0, itemsCount: 0 });

    const databaseService = require('../src/database').default;
    databaseService.isInFavorites.mockResolvedValue(false);
  });

  test('должен быстро отвечать на callback query при выборе товара', async () => {
    await handleItemSelection(mockBot, mockQuery);

    // Проверяем что быстро ответили на callback query
    expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
      text: 'Загружаем Тестовая шаурма...',
    });
  });

  test('должен отправлять фото товара при успешной загрузке', async () => {
    await handleItemSelection(mockBot, mockQuery);

    // Проверяем что отправили фото
    expect(mockBot.sendPhoto).toHaveBeenCalledWith(
      789,
      'https://botgarden.store/assets/test-shawarma.jpg',
      expect.objectContaining({
        caption: expect.stringContaining('Тестовая шаурма'),
        reply_markup: expect.objectContaining({
          inline_keyboard: expect.any(Array),
        }),
      })
    );
  });

  test('должен fallback на текстовое сообщение при ошибке загрузки фото', async () => {
    // Симулируем ошибку отправки фото
    mockBot.sendPhoto.mockRejectedValue(new Error('Photo upload failed'));

    await handleItemSelection(mockBot, mockQuery);

    // Проверяем что сначала пытались отправить фото
    expect(mockBot.sendPhoto).toHaveBeenCalled();

    // Проверяем что отправили fallback текстовое сообщение
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      789,
      expect.stringContaining('📸'),
      expect.objectContaining({
        reply_markup: expect.objectContaining({
          inline_keyboard: expect.any(Array),
        }),
      })
    );
  });

  test('должен отправлять текстовое сообщение для товара без фото', async () => {
    // Настраиваем товар без фото
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

    // Проверяем что не пытались отправить фото
    expect(mockBot.sendPhoto).not.toHaveBeenCalled();

    // Проверяем что отправили текстовое сообщение
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

  test('должен показывать информацию о товаре в корзине', async () => {
    // Симулируем товар в корзине
    const botApiClient = require('../src/api-client').default;
    botApiClient.getCart.mockResolvedValue([
      {
        menuItem: { id: '1', name: 'Тестовая шаурма', price: 250 },
        quantity: 2,
      },
    ]);

    await handleItemSelection(mockBot, mockQuery);

    // Проверяем что сообщение содержит информацию о корзине
    const sentMessage =
      mockBot.sendPhoto.mock.calls[0]?.[2]?.caption || mockBot.sendMessage.mock.calls[0]?.[1];

    expect(sentMessage).toContain('В корзине: 2 шт. (500₽)');
  });

  test('должен обрабатывать ошибку при отсутствии товара', async () => {
    // Симулируем отсутствие товара
    const { getItemById } = require('../src/menu');
    getItemById.mockReturnValue(undefined);

    await handleItemSelection(mockBot, mockQuery);

    // Проверяем что ответили с ошибкой
    expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
      text: 'Товар не найден',
    });

    // Проверяем что не отправляли никаких других сообщений
    expect(mockBot.sendPhoto).not.toHaveBeenCalled();
    expect(mockBot.sendMessage).not.toHaveBeenCalled();
  });

  test('должен обрабатывать ошибку при отсутствии chatId', async () => {
    // Симулируем отсутствие chatId
    const queryWithoutChat = {
      ...mockQuery,
      message: undefined,
    } as BotCallbackQuery;

    await handleItemSelection(mockBot, queryWithoutChat);

    // Проверяем что ответили с ошибкой
    expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
      text: 'Ошибка обработки запроса',
    });
  });

  test('должен обрабатывать критические ошибки с fallback сообщением', async () => {
    // Симулируем критическую ошибку в API клиенте
    const botApiClient = require('../src/api-client').default;
    botApiClient.getCart.mockRejectedValue(new Error('Database connection failed'));

    await handleItemSelection(mockBot, mockQuery);

    // Проверяем что сначала ответили на callback query
    expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
      text: 'Загружаем Тестовая шаурма...',
    });

    // Проверяем что отправили сообщение об ошибке
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      789,
      expect.stringContaining('❌ Ошибка загрузки товара "Тестовая шаурма"'),
      expect.objectContaining({
        reply_markup: expect.objectContaining({
          inline_keyboard: [[{ text: 'Назад к каталогу', callback_data: 'back_to_menu' }]],
        }),
      })
    );
  });

  test('должен правильно формировать URL для фото', async () => {
    await handleItemSelection(mockBot, mockQuery);

    // Проверяем что URL сформирован правильно (убрал лишний assets/)
    expect(mockBot.sendPhoto).toHaveBeenCalledWith(
      789,
      'https://botgarden.store/assets/test-shawarma.jpg',
      expect.any(Object)
    );
  });
});
