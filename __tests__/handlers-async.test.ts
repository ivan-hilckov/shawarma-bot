import {
  handleAddToCart,
  handleViewCart,
  handleIncreaseQuantity,
  handleDecreaseQuantity,
  handleRemoveFromCart,
  handleClearCart,
  handleCheckout,
  handleMyOrders,
  handleOrderDetails,
  handleAdminOrderAction,
} from '../src/handlers';
import { BotInstance, BotMessage, BotCallbackQuery, MenuItem, CartItem, Order } from '../src/types';

// Мокаем зависимости
jest.mock('../src/menu', () => ({
  getItemById: jest.fn(),
}));

jest.mock('../src/cart', () => ({
  addToCart: jest.fn(),
  getCart: jest.fn(),
  getCartTotal: jest.fn(),
  getCartItemsCount: jest.fn(),
  updateQuantity: jest.fn(),
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

    // Настраиваем глобальный notificationService
    (global as any).notificationService = {
      notifyNewOrder: jest.fn().mockResolvedValue(undefined),
      notifyStatusChange: jest.fn().mockResolvedValue(undefined),
      isAdmin: jest.fn().mockReturnValue(false),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleAddToCart', () => {
    it('должен добавлять товар в корзину', async () => {
      const { getItemById } = require('../src/menu');
      const cartService = require('../src/cart');

      getItemById.mockReturnValue(mockMenuItem);
      cartService.addToCart.mockResolvedValue(undefined);
      cartService.getCartItemsCount.mockResolvedValue(3);

      await handleAddToCart(mockBot, mockCallbackQuery);

      expect(getItemById).toHaveBeenCalledWith('1');
      expect(cartService.addToCart).toHaveBeenCalledWith(789, mockMenuItem, 1);
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: '✅ Тестовая шаурма добавлен в корзину! (3 товаров)',
      });
      expect(mockBot.editMessageText).toHaveBeenCalled();
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
      const cartService = require('../src/cart');

      getItemById.mockReturnValue(mockMenuItem);
      cartService.addToCart.mockRejectedValue(new Error('Redis error'));

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
      const cartService = require('../src/cart');

      cartService.getCart.mockResolvedValue([mockCartItem]);
      cartService.getCartTotal.mockResolvedValue(500);

      await handleViewCart(mockBot, mockCallbackQuery);

      expect(cartService.getCart).toHaveBeenCalledWith(789);
      expect(cartService.getCartTotal).toHaveBeenCalledWith(789);
      expect(mockBot.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('🛒 Ваша корзина:'),
        expect.objectContaining({
          chat_id: 123456,
          message_id: 1,
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([expect.objectContaining({ text: '📦 Оформить заказ' })]),
            ]),
          }),
        })
      );
    });

    it('должен показывать пустую корзину', async () => {
      const cartService = require('../src/cart');

      cartService.getCart.mockResolvedValue([]);

      await handleViewCart(mockBot, mockCallbackQuery);

      expect(mockBot.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('🛒 Ваша корзина пуста'),
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
      const cartService = require('../src/cart');

      cartService.getCart.mockResolvedValue([mockCartItem]);
      cartService.getCartTotal.mockResolvedValue(500);

      await handleViewCart(mockBot, mockMessage);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456,
        expect.stringContaining('🛒 Ваша корзина:'),
        expect.any(Object)
      );
    });
  });

  describe('handleIncreaseQuantity', () => {
    it('должен увеличивать количество товара', async () => {
      const cartService = require('../src/cart');

      cartService.getCart.mockResolvedValue([mockCartItem]);
      cartService.updateQuantity.mockResolvedValue(undefined);

      const query = {
        ...mockCallbackQuery,
        data: 'increase_1',
      };

      await handleIncreaseQuantity(mockBot, query);

      expect(cartService.updateQuantity).toHaveBeenCalledWith(789, '1', 3);
    });

    it('должен обрабатывать ошибки при увеличении количества', async () => {
      const cartService = require('../src/cart');

      cartService.getCart.mockRejectedValue(new Error('Cart error'));

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
      const cartService = require('../src/cart');

      cartService.getCart.mockResolvedValue([mockCartItem]);
      cartService.updateQuantity.mockResolvedValue(undefined);

      const query = {
        ...mockCallbackQuery,
        data: 'decrease_1',
      };

      await handleDecreaseQuantity(mockBot, query);

      expect(cartService.updateQuantity).toHaveBeenCalledWith(789, '1', 1);
    });

    it('должен удалять товар при количестве 0', async () => {
      const cartService = require('../src/cart');

      const singleItemCart = {
        menuItem: mockMenuItem,
        quantity: 1,
      };

      cartService.getCart.mockResolvedValue([singleItemCart]);
      cartService.removeFromCart.mockResolvedValue(undefined);

      const query = {
        ...mockCallbackQuery,
        data: 'decrease_1',
      };

      await handleDecreaseQuantity(mockBot, query);

      expect(cartService.removeFromCart).toHaveBeenCalledWith(789, '1');
    });
  });

  describe('handleRemoveFromCart', () => {
    it('должен удалять товар из корзины', async () => {
      const cartService = require('../src/cart');

      cartService.removeFromCart.mockResolvedValue(undefined);

      const query = {
        ...mockCallbackQuery,
        data: 'remove_1',
      };

      await handleRemoveFromCart(mockBot, query);

      expect(cartService.removeFromCart).toHaveBeenCalledWith(789, '1');
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Товар удален из корзины',
      });
    });
  });

  describe('handleClearCart', () => {
    it('должен очищать корзину', async () => {
      const cartService = require('../src/cart');

      cartService.clearCart.mockResolvedValue(undefined);

      await handleClearCart(mockBot, mockCallbackQuery);

      expect(cartService.clearCart).toHaveBeenCalledWith(789);
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Корзина очищена',
      });
    });
  });

  describe('handleCheckout', () => {
    it('должен оформлять заказ', async () => {
      const cartService = require('../src/cart');
      const databaseService = require('../src/database');

      cartService.getCart.mockResolvedValue([mockCartItem]);
      cartService.getCartTotal.mockResolvedValue(500);
      cartService.clearCart.mockResolvedValue(undefined);
      databaseService.upsertUser.mockResolvedValue(undefined);
      databaseService.createOrder.mockResolvedValue('42');
      databaseService.getOrderById.mockResolvedValue(mockOrder);

      await handleCheckout(mockBot, mockCallbackQuery);

      expect(databaseService.upsertUser).toHaveBeenCalledWith(789, 'testuser', 'TestUser');
      expect(databaseService.createOrder).toHaveBeenCalledWith(789, [mockCartItem], 500);
      expect(cartService.clearCart).toHaveBeenCalledWith(789);
      expect(mockBot.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('✅ Заказ успешно оформлен!'),
        expect.objectContaining({
          chat_id: 123456,
          message_id: 1,
        })
      );
      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Заказ #42 оформлен!',
      });
    });

    it('должен обрабатывать пустую корзину при оформлении', async () => {
      const cartService = require('../src/cart');

      cartService.getCart.mockResolvedValue([]);

      await handleCheckout(mockBot, mockCallbackQuery);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Корзина пуста',
      });
    });

    it('должен обрабатывать ошибки при оформлении заказа', async () => {
      const cartService = require('../src/cart');
      const databaseService = require('../src/database');

      cartService.getCart.mockResolvedValue([mockCartItem]);
      cartService.getCartTotal.mockResolvedValue(500);
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
        expect.stringContaining('📋 Ваши заказы:'),
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
        expect.stringContaining('📋 У вас пока нет заказов'),
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

  describe('handleOrderDetails', () => {
    it('должен показывать детали заказа', async () => {
      const databaseService = require('../src/database');

      databaseService.getOrderById.mockResolvedValue(mockOrder);

      const query = {
        ...mockCallbackQuery,
        data: 'order_details_42',
      };

      await handleOrderDetails(mockBot, query);

      expect(databaseService.getOrderById).toHaveBeenCalledWith('42');
      expect(mockBot.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('📦 Заказ #42'),
        expect.objectContaining({
          chat_id: 123456,
          message_id: 1,
        })
      );
    });

    it('должен обрабатывать несуществующий заказ', async () => {
      const databaseService = require('../src/database');

      databaseService.getOrderById.mockResolvedValue(null);

      const query = {
        ...mockCallbackQuery,
        data: 'order_details_999',
      };

      await handleOrderDetails(mockBot, query);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Заказ не найден',
      });
    });

    it('должен проверять права доступа к заказу', async () => {
      const databaseService = require('../src/database');

      const otherUserOrder = {
        ...mockOrder,
        userId: 999, // Другой пользователь
      };

      databaseService.getOrderById.mockResolvedValue(otherUserOrder);

      const query = {
        ...mockCallbackQuery,
        data: 'order_details_42',
      };

      await handleOrderDetails(mockBot, query);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: 'Заказ не найден',
      });
    });
  });

  describe('handleAdminOrderAction', () => {
    beforeEach(() => {
      // Делаем пользователя администратором
      (global as any).notificationService.isAdmin.mockReturnValue(true);
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

    it('должен отклонять заказ', async () => {
      const query = {
        ...mockCallbackQuery,
        data: 'admin_reject_42',
      };

      await handleAdminOrderAction(mockBot, query);

      expect(mockBot.answerCallbackQuery).toHaveBeenCalledWith('callback_123', {
        text: '❌ Заказ #42 отклонен',
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
      (global as any).notificationService.isAdmin.mockReturnValue(false);

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
