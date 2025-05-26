import { BotInstance, Order } from "./types";
import config from "./config";

class NotificationService {
  private bot: BotInstance;
  private notificationsChatId: string | undefined;
  private adminUserIds: number[];

  constructor(bot: BotInstance) {
    this.bot = bot;
    this.notificationsChatId = config.NOTIFICATIONS_CHAT_ID;
    this.adminUserIds = config.ADMIN_USER_IDS
      ? config.ADMIN_USER_IDS.split(",")
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id))
      : [];

    console.log(`🔔 NotificationService инициализирован:`);
    console.log(`   📢 Канал уведомлений: ${this.notificationsChatId || "не настроен"}`);
    console.log(`   👨‍💼 Администраторов: ${this.adminUserIds.length}`);
  }

  // Уведомление о новом заказе
  async notifyNewOrder(order: Order): Promise<void> {
    const message = this.formatNewOrderMessage(order);
    const keyboard = this.getOrderManagementKeyboard(order.id);

    // Отправляем в канал уведомлений
    if (this.notificationsChatId) {
      try {
        await this.bot.sendMessage(this.notificationsChatId, message, {
          reply_markup: keyboard,
          parse_mode: "HTML",
        });
        console.log(`📢 Уведомление о заказе #${order.id} отправлено в канал`);
      } catch (error) {
        console.error("❌ Ошибка отправки уведомления в канал:", error);
      }
    }

    // Отправляем админам в личные сообщения
    for (const adminId of this.adminUserIds) {
      try {
        await this.bot.sendMessage(adminId, message, {
          reply_markup: keyboard,
          parse_mode: "HTML",
        });
        console.log(`👨‍💼 Уведомление о заказе #${order.id} отправлено админу ${adminId}`);
      } catch (error) {
        console.error(`❌ Ошибка отправки уведомления админу ${adminId}:`, error);
      }
    }
  }

  // Уведомление об изменении статуса заказа
  async notifyStatusChange(order: Order, oldStatus: string): Promise<void> {
    const message = `
🔄 <b>Статус заказа изменен</b>

📦 Заказ: #${order.id}
👤 Клиент: ${order.userName}
📊 ${this.getStatusEmoji(oldStatus)} → ${this.getStatusEmoji(order.status)}
💰 Сумма: ${order.totalPrice}₽

<i>Статус: ${this.getStatusText(oldStatus)} → ${this.getStatusText(order.status)}</i>
    `;

    // Отправляем в канал уведомлений
    if (this.notificationsChatId) {
      try {
        await this.bot.sendMessage(this.notificationsChatId, message, {
          parse_mode: "HTML",
        });
        console.log(`📢 Уведомление об изменении статуса заказа #${order.id} отправлено в канал`);
      } catch (error) {
        console.error("❌ Ошибка отправки уведомления об изменении статуса в канал:", error);
      }
    }

    // Отправляем админам
    for (const adminId of this.adminUserIds) {
      try {
        await this.bot.sendMessage(adminId, message, {
          parse_mode: "HTML",
        });
      } catch (error) {
        console.error(
          `❌ Ошибка отправки уведомления об изменении статуса админу ${adminId}:`,
          error
        );
      }
    }
  }

  // Форматирование сообщения о новом заказе
  private formatNewOrderMessage(order: Order): string {
    let message = `
🆕 <b>НОВЫЙ ЗАКАЗ!</b>

📦 Заказ: #${order.id}
👤 Клиент: ${order.userName}
📅 Время: ${this.formatDate(order.createdAt)}
📊 Статус: ${this.getStatusEmoji(order.status)} ${this.getStatusText(order.status)}

🛒 <b>Состав заказа:</b>
`;

    order.items.forEach((item, index) => {
      const subtotal = item.menuItem.price * item.quantity;
      message += `${index + 1}. <b>${item.menuItem.name}</b>\n`;
      message += `   💰 ${item.menuItem.price}₽ × ${item.quantity} = <b>${subtotal}₽</b>\n`;
    });

    message += `\n💰 <b>Общая сумма: ${order.totalPrice}₽</b>`;

    return message;
  }

  // Клавиатура управления заказом для персонала
  private getOrderManagementKeyboard(orderId: string) {
    return {
      inline_keyboard: [
        [
          { text: "✅ Принять", callback_data: `admin_confirm_${orderId}` },
          { text: "❌ Отклонить", callback_data: `admin_reject_${orderId}` },
        ],
        [
          { text: "👨‍🍳 Готовится", callback_data: `admin_preparing_${orderId}` },
          { text: "🎉 Готово", callback_data: `admin_ready_${orderId}` },
        ],
        [{ text: "📋 Детали", callback_data: `admin_details_${orderId}` }],
      ],
    };
  }

  // Получение emoji для статуса заказа
  private getStatusEmoji(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: "⏳",
      confirmed: "✅",
      preparing: "👨‍🍳",
      ready: "🎉",
      delivered: "✅",
    };
    return statusMap[status] || "❓";
  }

  // Получение текста статуса заказа
  private getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: "В ожидании",
      confirmed: "Подтвержден",
      preparing: "Готовится",
      ready: "Готов",
      delivered: "Доставлен",
    };
    return statusMap[status] || "Неизвестно";
  }

  // Форматирование даты для отображения
  private formatDate(date: Date): string {
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Проверка является ли пользователь администратором
  isAdmin(userId: number): boolean {
    return this.adminUserIds.includes(userId);
  }

  // Проверка настроен ли сервис уведомлений
  isConfigured(): boolean {
    return !!(this.notificationsChatId || this.adminUserIds.length > 0);
  }

  // Получение информации о конфигурации
  getStatus(): string {
    if (!this.isConfigured()) {
      return "❌ Уведомления не настроены";
    }

    let status = "✅ Уведомления настроены:\n";
    if (this.notificationsChatId) {
      status += `📢 Канал: ${this.notificationsChatId}\n`;
    }
    if (this.adminUserIds.length > 0) {
      status += `👨‍💼 Админов: ${this.adminUserIds.length}`;
    }
    return status;
  }
}

export default NotificationService;
