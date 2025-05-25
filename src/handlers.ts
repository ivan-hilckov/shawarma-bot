import { getMenuByCategory, getItemById } from "./menu";
import { BotInstance, BotMessage, BotCallbackQuery } from "./types";
import cartService from "./cart";
import databaseService from "./database";

// Обработчик команды /start
export function handleStart(bot: BotInstance, msg: BotMessage): void {
  const chatId = msg.chat.id;
  const userName = msg.from?.first_name || "Друг";

  const welcomeMessage = `
🥙 Привет, ${userName}! Добро пожаловать в Шаурма Бот!

Здесь вы можете посмотреть наше меню и выбрать что-то вкусное.

Выберите категорию:
  `;

  const keyboard = {
    keyboard: [
      [{ text: "🌯 Шаурма" }, { text: "🥤 Напитки" }],
      [{ text: "🛒 Корзина" }, { text: "📋 Мои заказы" }],
      [{ text: "ℹ️ О нас" }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };

  bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: keyboard,
  });
}

// Обработчик категории "Шаурма"
export function handleShawarmaMenu(bot: BotInstance, msg: BotMessage): void {
  const chatId = msg.chat.id;
  const items = getMenuByCategory("shawarma");

  let message = "🌯 Наша шаурма:\n\n";

  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];

  items.forEach((item, index) => {
    message += `${index + 1}. ${item.name}\n`;
    message += `   💰 ${item.price} руб.\n`;
    message += `   📝 ${item.description}\n\n`;

    keyboard.push([
      {
        text: `${item.name} - ${item.price}₽`,
        callback_data: `item_${item.id}`,
      },
    ]);
  });

  keyboard.push([{ text: "🔙 Назад в меню", callback_data: "back_to_menu" }]);

  bot.sendMessage(chatId, message, {
    reply_markup: { inline_keyboard: keyboard },
  });
}

// Обработчик категории "Напитки"
export function handleDrinksMenu(bot: BotInstance, msg: BotMessage): void {
  const chatId = msg.chat.id;
  const items = getMenuByCategory("drinks");

  let message = "🥤 Наши напитки:\n\n";

  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];

  items.forEach((item, index) => {
    message += `${index + 1}. ${item.name}\n`;
    message += `   💰 ${item.price} руб.\n`;
    message += `   📝 ${item.description}\n\n`;

    keyboard.push([
      {
        text: `${item.name} - ${item.price}₽`,
        callback_data: `item_${item.id}`,
      },
    ]);
  });

  keyboard.push([{ text: "🔙 Назад в меню", callback_data: "back_to_menu" }]);

  bot.sendMessage(chatId, message, {
    reply_markup: { inline_keyboard: keyboard },
  });
}

// Обработчик информации о заведении
export function handleAbout(bot: BotInstance, msg: BotMessage): void {
  const chatId = msg.chat.id;

  const aboutMessage = `
ℹ️ О нас:

🏪 Лучшая шаурма в городе!
🕐 Время работы: 10:00 - 23:00
📱 Телефон: +7 (999) 123-45-67
📍 Адрес: г. Москва, ул. Примерная, д. 1

Это демо-версия бота. В будущем здесь будет возможность оформления заказов!
  `;

  bot.sendMessage(chatId, aboutMessage);
}

// Обработчик выбора товара
export function handleItemSelection(bot: BotInstance, query: BotCallbackQuery): void {
  const chatId = query.message?.chat.id;
  const itemId = query.data?.replace("item_", "");

  if (!chatId || !itemId) {
    bot.answerCallbackQuery(query.id, { text: "Ошибка обработки запроса" }).catch(() => {});
    return;
  }

  const item = getItemById(itemId);

  if (!item) {
    bot.answerCallbackQuery(query.id, { text: "Товар не найден" }).catch(() => {});
    return;
  }

  const message = `
✅ ${item.name}

💰 Цена: ${item.price} руб.
📝 ${item.description}

Выберите действие:
  `;

  const keyboard = {
    inline_keyboard: [
      [{ text: "🛒 Добавить в корзину", callback_data: `add_to_cart_${item.id}` }],
      [{ text: "🔙 Назад к меню", callback_data: "back_to_menu" }],
    ],
  };

  if (query.message?.message_id) {
    bot
      .editMessageText(message, {
        chat_id: chatId,
        message_id: query.message.message_id,
        reply_markup: keyboard,
      })
      .catch(() => {});
  }

  bot.answerCallbackQuery(query.id, { text: `Выбрано: ${item.name}` }).catch(() => {});
}

// Обработчик возврата в главное меню
export function handleBackToMenu(bot: BotInstance, query: BotCallbackQuery): void {
  const chatId = query.message?.chat.id;
  const userName = query.from?.first_name || "Друг";

  if (!chatId) {
    bot.answerCallbackQuery(query.id, { text: "Ошибка обработки запроса" }).catch(() => {});
    return;
  }

  const welcomeMessage = `
🥙 Привет, ${userName}! Добро пожаловать в Шаурма Бот!

Здесь вы можете посмотреть наше меню и выбрать что-то вкусное.

Выберите категорию:
  `;

  if (query.message?.message_id) {
    bot
      .editMessageText(welcomeMessage, {
        chat_id: chatId,
        message_id: query.message.message_id,
      })
      .catch(() => {});
  }

  bot.answerCallbackQuery(query.id).catch(() => {});
}

// Обработчик добавления товара в корзину
export async function handleAddToCart(bot: BotInstance, query: BotCallbackQuery): Promise<void> {
  const chatId = query.message?.chat.id;
  const userId = query.from?.id;
  const itemId = query.data?.replace("add_to_cart_", "");

  if (!chatId || !userId || !itemId) {
    bot.answerCallbackQuery(query.id, { text: "Ошибка обработки запроса" }).catch(() => {});
    return;
  }

  const item = getItemById(itemId);

  if (!item) {
    bot.answerCallbackQuery(query.id, { text: "Товар не найден" }).catch(() => {});
    return;
  }

  try {
    await cartService.addToCart(userId, item, 1);
    const cartCount = await cartService.getCartItemsCount(userId);

    bot
      .answerCallbackQuery(query.id, {
        text: `✅ ${item.name} добавлен в корзину! (${cartCount} товаров)`,
      })
      .catch(() => {});

    // Обновляем сообщение с кнопкой "Перейти в корзину"
    const message = `
✅ ${item.name} добавлен в корзину!

💰 Цена: ${item.price} руб.
📝 ${item.description}

🛒 В корзине: ${cartCount} товаров
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: "🛒 Перейти в корзину", callback_data: "view_cart" }],
        [{ text: "➕ Добавить еще", callback_data: `add_to_cart_${item.id}` }],
        [{ text: "🔙 Назад к меню", callback_data: "back_to_menu" }],
      ],
    };

    if (query.message?.message_id) {
      bot
        .editMessageText(message, {
          chat_id: chatId,
          message_id: query.message.message_id,
          reply_markup: keyboard,
        })
        .catch(() => {});
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    bot.answerCallbackQuery(query.id, { text: "Ошибка при добавлении в корзину" }).catch(() => {});
  }
}

// Обработчик просмотра корзины
export async function handleViewCart(
  bot: BotInstance,
  msg: BotMessage | BotCallbackQuery
): Promise<void> {
  const chatId = "chat" in msg ? msg.chat.id : msg.message?.chat.id;
  const userId = msg.from?.id;

  if (!chatId || !userId) {
    return;
  }

  try {
    const cart = await cartService.getCart(userId);
    const total = await cartService.getCartTotal(userId);

    if (cart.length === 0) {
      const message = "🛒 Ваша корзина пуста\n\nВыберите товары из меню!";

      if ("data" in msg) {
        // Это callback query
        if (msg.message?.message_id) {
          bot
            .editMessageText(message, {
              chat_id: chatId,
              message_id: msg.message.message_id,
              reply_markup: {
                inline_keyboard: [[{ text: "🔙 Назад к меню", callback_data: "back_to_menu" }]],
              },
            })
            .catch(() => {});
        }
        bot.answerCallbackQuery(msg.id, { text: "Корзина пуста" }).catch(() => {});
      } else {
        // Это обычное сообщение
        bot.sendMessage(chatId, message);
      }
      return;
    }

    let message = "🛒 Ваша корзина:\n\n";
    const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];

    cart.forEach((cartItem, index) => {
      const item = cartItem.menuItem;
      const subtotal = item.price * cartItem.quantity;

      message += `${index + 1}. ${item.name}\n`;
      message += `   💰 ${item.price}₽ × ${cartItem.quantity} = ${subtotal}₽\n\n`;

      // Кнопки для изменения количества
      keyboard.push([
        { text: "➖", callback_data: `decrease_${item.id}` },
        { text: `${cartItem.quantity} шт.`, callback_data: `quantity_${item.id}` },
        { text: "➕", callback_data: `increase_${item.id}` },
        { text: "🗑", callback_data: `remove_${item.id}` },
      ]);
    });

    message += `💰 Общая сумма: ${total}₽`;

    // Кнопки управления корзиной
    keyboard.push([
      { text: "🗑 Очистить корзину", callback_data: "clear_cart" },
      { text: "📦 Оформить заказ", callback_data: "checkout" },
    ]);
    keyboard.push([{ text: "🔙 Назад к меню", callback_data: "back_to_menu" }]);

    if ("data" in msg) {
      // Это callback query
      if (msg.message?.message_id) {
        bot
          .editMessageText(message, {
            chat_id: chatId,
            message_id: msg.message.message_id,
            reply_markup: { inline_keyboard: keyboard },
          })
          .catch(() => {});
      }
      bot.answerCallbackQuery(msg.id).catch(() => {});
    } else {
      // Это обычное сообщение
      bot.sendMessage(chatId, message, {
        reply_markup: { inline_keyboard: keyboard },
      });
    }
  } catch (error) {
    console.error("Error viewing cart:", error);
    const errorMessage = "Ошибка при загрузке корзины";

    if ("data" in msg) {
      bot.answerCallbackQuery(msg.id, { text: errorMessage }).catch(() => {});
    } else {
      bot.sendMessage(chatId, errorMessage);
    }
  }
}

// Обработчик увеличения количества товара
export async function handleIncreaseQuantity(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void> {
  const userId = query.from?.id;
  const itemId = query.data?.replace("increase_", "");

  if (!userId || !itemId) {
    bot.answerCallbackQuery(query.id, { text: "Ошибка обработки запроса" }).catch(() => {});
    return;
  }

  try {
    const cart = await cartService.getCart(userId);
    const cartItem = cart.find((item) => item.menuItem.id === itemId);

    if (cartItem) {
      await cartService.updateQuantity(userId, itemId, cartItem.quantity + 1);
      await handleViewCart(bot, query);
    }
  } catch (error) {
    console.error("Error increasing quantity:", error);
    bot.answerCallbackQuery(query.id, { text: "Ошибка при изменении количества" }).catch(() => {});
  }
}

// Обработчик уменьшения количества товара
export async function handleDecreaseQuantity(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void> {
  const userId = query.from?.id;
  const itemId = query.data?.replace("decrease_", "");

  if (!userId || !itemId) {
    bot.answerCallbackQuery(query.id, { text: "Ошибка обработки запроса" }).catch(() => {});
    return;
  }

  try {
    const cart = await cartService.getCart(userId);
    const cartItem = cart.find((item) => item.menuItem.id === itemId);

    if (cartItem) {
      const newQuantity = cartItem.quantity - 1;
      if (newQuantity <= 0) {
        await cartService.removeFromCart(userId, itemId);
      } else {
        await cartService.updateQuantity(userId, itemId, newQuantity);
      }
      await handleViewCart(bot, query);
    }
  } catch (error) {
    console.error("Error decreasing quantity:", error);
    bot.answerCallbackQuery(query.id, { text: "Ошибка при изменении количества" }).catch(() => {});
  }
}

// Обработчик удаления товара из корзины
export async function handleRemoveFromCart(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void> {
  const userId = query.from?.id;
  const itemId = query.data?.replace("remove_", "");

  if (!userId || !itemId) {
    bot.answerCallbackQuery(query.id, { text: "Ошибка обработки запроса" }).catch(() => {});
    return;
  }

  try {
    await cartService.removeFromCart(userId, itemId);
    bot.answerCallbackQuery(query.id, { text: "Товар удален из корзины" }).catch(() => {});
    await handleViewCart(bot, query);
  } catch (error) {
    console.error("Error removing from cart:", error);
    bot.answerCallbackQuery(query.id, { text: "Ошибка при удалении товара" }).catch(() => {});
  }
}

// Обработчик очистки корзины
export async function handleClearCart(bot: BotInstance, query: BotCallbackQuery): Promise<void> {
  const userId = query.from?.id;

  if (!userId) {
    bot.answerCallbackQuery(query.id, { text: "Ошибка обработки запроса" }).catch(() => {});
    return;
  }

  try {
    await cartService.clearCart(userId);
    bot.answerCallbackQuery(query.id, { text: "Корзина очищена" }).catch(() => {});
    await handleViewCart(bot, query);
  } catch (error) {
    console.error("Error clearing cart:", error);
    bot.answerCallbackQuery(query.id, { text: "Ошибка при очистке корзины" }).catch(() => {});
  }
}

// Обработчик оформления заказа
export async function handleCheckout(bot: BotInstance, query: BotCallbackQuery): Promise<void> {
  const chatId = query.message?.chat.id;
  const userId = query.from?.id;
  const userName = query.from?.first_name;

  if (!chatId || !userId) {
    bot.answerCallbackQuery(query.id, { text: "Ошибка обработки запроса" }).catch(() => {});
    return;
  }

  try {
    const cart = await cartService.getCart(userId);
    const total = await cartService.getCartTotal(userId);

    if (cart.length === 0) {
      bot.answerCallbackQuery(query.id, { text: "Корзина пуста" }).catch(() => {});
      return;
    }

    // Сохраняем пользователя в БД
    await databaseService.upsertUser(userId, query.from?.username, userName);

    // Создаем заказ в БД
    const orderId = await databaseService.createOrder(userId, cart, total);

    // Очищаем корзину после успешного заказа
    await cartService.clearCart(userId);

    const message = `
✅ Заказ успешно оформлен!

📦 Номер заказа: #${orderId}
💰 Сумма заказа: ${total}₽

Ваш заказ принят в обработку.
Статус заказа: В ожидании

Спасибо за заказ! 🥙
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: "📋 Мои заказы", callback_data: "my_orders" }],
        [{ text: "🔙 Главное меню", callback_data: "back_to_menu" }],
      ],
    };

    if (query.message?.message_id) {
      bot
        .editMessageText(message, {
          chat_id: chatId,
          message_id: query.message.message_id,
          reply_markup: keyboard,
        })
        .catch(() => {});
    }

    bot.answerCallbackQuery(query.id, { text: `Заказ #${orderId} оформлен!` }).catch(() => {});
  } catch (error) {
    console.error("Error during checkout:", error);
    bot.answerCallbackQuery(query.id, { text: "Ошибка при оформлении заказа" }).catch(() => {});
  }
}

// Обработчик просмотра заказов пользователя
export async function handleMyOrders(
  bot: BotInstance,
  msg: BotMessage | BotCallbackQuery
): Promise<void> {
  const chatId = "chat" in msg ? msg.chat.id : msg.message?.chat.id;
  const userId = msg.from?.id;

  if (!chatId || !userId) {
    return;
  }

  try {
    const orders = await databaseService.getUserOrders(userId, 5);

    if (orders.length === 0) {
      const message =
        "📋 У вас пока нет заказов\n\nВыберите товары из меню и оформите первый заказ!";

      if ("data" in msg) {
        // Это callback query
        if (msg.message?.message_id) {
          bot
            .editMessageText(message, {
              chat_id: chatId,
              message_id: msg.message.message_id,
              reply_markup: {
                inline_keyboard: [[{ text: "🔙 Назад к меню", callback_data: "back_to_menu" }]],
              },
            })
            .catch(() => {});
        }
        bot.answerCallbackQuery(msg.id, { text: "Заказов нет" }).catch(() => {});
      } else {
        // Это обычное сообщение
        bot.sendMessage(chatId, message);
      }
      return;
    }

    let message = "📋 Ваши заказы:\n\n";
    const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];

    orders.forEach((order, index) => {
      const statusEmoji =
        {
          pending: "⏳",
          confirmed: "✅",
          preparing: "👨‍🍳",
          ready: "🎉",
          delivered: "✅",
        }[order.status] || "❓";

      message += `${index + 1}. Заказ #${order.id}\n`;
      message += `   ${statusEmoji} Статус: ${getStatusText(order.status)}\n`;
      message += `   💰 Сумма: ${order.totalPrice}₽\n`;
      message += `   📅 ${formatDate(order.createdAt)}\n\n`;

      // Кнопка для просмотра деталей заказа
      keyboard.push([
        { text: `📦 Заказ #${order.id}`, callback_data: `order_details_${order.id}` },
      ]);
    });

    keyboard.push([{ text: "🔙 Назад к меню", callback_data: "back_to_menu" }]);

    if ("data" in msg) {
      // Это callback query
      if (msg.message?.message_id) {
        bot
          .editMessageText(message, {
            chat_id: chatId,
            message_id: msg.message.message_id,
            reply_markup: { inline_keyboard: keyboard },
          })
          .catch(() => {});
      }
      bot.answerCallbackQuery(msg.id).catch(() => {});
    } else {
      // Это обычное сообщение
      bot.sendMessage(chatId, message, {
        reply_markup: { inline_keyboard: keyboard },
      });
    }
  } catch (error) {
    console.error("Error viewing orders:", error);
    const errorMessage = "Ошибка при загрузке заказов";

    if ("data" in msg) {
      bot.answerCallbackQuery(msg.id, { text: errorMessage }).catch(() => {});
    } else {
      bot.sendMessage(chatId, errorMessage);
    }
  }
}

// Обработчик просмотра деталей заказа
export async function handleOrderDetails(bot: BotInstance, query: BotCallbackQuery): Promise<void> {
  const chatId = query.message?.chat.id;
  const userId = query.from?.id;
  const orderId = query.data?.replace("order_details_", "");

  if (!chatId || !userId || !orderId) {
    bot.answerCallbackQuery(query.id, { text: "Ошибка обработки запроса" }).catch(() => {});
    return;
  }

  try {
    const order = await databaseService.getOrderById(orderId);

    if (!order || order.userId !== userId) {
      bot.answerCallbackQuery(query.id, { text: "Заказ не найден" }).catch(() => {});
      return;
    }

    const statusEmoji =
      {
        pending: "⏳",
        confirmed: "✅",
        preparing: "👨‍🍳",
        ready: "🎉",
        delivered: "✅",
      }[order.status] || "❓";

    let message = `📦 Заказ #${order.id}\n\n`;
    message += `${statusEmoji} Статус: ${getStatusText(order.status)}\n`;
    message += `📅 Дата: ${formatDate(order.createdAt)}\n\n`;
    message += `🛒 Состав заказа:\n`;

    order.items.forEach((item, index) => {
      const subtotal = item.menuItem.price * item.quantity;
      message += `${index + 1}. ${item.menuItem.name}\n`;
      message += `   💰 ${item.menuItem.price}₽ × ${item.quantity} = ${subtotal}₽\n`;
    });

    message += `\n💰 Общая сумма: ${order.totalPrice}₽`;

    const keyboard = {
      inline_keyboard: [
        [{ text: "📋 Все заказы", callback_data: "my_orders" }],
        [{ text: "🔙 Главное меню", callback_data: "back_to_menu" }],
      ],
    };

    if (query.message?.message_id) {
      bot
        .editMessageText(message, {
          chat_id: chatId,
          message_id: query.message.message_id,
          reply_markup: keyboard,
        })
        .catch(() => {});
    }

    bot.answerCallbackQuery(query.id).catch(() => {});
  } catch (error) {
    console.error("Error viewing order details:", error);
    bot.answerCallbackQuery(query.id, { text: "Ошибка при загрузке заказа" }).catch(() => {});
  }
}

// Вспомогательные функции
function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    pending: "В ожидании",
    confirmed: "Подтвержден",
    preparing: "Готовится",
    ready: "Готов",
    delivered: "Доставлен",
  };
  return statusMap[status] || "Неизвестно";
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
