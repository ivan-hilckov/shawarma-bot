import {
  handleStart,
  handleShawarmaMenu,
  handleDrinksMenu,
  handleAbout,
  handleItemSelection,
  handleBackToMenu,
} from "../src/handlers";
import { BotInstance, BotMessage, BotCallbackQuery } from "../src/types";

// Мокаем модуль menu
jest.mock("../src/menu", () => ({
  getMenuByCategory: jest.fn(),
  getItemById: jest.fn(),
}));

describe("Handlers Module", () => {
  let mockBot: jest.Mocked<BotInstance>;
  let mockMessage: BotMessage;
  let mockCallbackQuery: BotCallbackQuery;

  beforeEach(() => {
    // Создаем мок бота
    mockBot = {
      sendMessage: jest.fn(),
      editMessageText: jest.fn().mockResolvedValue(true),
      answerCallbackQuery: jest.fn().mockResolvedValue(true),
    } as any;

    // Создаем мок сообщения
    mockMessage = {
      chat: { id: 123456 },
      from: { first_name: "TestUser", id: 789 },
      message_id: 1,
    } as BotMessage;

    // Создаем мок callback query
    mockCallbackQuery = {
      id: "callback_123",
      from: { first_name: "TestUser", id: 789 },
      message: {
        chat: { id: 123456 },
        message_id: 1,
      },
      data: "item_1",
    } as BotCallbackQuery;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("handleStart", () => {
    test("должен отправлять приветственное сообщение", () => {
      handleStart(mockBot, mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining("Привет, TestUser!"),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            keyboard: expect.arrayContaining([
              expect.arrayContaining([{ text: "🌯 Шаурма" }, { text: "🥤 Напитки" }]),
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

      handleStart(mockBot, messageWithoutName);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining("Привет, Друг!"),
        expect.any(Object)
      );
    });
  });

  describe("handleAbout", () => {
    test("должен отправлять информацию о заведении", () => {
      handleAbout(mockBot, mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(123456, expect.stringContaining("О нас:"));
    });
  });

  describe("handleShawarmaMenu", () => {
    test("должен отправлять меню шаурмы", () => {
      const { getMenuByCategory } = require("../src/menu");
      getMenuByCategory.mockReturnValue([
        {
          id: "1",
          name: "Тестовая шаурма",
          price: 250,
          description: "Тестовое описание",
          category: "shawarma",
        },
      ]);

      handleShawarmaMenu(mockBot, mockMessage);

      expect(getMenuByCategory).toHaveBeenCalledWith("shawarma");
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining("Наша шаурма:"),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.any(Array),
          }),
        })
      );
    });

    test("должен обрабатывать пустое меню шаурмы", () => {
      const { getMenuByCategory } = require("../src/menu");
      getMenuByCategory.mockReturnValue([]);

      handleShawarmaMenu(mockBot, mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining("Наша шаурма:"),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: [[{ text: "🔙 Назад в меню", callback_data: "back_to_menu" }]],
          }),
        })
      );
    });

    test("должен правильно форматировать множественные товары", () => {
      const { getMenuByCategory } = require("../src/menu");
      getMenuByCategory.mockReturnValue([
        {
          id: "1",
          name: "Шаурма 1",
          price: 250,
          description: "Описание 1",
          category: "shawarma",
        },
        {
          id: "2",
          name: "Шаурма 2",
          price: 300,
          description: "Описание 2",
          category: "shawarma",
        },
      ]);

      handleShawarmaMenu(mockBot, mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringMatching(/1\. Шаурма 1[\s\S]*2\. Шаурма 2/),
        expect.any(Object)
      );
    });
  });

  describe("handleDrinksMenu", () => {
    test("должен отправлять меню напитков", () => {
      const { getMenuByCategory } = require("../src/menu");
      getMenuByCategory.mockReturnValue([
        {
          id: "4",
          name: "Тестовый напиток",
          price: 100,
          description: "Тестовое описание",
          category: "drinks",
        },
      ]);

      handleDrinksMenu(mockBot, mockMessage);

      expect(getMenuByCategory).toHaveBeenCalledWith("drinks");
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining("Наши напитки:"),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.any(Array),
          }),
        })
      );
    });

    test("должен обрабатывать пустое меню напитков", () => {
      const { getMenuByCategory } = require("../src/menu");
      getMenuByCategory.mockReturnValue([]);

      handleDrinksMenu(mockBot, mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining("Наши напитки:"),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: [[{ text: "🔙 Назад в меню", callback_data: "back_to_menu" }]],
          }),
        })
      );
    });
  });

  describe("handleItemSelection", () => {
    test("должен обрабатывать выбор товара", () => {
      const { getItemById } = require("../src/menu");
      getItemById.mockReturnValue({
        id: "1",
        name: "Тестовая шаурма",
        price: 250,
        description: "Тестовое описание",
        category: "shawarma",
      });

      handleItemSelection(mockBot, mockCallbackQuery);

      expect(getItemById).toHaveBeenCalledWith("1");
      expect(mockBot.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining("Вы выбрали: Тестовая шаурма"),
        expect.objectContaining({
          chat_id: 123456,
          message_id: 1,
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.any(Array),
          }),
        })
      );
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith("callback_123", {
        text: "Выбрано: Тестовая шаурма",
      });
    });

    test("должен обрабатывать ошибку когда chatId отсутствует", () => {
      const queryWithoutChat = {
        ...mockCallbackQuery,
        message: undefined,
      } as BotCallbackQuery;

      handleItemSelection(mockBot, queryWithoutChat);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith("callback_123", {
        text: "Ошибка обработки запроса",
      });
      expect(mockBot.editMessageText).not.toHaveBeenCalled();
    });

    test("должен обрабатывать ошибку когда itemId отсутствует", () => {
      const queryWithoutData = {
        ...mockCallbackQuery,
        data: undefined,
      } as BotCallbackQuery;

      handleItemSelection(mockBot, queryWithoutData);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith("callback_123", {
        text: "Ошибка обработки запроса",
      });
      expect(mockBot.editMessageText).not.toHaveBeenCalled();
    });

    test("должен обрабатывать ошибку когда товар не найден", () => {
      const { getItemById } = require("../src/menu");
      getItemById.mockReturnValue(undefined);

      handleItemSelection(mockBot, mockCallbackQuery);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith("callback_123", {
        text: "Товар не найден",
      });
      expect(mockBot.editMessageText).not.toHaveBeenCalled();
    });

    test("должен работать без message_id", () => {
      const { getItemById } = require("../src/menu");
      getItemById.mockReturnValue({
        id: "1",
        name: "Тестовая шаурма",
        price: 250,
        description: "Тестовое описание",
        category: "shawarma",
      });

      const queryWithoutMessageId = {
        ...mockCallbackQuery,
        message: {
          chat: { id: 123456 },
        },
      } as BotCallbackQuery;

      handleItemSelection(mockBot, queryWithoutMessageId);

      expect(mockBot.editMessageText).not.toHaveBeenCalled();
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith("callback_123", {
        text: "Выбрано: Тестовая шаурма",
      });
    });
  });

  describe("handleBackToMenu", () => {
    test("должен возвращать в главное меню", () => {
      const backQuery = {
        ...mockCallbackQuery,
        data: "back_to_menu",
      } as BotCallbackQuery;

      handleBackToMenu(mockBot, backQuery);

      expect(mockBot.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining("Привет, TestUser!"),
        expect.objectContaining({
          chat_id: 123456,
          message_id: 1,
        })
      );
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith("callback_123");
    });

    test("должен использовать 'Друг' если имя пользователя не указано", () => {
      const queryWithoutName = {
        ...mockCallbackQuery,
        from: { id: 789 },
        data: "back_to_menu",
      } as BotCallbackQuery;

      handleBackToMenu(mockBot, queryWithoutName);

      expect(mockBot.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining("Привет, Друг!"),
        expect.any(Object)
      );
    });

    test("должен обрабатывать ошибку когда chatId отсутствует", () => {
      const queryWithoutChat = {
        ...mockCallbackQuery,
        message: undefined,
        data: "back_to_menu",
      } as BotCallbackQuery;

      handleBackToMenu(mockBot, queryWithoutChat);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith("callback_123", {
        text: "Ошибка обработки запроса",
      });
      expect(mockBot.editMessageText).not.toHaveBeenCalled();
    });

    test("должен работать без message_id", () => {
      const queryWithoutMessageId = {
        ...mockCallbackQuery,
        message: {
          chat: { id: 123456 },
        },
        data: "back_to_menu",
      } as BotCallbackQuery;

      handleBackToMenu(mockBot, queryWithoutMessageId);

      expect(mockBot.editMessageText).not.toHaveBeenCalled();
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith("callback_123");
    });
  });
});
