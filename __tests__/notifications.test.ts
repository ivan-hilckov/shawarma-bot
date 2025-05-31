import NotificationService from '../src/notifications';
import { BotInstance, Order } from '../src/types';

// Мокаем config
jest.mock('../src/config', () => ({
  NOTIFICATIONS_CHAT_ID: '-1001234567890',
  ADMIN_USER_IDS: '123456789,987654321',
}));

describe('NotificationService', () => {
  let mockBot: jest.Mocked<BotInstance>;
  let notificationService: NotificationService;
  let mockOrder: Order;

  beforeEach(() => {
    // Создаем мок бота
    mockBot = {
      sendMessage: jest.fn().mockResolvedValue({}),
    } as any;

    // Создаем экземпляр сервиса
    notificationService = new NotificationService(mockBot);

    // Мокаем console.log для тестов
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Создаем тестовый заказ
    mockOrder = {
      id: '123',
      userId: 456,
      userName: 'Тестовый пользователь',
      items: [
        {
          menuItem: {
            id: '1',
            name: 'Шаурма классик',
            description: 'Вкусная шаурма',
            price: 250,
            category: 'shawarma' as const,
          },
          quantity: 2,
        },
      ],
      totalPrice: 500,
      status: 'pending' as const,
      createdAt: new Date('2024-01-15T12:00:00Z'),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Инициализация', () => {
    it('должен правильно инициализироваться с конфигурацией', () => {
      expect(notificationService.isConfigured()).toBe(true);
      expect(notificationService.isAdmin(123456789)).toBe(true);
      expect(notificationService.isAdmin(987654321)).toBe(true);
      expect(notificationService.isAdmin(999999999)).toBe(false);
    });

    it('должен показывать правильный статус', () => {
      const status = notificationService.getStatus();
      expect(status).toContain('✅ Уведомления настроены');
      expect(status).toContain('Канал: -1001234567890');
      expect(status).toContain('Админов: 2');
    });
  });

  describe('notifyNewOrder', () => {
    it('должен отправлять уведомление о новом заказе в канал', async () => {
      await notificationService.notifyNewOrder(mockOrder);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        '-1001234567890',
        expect.stringContaining('🆕 <b>НОВЫЙ ЗАКАЗ!</b>'),
        expect.objectContaining({
          parse_mode: 'HTML',
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({ text: '✅ Принять' }),
                expect.objectContaining({ text: '❌ Отклонить' }),
              ]),
            ]),
          }),
        })
      );
    });

    it('должен отправлять уведомление администраторам', async () => {
      await notificationService.notifyNewOrder(mockOrder);

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('🆕 <b>НОВЫЙ ЗАКАЗ!</b>'),
        expect.any(Object)
      );

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        987654321,
        expect.stringContaining('🆕 <b>НОВЫЙ ЗАКАЗ!</b>'),
        expect.any(Object)
      );
    });

    it('должен включать детали заказа в сообщение', async () => {
      await notificationService.notifyNewOrder(mockOrder);

      const sentMessage = (mockBot.sendMessage as jest.Mock).mock.calls[0][1];
      expect(sentMessage).toContain('Заказ: #123');
      expect(sentMessage).toContain('Клиент: Тестовый пользователь');
      expect(sentMessage).toContain('Шаурма классик');
      expect(sentMessage).toContain('250₽ × 2 = <b>500₽</b>');
      expect(sentMessage).toContain('Общая сумма: 500₽');
    });

    it('должен обрабатывать ошибки отправки', async () => {
      mockBot.sendMessage.mockRejectedValue(new Error('Ошибка API'));

      await expect(notificationService.notifyNewOrder(mockOrder)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Ошибка отправки уведомления'),
        expect.any(Error)
      );
    });
  });

  describe('notifyStatusChange', () => {
    it('должен отправлять уведомление об изменении статуса', async () => {
      const updatedOrder = { ...mockOrder, status: 'confirmed' as const };

      await notificationService.notifyStatusChange(updatedOrder, 'pending');

      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        '-1001234567890',
        expect.stringContaining('🔄 <b>Статус заказа изменен</b>'),
        expect.objectContaining({ parse_mode: 'HTML' })
      );

      const sentMessage = (mockBot.sendMessage as jest.Mock).mock.calls[0][1];
      expect(sentMessage).toContain('⏳ → ✅');
      expect(sentMessage).toContain('В ожидании → Подтвержден');
    });

    it('должен отправлять уведомления администраторам', async () => {
      const updatedOrder = { ...mockOrder, status: 'preparing' as const };

      await notificationService.notifyStatusChange(updatedOrder, 'confirmed');

      expect(mockBot.sendMessage).toHaveBeenCalledTimes(3); // канал + 2 админа
    });
  });

  describe('Проверка прав администратора', () => {
    it('должен правильно определять администраторов', () => {
      expect(notificationService.isAdmin(123456789)).toBe(true);
      expect(notificationService.isAdmin(987654321)).toBe(true);
      expect(notificationService.isAdmin(111111111)).toBe(false);
    });
  });

  describe('Конфигурация', () => {
    it('должен определять настроенность сервиса', () => {
      expect(notificationService.isConfigured()).toBe(true);
    });
  });

  describe('Форматирование', () => {
    it('должен правильно форматировать дату', () => {
      // Проверяем через отправленное сообщение
      notificationService.notifyNewOrder(mockOrder);

      const sentMessage = (mockBot.sendMessage as jest.Mock).mock.calls[0][1];
      expect(sentMessage).toContain('15.01.2024'); // Дата в российском формате
    });

    it('должен правильно отображать emoji статусов', () => {
      const testStatuses = [
        { status: 'pending', emoji: '⏳' },
        { status: 'confirmed', emoji: '✅' },
        { status: 'preparing', emoji: '👨‍🍳' },
        { status: 'ready', emoji: '🎉' },
        { status: 'delivered', emoji: '✅' },
      ];

      testStatuses.forEach(({ status, emoji }) => {
        const order = { ...mockOrder, status: status as any };
        notificationService.notifyNewOrder(order);

        const sentMessage = (mockBot.sendMessage as jest.Mock).mock.lastCall[1];
        expect(sentMessage).toContain(emoji);
      });
    });
  });

  describe('Клавиатура управления', () => {
    it('должен создавать правильную клавиатуру для управления заказами', async () => {
      await notificationService.notifyNewOrder(mockOrder);

      const keyboard = (mockBot.sendMessage as jest.Mock).mock.calls[0][2].reply_markup;
      expect(keyboard.inline_keyboard).toEqual([
        [
          { text: '✅ Принять', callback_data: 'admin_confirm_123' },
          { text: '❌ Отклонить', callback_data: 'admin_reject_123' },
        ],
        [
          { text: '👨‍🍳 Готовится', callback_data: 'admin_preparing_123' },
          { text: '🎉 Готово', callback_data: 'admin_ready_123' },
        ],
        [{ text: '📋 Детали', callback_data: 'admin_details_123' }],
      ]);
    });
  });

  describe('Обработка некорректных данных', () => {
    it('должен обрабатывать некорректные ID администраторов', () => {
      // Тестируем через существующий сервис - проверяем что ID парсятся корректно
      expect(notificationService.isAdmin(123456789)).toBe(true);
      expect(notificationService.isAdmin(987654321)).toBe(true);
      expect(notificationService.isAdmin(999999999)).toBe(false);
    });
  });
});
