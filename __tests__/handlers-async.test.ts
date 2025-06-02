import {
  handleAddToCart,
  handleViewCart,
  handleIncreaseQuantity,
  handleDecreaseQuantity,
  handleRemoveFromCart,
  handleClearCart,
  handleCheckout,
  handleMyOrders,
  handleAdminOrderAction,
} from '../src/handlers';
import { BotInstance, BotMessage, BotCallbackQuery, MenuItem, CartItem, Order } from '../src/types';

// Мокаем зависимости
jest.mock('../src/menu', () => ({
  getItemById: jest.fn(),
}));

jest.mock('../src/api-client', () => ({
  addToCart: jest.fn(),
  getCart: jest.fn(),
  getCartTotal: jest.fn(),
  updateCartQuantity: jest.fn(),
  removeFromCart: jest.fn(),
  clearCart: jest.fn(),
}));

jest.mock('../src/database', () => ({
  upsertUser: jest.fn(),
  createOrder: jest.fn(),
  getOrderById: jest.fn(),
  getUserOrders: jest.fn(),
  updateOrderStatus: jest.fn(),
}));

describe('Async Handlers', () => {
  let mockBot: jest.Mocked<BotInstance>;
  let mockMessage: BotMessage;
  let mockCallbackQuery: BotCallbackQuery;
  let mockMenuItem: MenuItem;
  let mockCartItem: CartItem;
  let mockOrder: Order;

  beforeEach(() => {
    // Создаем мок бота
    mockBot = {
      sendMessage: jest.fn().mockResolvedValue(true),
      editMessageText: jest.fn().mockResolvedValue(true),
      answerCallbackQuery: jest.fn().mockResolvedValue(true),
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
      from: { first_name: 'TestUser', id: 789, username: 'testuser' },
      message: {
        chat: { id: 123456 },
        message_id: 1,
      },
      data: 'add_to_cart_1',
    } as BotCallbackQuery;

    // Создаем мок товара
    mockMenuItem = {
      id: '1',
      name: 'Тестовая шаурма',
      description: 'Описание тестовой шаурмы',
      price: 250,
      category: 'shawarma',
    };

    // Создаем мок элемента корзины
    mockCartItem = {
      menuItem: mockMenuItem,
      quantity: 2,
    };

    // Создаем мок заказа
    mockOrder = {
      id: '42',
      userId: 789,
      userName: 'TestUser',
      items: [mockCartItem],
      totalPrice: 500,
      status: 'pending',
      createdAt: new Date(),
    };

    // Настраиваем serviceRegistry с мок notificationService
    const { serviceRegistry } = require('../src/services');
    const mockNotificationService = {
      notifyNewOrder: jest.fn().mockResolvedValue(undefined),
      notifyStatusChange: jest.fn().mockResolvedValue(undefined),
      isAdmin: jest.fn().mockReturnValue(false),
    };

    // Очищаем и регистрируем мок
    serviceRegistry.services = {};
    serviceRegistry.register('notifications', mockNotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleAddToCart', () => {
    test('должен добавлять товар в корзину', async () => {
      const { getItemById } = require('../src/menu');
      const botApiClient = require('../src/api-client');

      getItemById.mockReturnValue(mockMenuItem);

      // Мокаем API вызовы
      botApiClient.addToCart = jest.fn().mockResolvedValue(undefined);
      botApiClient.getCartTotal = jest.fn().mockResolvedValue({ total: 750, itemsCount: 3 });
      botApiClient.getCart = jest.fn().mockResolvedValue([mockCartItem]);

      await handleAddToCart(mockBot, mockCallbackQuery);

      expect(getItemById).toHaveBeenCalledWith('1');
      expect(botApiClient.addToCart).toHaveBeenCalledWith(789, '1', 1);

      // Проверяем улучшенное уведомление
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Тестовая шаурма добавлен! В корзине: 3 товаров на 750₽',
      });

      // После изменений handleAddToCart теперь вызывает handleItemSelection
      // поэтому может быть второй вызов answerCallbackQuery
    });

    it('должен обрабатывать ошибку когда товар не найден', async () => {
      const { getItemById } = require('../src/menu');
      getItemById.mockReturnValue(undefined);

      await handleAddToCart(mockBot, mockCallbackQuery);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Товар не найден',
      });
    });

    it('должен обрабатывать ошибки при добавлении в корзину', async () => {
      const { getItemById } = require('../src/menu');
      const botApiClient = require('../src/api-client');

      getItemById.mockReturnValue(mockMenuItem);
      botApiClient.addToCart.mockRejectedValue(new Error('API error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await handleAddToCart(mockBot, mockCallbackQuery);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Ошибка при добавлении в корзину',
      });

      consoleSpy.mockRestore();
    });
  });

  describe('handleViewCart', () => {
    it('должен показывать корзину с товарами', async () => {
      const botApiClient = require('../src/api-client');

      botApiClient.getCart.mockResolvedValue([mockCartItem]);
      botApiClient.getCartTotal.mockResolvedValue({ itemsCount: 2, total: 500 });

      await handleViewCart(mockBot, mockCallbackQuery);

      expect(botApiClient.getCart).toHaveBeenCalledWith(789);
      expect(botApiClient.getCartTotal).toHaveBeenCalledWith(789);
      expect(mockBot.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Ваша корзина 🛒'),
        expect.objectContaining({
          chat_id: 123456,
          message_id: 1,
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([expect.objectContaining({ text: 'Оформить заказ' })]),
            ]),
          }),
        })
      );
    });

    it('должен показывать пустую корзину', async () => {
      const botApiClient = require('../src/api-client');

      botApiClient.getCart.mockResolvedValue([]);

      await handleViewCart(mockBot, mockCallbackQuery);

      expect(mockBot.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Ваша корзина пуста 🛒'),
        expect.objectContaining({
          chat_id: 123456,
          message_id: 1,
        })
      );
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Корзина пуста',
      });
    });

    it('должен работать с обычным сообщением', async () => {
      const botApiClient = require('../src/api-client');

      botApiClient.getCart.mockResolvedValue([mockCartItem]);
      botApiClient.getCartTotal.mockResolvedValue({ itemsCount: 2, total: 500 });

      await handleViewCart(mockBot, mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining('Ваша корзина 🛒'),
        expect.any(Object)
      );
    });
  });

  describe('handleIncreaseQuantity', () => {
    it('должен увеличивать количество товара', async () => {
      const botApiClient = require('../src/api-client');

      botApiClient.getCart.mockResolvedValue([mockCartItem]);
      botApiClient.updateCartQuantity.mockResolvedValue(undefined);

      const query = {
        ...mockCallbackQuery,
        data: 'increase_1',
      };

      await handleIncreaseQuantity(mockBot, query);

      expect(botApiClient.updateCartQuantity).toHaveBeenCalledWith(789, '1', 3);
    });

    it('должен обрабатывать ошибки при увеличении количества', async () => {
      const botApiClient = require('../src/api-client');

      botApiClient.getCart.mockRejectedValue(new Error('Cart error'));

      const query = {
        ...mockCallbackQuery,
        data: 'increase_1',
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await handleIncreaseQuantity(mockBot, query);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Ошибка при изменении количества',
      });

      consoleSpy.mockRestore();
    });
  });

  describe('handleDecreaseQuantity', () => {
    it('должен уменьшать количество товара', async () => {
      const botApiClient = require('../src/api-client');

      botApiClient.getCart.mockResolvedValue([mockCartItem]);
      botApiClient.updateCartQuantity.mockResolvedValue(undefined);

      const query = {
        ...mockCallbackQuery,
        data: 'decrease_1',
      };

      await handleDecreaseQuantity(mockBot, query);

      expect(botApiClient.updateCartQuantity).toHaveBeenCalledWith(789, '1', 1);
    });

    it('должен удалять товар при количестве 0', async () => {
      const botApiClient = require('../src/api-client');

      const singleItemCart = {
        menuItem: mockMenuItem,
        quantity: 1,
      };

      botApiClient.getCart.mockResolvedValue([singleItemCart]);
      botApiClient.removeFromCart.mockResolvedValue(undefined);

      const query = {
        ...mockCallbackQuery,
        data: 'decrease_1',
      };

      await handleDecreaseQuantity(mockBot, query);

      expect(botApiClient.removeFromCart).toHaveBeenCalledWith(789, '1');
    });
  });

  describe('handleRemoveFromCart', () => {
    it('должен удалять товар из корзины', async () => {
      const botApiClient = require('../src/api-client');

      botApiClient.removeFromCart.mockResolvedValue(undefined);

      const query = {
        ...mockCallbackQuery,
        data: 'remove_1',
      };

      await handleRemoveFromCart(mockBot, query);

      expect(botApiClient.removeFromCart).toHaveBeenCalledWith(789, '1');
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Товар удален из корзины',
      });
    });
  });

  describe('handleClearCart', () => {
    it('должен очищать корзину', async () => {
      const botApiClient = require('../src/api-client');

      botApiClient.clearCart.mockResolvedValue(undefined);

      await handleClearCart(mockBot, mockCallbackQuery);

      expect(botApiClient.clearCart).toHaveBeenCalledWith(789);
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Корзина очищена',
      });
    });
  });

  describe('handleCheckout', () => {
    it('должен оформлять заказ', async () => {
      const botApiClient = require('../src/api-client');
      const databaseService = require('../src/database');

      botApiClient.getCart.mockResolvedValue([mockCartItem]);
      botApiClient.getCartTotal.mockResolvedValue({ itemsCount: 2, total: 500 });
      botApiClient.clearCart.mockResolvedValue(undefined);
      databaseService.upsertUser.mockResolvedValue(undefined);
      databaseService.createOrder.mockResolvedValue('42');
      databaseService.getOrderById.mockResolvedValue(mockOrder);

      await handleCheckout(mockBot, mockCallbackQuery);

      expect(databaseService.upsertUser).toHaveBeenCalledWith(789, 'testuser', 'TestUser');
      expect(databaseService.createOrder).toHaveBeenCalledWith(789, [mockCartItem], 500);
      expect(botApiClient.clearCart).toHaveBeenCalledWith(789);
      expect(mockBot.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('✅ **Заказ успешно оформлен!**'),
        expect.objectContaining({
          chat_id: 123456,
          message_id: 1,
        })
      );
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: expect.stringContaining('🎉 Заказ #42 оформлен!'),
      });
    });

    it('должен обрабатывать пустую корзину при оформлении', async () => {
      const botApiClient = require('../src/api-client');

      botApiClient.getCart.mockResolvedValue([]);

      await handleCheckout(mockBot, mockCallbackQuery);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Корзина пуста',
      });
    });

    it('должен обрабатывать ошибки при оформлении заказа', async () => {
      const botApiClient = require('../src/api-client');
      const databaseService = require('../src/database');

      botApiClient.getCart.mockResolvedValue([mockCartItem]);
      botApiClient.getCartTotal.mockResolvedValue({ itemsCount: 2, total: 500 });
      databaseService.createOrder.mockRejectedValue(new Error('DB error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await handleCheckout(mockBot, mockCallbackQuery);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Ошибка при оформлении заказа',
      });

      consoleSpy.mockRestore();
    });
  });

  describe('handleMyOrders', () => {
    it('должен показывать заказы пользователя', async () => {
      const databaseService = require('../src/database');

      databaseService.getUserOrders.mockResolvedValue([mockOrder]);

      await handleMyOrders(mockBot, mockCallbackQuery);

      expect(databaseService.getUserOrders).toHaveBeenCalledWith(789, 5);
      expect(mockBot.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('Ваши заказы 📋'),
        expect.objectContaining({
          chat_id: 123456,
          message_id: 1,
        })
      );
    });

    it('должен показывать сообщение об отсутствии заказов', async () => {
      const databaseService = require('../src/database');

      databaseService.getUserOrders.mockResolvedValue([]);

      await handleMyOrders(mockBot, mockCallbackQuery);

      expect(mockBot.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('У вас пока нет заказов 📋'),
        expect.objectContaining({
          chat_id: 123456,
          message_id: 1,
        })
      );
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Заказов нет',
      });
    });
  });

  describe('handleAdminOrderAction', () => {
    beforeEach(() => {
      // Делаем пользователя администратором
      const { serviceRegistry } = require('../src/services');
      const mockNotificationService = serviceRegistry.get('notifications');
      mockNotificationService.isAdmin.mockReturnValue(true);
    });

    it('должен подтверждать заказ', async () => {
      const databaseService = require('../src/database');

      databaseService.getOrderById.mockResolvedValue(mockOrder);
      databaseService.updateOrderStatus.mockResolvedValue(undefined);

      const query = {
        ...mockCallbackQuery,
        data: 'admin_confirm_42',
      };

      await handleAdminOrderAction(mockBot, query);

      expect(databaseService.updateOrderStatus).toHaveBeenCalledWith('42', 'confirmed');
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: '✅ Заказ #42 подтвержден',
      });
    });

    it('должен отклонять доступ для не-админов', async () => {
      const { serviceRegistry } = require('../src/services');
      const mockNotificationService = serviceRegistry.get('notifications');
      mockNotificationService.isAdmin.mockReturnValue(false);

      const query = {
        ...mockCallbackQuery,
        data: 'admin_confirm_42',
      };

      await handleAdminOrderAction(mockBot, query);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: '❌ Доступ запрещен',
      });
    });

    it('должен изменять статус на "готовится"', async () => {
      const databaseService = require('../src/database');

      databaseService.getOrderById.mockResolvedValue(mockOrder);
      databaseService.updateOrderStatus.mockResolvedValue(undefined);

      const query = {
        ...mockCallbackQuery,
        data: 'admin_preparing_42',
      };

      await handleAdminOrderAction(mockBot, query);

      expect(databaseService.updateOrderStatus).toHaveBeenCalledWith('42', 'preparing');
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: '👨‍🍳 Заказ #42 готовится',
      });
    });

    it('должен изменять статус на "готов"', async () => {
      const databaseService = require('../src/database');

      databaseService.getOrderById.mockResolvedValue(mockOrder);
      databaseService.updateOrderStatus.mockResolvedValue(undefined);

      const query = {
        ...mockCallbackQuery,
        data: 'admin_ready_42',
      };

      await handleAdminOrderAction(mockBot, query);

      expect(databaseService.updateOrderStatus).toHaveBeenCalledWith('42', 'ready');
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: '🎉 Заказ #42 готов!',
      });
    });

    it('должен показывать детали заказа админу', async () => {
      const databaseService = require('../src/database');

      databaseService.getOrderById.mockResolvedValue(mockOrder);

      const query = {
        ...mockCallbackQuery,
        data: 'admin_details_42',
      };

      await handleAdminOrderAction(mockBot, query);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(789, expect.stringContaining('📦'), {
        parse_mode: 'HTML',
      });
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: '📋 Детали отправлены',
      });
    });

    it('должен запрещать доступ не-администраторам', async () => {
      const { serviceRegistry } = require('../src/services');
      const mockNotificationService = serviceRegistry.get('notifications');
      mockNotificationService.isAdmin.mockReturnValue(false);

      const query = {
        ...mockCallbackQuery,
        data: 'admin_confirm_42',
      };

      await handleAdminOrderAction(mockBot, query);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: '❌ Доступ запрещен',
      });
    });

    it('должен обрабатывать ошибки админских действий', async () => {
      const databaseService = require('../src/database');

      databaseService.updateOrderStatus.mockRejectedValue(new Error('DB error'));

      const query = {
        ...mockCallbackQuery,
        data: 'admin_confirm_42',
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await handleAdminOrderAction(mockBot, query);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: '❌ Ошибка при обработке',
      });

      consoleSpy.mockRestore();
    });
  });
});
