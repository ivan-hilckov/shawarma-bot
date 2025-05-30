import * as fs from 'fs';
import * as path from 'path';

import botApiClient from './api-client';
import databaseService from './database';
import { getMenuByCategory, getItemById } from './menu';
import { BotInstance, BotMessage, BotCallbackQuery } from './types';

// Обработчик команды /start
export function handleStart(bot: BotInstance, msg: BotMessage): void {
  const chatId = msg.chat.id;
  const userName = msg.from?.first_name || 'Друг';

  const welcomeMessage = `
🥙 Привет, ${userName}! Добро пожаловать в Шаурма Бот!

Здесь вы можете посмотреть наше меню и выбрать что-то вкусное.

Выберите действие:
  `;

  const keyboard = {
    keyboard: [
      [{ text: '🌯 Шаурма' }, { text: '🥤 Напитки' }],
      [{ text: '🛒 Корзина' }, { text: '📋 Мои заказы' }],
      [{ text: '📱 Mini App' }, { text: 'ℹ️ О нас' }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };

  // Отправляем приветствие с обычной клавиатурой
  bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: keyboard,
  });

  // Отправляем отдельное сообщение с кнопкой Mini App
  const miniAppMessage = `
🚀 Попробуйте наше новое Mini App!

В мини-приложении вы можете:
• Просматривать меню с фотографиями
• Управлять корзиной
• Отслеживать заказы
• Получать персональные рекомендации

Нажмите кнопку ниже, чтобы открыть приложение:
  `;

  const miniAppKeyboard = {
    inline_keyboard: [
      [
        {
          text: '🌯 Открыть Шаурма App',
          web_app: { url: 'https://botgarden.store/' },
        },
      ],
      [
        {
          text: '📱 Что такое Mini App?',
          callback_data: 'about_miniapp',
        },
      ],
    ],
  };

  bot.sendMessage(chatId, miniAppMessage, {
    reply_markup: miniAppKeyboard,
  });
}

// Обработчик категории "Шаурма"
export function handleShawarmaMenu(bot: BotInstance, msg: BotMessage): void {
  const chatId = msg.chat.id;
  const items = getMenuByCategory('shawarma');

  let message = '🌯 Наша шаурма:\n\n';

  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];

  items.forEach((item, index) => {
    const photoIcon = item.photo ? '📸 ' : '';
    message += `${index + 1}. ${photoIcon}${item.name}\n`;
    message += `   💰 ${item.price} руб.\n`;
    message += `   📝 ${item.description}\n\n`;

    keyboard.push([
      {
        text: `${photoIcon}${item.name} - ${item.price}₽`,
        callback_data: `item_${item.id}`,
      },
    ]);
  });

  keyboard.push([{ text: '🔙 Назад в меню', callback_data: 'back_to_menu' }]);

  bot.sendMessage(chatId, message, {
    reply_markup: { inline_keyboard: keyboard },
  });
}

// Обработчик категории "Напитки"
export function handleDrinksMenu(bot: BotInstance, msg: BotMessage): void {
  const chatId = msg.chat.id;
  const items = getMenuByCategory('drinks');

  let message = '🥤 Наши напитки:\n\n';

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

  keyboard.push([{ text: '🔙 Назад в меню', callback_data: 'back_to_menu' }]);

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
  const itemId = query.data?.replace('item_', '');

  if (!chatId || !itemId) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  const item = getItemById(itemId);

  if (!item) {
    bot.answerCallbackQuery(query.id, { text: 'Товар не найден' }).catch(() => {});
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
      [{ text: '🛒 Добавить в корзину', callback_data: `add_to_cart_${item.id}` }],
      [{ text: '🔙 Назад к меню', callback_data: 'back_to_menu' }],
    ],
  };

  // Если у товара есть фотография, отправляем её
  if (item.photo) {
    const photoPath = path.join(process.cwd(), item.photo);

    // Проверяем, существует ли файл
    if (fs.existsSync(photoPath)) {
      console.log(`📸 Отправляем фото: ${photoPath}`);
      bot
        .sendPhoto(chatId, photoPath, {
          caption: message,
          reply_markup: keyboard,
        })
        .catch(error => {
          console.error('❌ Ошибка отправки фото:', error);
          // Если не удалось отправить фото, отправляем обычное сообщение
          bot.sendMessage(chatId, message, { reply_markup: keyboard }).catch(() => {});
        });
    } else {
      console.warn(`⚠️ Фото не найдено: ${photoPath}`);
      // Если файл не найден, отправляем обычное сообщение
      bot.sendMessage(chatId, message, { reply_markup: keyboard }).catch(() => {});
    }
  } else {
    // Если фото нет, отправляем обычное сообщение
    if (query.message?.message_id) {
      bot
        .editMessageText(message, {
          chat_id: chatId,
          message_id: query.message.message_id,
          reply_markup: keyboard,
        })
        .catch(() => {});
    }
  }

  bot.answerCallbackQuery(query.id, { text: `Выбрано: ${item.name}` }).catch(() => {});
}

// Обработчик возврата в главное меню
export function handleBackToMenu(bot: BotInstance, query: BotCallbackQuery): void {
  const chatId = query.message?.chat.id;
  const userName = query.from?.first_name || 'Друг';

  if (!chatId) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
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
  const itemId = query.data?.replace('add_to_cart_', '');

  if (!chatId || !userId || !itemId) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  const item = getItemById(itemId);

  if (!item) {
    bot.answerCallbackQuery(query.id, { text: 'Товар не найден' }).catch(() => {});
    return;
  }

  try {
    await botApiClient.addToCart(userId, item.id, 1);
    const cartTotal = await botApiClient.getCartTotal(userId);
    const cartCount = cartTotal.itemsCount;

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
        [{ text: '🛒 Перейти в корзину', callback_data: 'view_cart' }],
        [{ text: '➕ Добавить еще', callback_data: `add_to_cart_${item.id}` }],
        [{ text: '🔙 Назад к меню', callback_data: 'back_to_menu' }],
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
    console.error('Error adding to cart:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при добавлении в корзину' }).catch(() => {});
  }
}

// Обработчик просмотра корзины
export async function handleViewCart(
  bot: BotInstance,
  msg: BotMessage | BotCallbackQuery
): Promise<void> {
  const chatId = 'chat' in msg ? msg.chat.id : msg.message?.chat.id;
  const userId = msg.from?.id;

  if (!chatId || !userId) {
    return;
  }

  try {
    const cart = await botApiClient.getCart(userId);
    const cartTotal = await botApiClient.getCartTotal(userId);
    const total = cartTotal.total;

    if (cart.length === 0) {
      const message = '🛒 Ваша корзина пуста\n\nВыберите товары из меню!';

      if ('data' in msg) {
        // Это callback query
        if (msg.message?.message_id) {
          bot
            .editMessageText(message, {
              chat_id: chatId,
              message_id: msg.message.message_id,
              reply_markup: {
                inline_keyboard: [[{ text: '🔙 Назад к меню', callback_data: 'back_to_menu' }]],
              },
            })
            .catch(() => {});
        }
        bot.answerCallbackQuery(msg.id, { text: 'Корзина пуста' }).catch(() => {});
      } else {
        // Это обычное сообщение
        bot.sendMessage(chatId, message);
      }
      return;
    }

    let message = '🛒 Ваша корзина:\n\n';
    const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];

    cart.forEach((cartItem, index) => {
      const item = cartItem.menuItem;
      const subtotal = item.price * cartItem.quantity;

      message += `${index + 1}. ${item.name}\n`;
      message += `   💰 ${item.price}₽ × ${cartItem.quantity} = ${subtotal}₽\n\n`;

      // Кнопки для изменения количества
      keyboard.push([
        { text: '➖', callback_data: `decrease_${item.id}` },
        { text: `${cartItem.quantity} шт.`, callback_data: `quantity_${item.id}` },
        { text: '➕', callback_data: `increase_${item.id}` },
        { text: '🗑', callback_data: `remove_${item.id}` },
      ]);
    });

    message += `💰 Общая сумма: ${total}₽`;

    // Кнопки управления корзиной
    keyboard.push([
      { text: '🗑 Очистить корзину', callback_data: 'clear_cart' },
      { text: '📦 Оформить заказ', callback_data: 'checkout' },
    ]);
    keyboard.push([{ text: '🔙 Назад к меню', callback_data: 'back_to_menu' }]);

    if ('data' in msg) {
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
    console.error('Error viewing cart:', error);
    const errorMessage = 'Ошибка при загрузке корзины';

    if ('data' in msg) {
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
  const itemId = query.data?.replace('increase_', '');

  if (!userId || !itemId) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  try {
    const cart = await botApiClient.getCart(userId);
    const cartItem = cart.find((item: any) => item.menuItem.id === itemId);

    if (cartItem) {
      await botApiClient.updateCartQuantity(userId, itemId, cartItem.quantity + 1);
      await handleViewCart(bot, query);
    }
  } catch (error) {
    console.error('Error increasing quantity:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при изменении количества' }).catch(() => {});
  }
}

// Обработчик уменьшения количества товара
export async function handleDecreaseQuantity(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void> {
  const userId = query.from?.id;
  const itemId = query.data?.replace('decrease_', '');

  if (!userId || !itemId) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  try {
    const cart = await botApiClient.getCart(userId);
    const cartItem = cart.find((item: any) => item.menuItem.id === itemId);

    if (cartItem) {
      const newQuantity = cartItem.quantity - 1;
      if (newQuantity <= 0) {
        await botApiClient.removeFromCart(userId, itemId);
      } else {
        await botApiClient.updateCartQuantity(userId, itemId, newQuantity);
      }
      await handleViewCart(bot, query);
    }
  } catch (error) {
    console.error('Error decreasing quantity:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при изменении количества' }).catch(() => {});
  }
}

// Обработчик удаления товара из корзины
export async function handleRemoveFromCart(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void> {
  const userId = query.from?.id;
  const itemId = query.data?.replace('remove_', '');

  if (!userId || !itemId) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  try {
    await botApiClient.removeFromCart(userId, itemId);
    bot.answerCallbackQuery(query.id, { text: 'Товар удален из корзины' }).catch(() => {});
    await handleViewCart(bot, query);
  } catch (error) {
    console.error('Error removing from cart:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при удалении товара' }).catch(() => {});
  }
}

// Обработчик очистки корзины
export async function handleClearCart(bot: BotInstance, query: BotCallbackQuery): Promise<void> {
  const userId = query.from?.id;

  if (!userId) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  try {
    await botApiClient.clearCart(userId);
    bot.answerCallbackQuery(query.id, { text: 'Корзина очищена' }).catch(() => {});
    await handleViewCart(bot, query);
  } catch (error) {
    console.error('Error clearing cart:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при очистке корзины' }).catch(() => {});
  }
}

// Обработчик оформления заказа
export async function handleCheckout(bot: BotInstance, query: BotCallbackQuery): Promise<void> {
  const chatId = query.message?.chat.id;
  const userId = query.from?.id;
  const userName = query.from?.first_name;

  if (!chatId || !userId) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  try {
    const cart = await botApiClient.getCart(userId);
    const cartTotal = await botApiClient.getCartTotal(userId);
    const total = cartTotal.total;

    if (cart.length === 0) {
      bot.answerCallbackQuery(query.id, { text: 'Корзина пуста' }).catch(() => {});
      return;
    }

    // Сохраняем пользователя в БД
    await databaseService.upsertUser(userId, query.from?.username, userName);

    // Создаем заказ в БД
    const orderId = await databaseService.createOrder(userId, cart, total);

    // Получаем созданный заказ для уведомления
    const order = await databaseService.getOrderById(orderId);

    // Отправляем уведомление персоналу (будет импортировано из bot.ts)
    if (order && (global as any).notificationService) {
      try {
        await (global as any).notificationService.notifyNewOrder(order);
      } catch (error) {
        console.error('Ошибка отправки уведомления:', error);
      }
    }

    // Очищаем корзину после успешного заказа
    await botApiClient.clearCart(userId);

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
        [{ text: '📋 Мои заказы', callback_data: 'my_orders' }],
        [{ text: '🔙 Главное меню', callback_data: 'back_to_menu' }],
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
    console.error('Error during checkout:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при оформлении заказа' }).catch(() => {});
  }
}

// Обработчик просмотра заказов пользователя
export async function handleMyOrders(
  bot: BotInstance,
  msg: BotMessage | BotCallbackQuery
): Promise<void> {
  const chatId = 'chat' in msg ? msg.chat.id : msg.message?.chat.id;
  const userId = msg.from?.id;

  if (!chatId || !userId) {
    return;
  }

  try {
    const orders = await databaseService.getUserOrders(userId, 5);

    if (orders.length === 0) {
      const message =
        '📋 У вас пока нет заказов\n\nВыберите товары из меню и оформите первый заказ!';

      if ('data' in msg) {
        // Это callback query
        if (msg.message?.message_id) {
          bot
            .editMessageText(message, {
              chat_id: chatId,
              message_id: msg.message.message_id,
              reply_markup: {
                inline_keyboard: [[{ text: '🔙 Назад к меню', callback_data: 'back_to_menu' }]],
              },
            })
            .catch(() => {});
        }
        bot.answerCallbackQuery(msg.id, { text: 'Заказов нет' }).catch(() => {});
      } else {
        // Это обычное сообщение
        bot.sendMessage(chatId, message);
      }
      return;
    }

    let message = '📋 Ваши заказы:\n\n';
    const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];

    orders.forEach((order, index) => {
      const statusEmoji =
        {
          pending: '⏳',
          confirmed: '✅',
          preparing: '👨‍🍳',
          ready: '🎉',
          delivered: '✅',
        }[order.status] || '❓';

      message += `${index + 1}. Заказ #${order.id}\n`;
      message += `   ${statusEmoji} Статус: ${getStatusText(order.status)}\n`;
      message += `   💰 Сумма: ${order.totalPrice}₽\n`;
      message += `   📅 ${formatDate(order.createdAt)}\n\n`;

      // Кнопка для просмотра деталей заказа
      keyboard.push([
        { text: `📦 Заказ #${order.id}`, callback_data: `order_details_${order.id}` },
      ]);
    });

    keyboard.push([{ text: '🔙 Назад к меню', callback_data: 'back_to_menu' }]);

    if ('data' in msg) {
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
    console.error('Error viewing orders:', error);
    const errorMessage = 'Ошибка при загрузке заказов';

    if ('data' in msg) {
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
  const orderId = query.data?.replace('order_details_', '');

  if (!chatId || !userId || !orderId) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  try {
    const order = await databaseService.getOrderById(orderId);

    if (!order || order.userId !== userId) {
      bot.answerCallbackQuery(query.id, { text: 'Заказ не найден' }).catch(() => {});
      return;
    }

    const statusEmoji =
      {
        pending: '⏳',
        confirmed: '✅',
        preparing: '👨‍🍳',
        ready: '🎉',
        delivered: '✅',
      }[order.status] || '❓';

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
        [{ text: '📋 Все заказы', callback_data: 'my_orders' }],
        [{ text: '🔙 Главное меню', callback_data: 'back_to_menu' }],
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
    console.error('Error viewing order details:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при загрузке заказа' }).catch(() => {});
  }
}

// Вспомогательные функции
function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    pending: 'В ожидании',
    confirmed: 'Подтвержден',
    preparing: 'Готовится',
    ready: 'Готов',
    delivered: 'Доставлен',
  };
  return statusMap[status] || 'Неизвестно';
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Обработчик админских действий с заказами
export async function handleAdminOrderAction(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void> {
  const userId = query.from?.id;
  const data = query.data;

  if (!userId || !data) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  // Проверяем права администратора через глобальный сервис
  const notificationService = (global as any).notificationService;
  if (!notificationService || !notificationService.isAdmin(userId)) {
    bot.answerCallbackQuery(query.id, { text: '❌ Доступ запрещен' }).catch(() => {});
    return;
  }

  try {
    if (data.startsWith('admin_confirm_')) {
      const orderId = data.replace('admin_confirm_', '');
      const oldOrder = await databaseService.getOrderById(orderId);
      await databaseService.updateOrderStatus(orderId, 'confirmed');

      const order = await databaseService.getOrderById(orderId);
      if (order && oldOrder) {
        await notificationService.notifyStatusChange(order, oldOrder.status);
      }

      bot
        .answerCallbackQuery(query.id, { text: `✅ Заказ #${orderId} подтвержден` })
        .catch(() => {});
    } else if (data.startsWith('admin_reject_')) {
      const orderId = data.replace('admin_reject_', '');
      // Здесь можно добавить статус "rejected" в типы или просто уведомить

      bot.answerCallbackQuery(query.id, { text: `❌ Заказ #${orderId} отклонен` }).catch(() => {});
    } else if (data.startsWith('admin_preparing_')) {
      const orderId = data.replace('admin_preparing_', '');
      const oldOrder = await databaseService.getOrderById(orderId);
      await databaseService.updateOrderStatus(orderId, 'preparing');

      const order = await databaseService.getOrderById(orderId);
      if (order && oldOrder) {
        await notificationService.notifyStatusChange(order, oldOrder.status);
      }

      bot.answerCallbackQuery(query.id, { text: `👨‍🍳 Заказ #${orderId} готовится` }).catch(() => {});
    } else if (data.startsWith('admin_ready_')) {
      const orderId = data.replace('admin_ready_', '');
      const oldOrder = await databaseService.getOrderById(orderId);
      await databaseService.updateOrderStatus(orderId, 'ready');

      const order = await databaseService.getOrderById(orderId);
      if (order && oldOrder) {
        await notificationService.notifyStatusChange(order, oldOrder.status);
      }

      bot.answerCallbackQuery(query.id, { text: `🎉 Заказ #${orderId} готов!` }).catch(() => {});
    } else if (data.startsWith('admin_details_')) {
      const orderId = data.replace('admin_details_', '');
      const order = await databaseService.getOrderById(orderId);

      if (order) {
        let message = `📦 <b>Заказ #${order.id}</b>\n\n`;
        message += `👤 Клиент: ${order.userName}\n`;
        message += `📅 Время: ${formatDate(order.createdAt)}\n`;
        message += `📊 Статус: ${getStatusEmoji(order.status)} ${getStatusText(order.status)}\n\n`;
        message += `🛒 <b>Состав:</b>\n`;

        order.items.forEach((item, index) => {
          const subtotal = item.menuItem.price * item.quantity;
          message += `${index + 1}. ${item.menuItem.name}\n`;
          message += `   💰 ${item.menuItem.price}₽ × ${item.quantity} = ${subtotal}₽\n`;
        });

        message += `\n💰 <b>Общая сумма: ${order.totalPrice}₽</b>`;

        await bot.sendMessage(query.from.id, message, { parse_mode: 'HTML' });
      }

      bot.answerCallbackQuery(query.id, { text: '📋 Детали отправлены' }).catch(() => {});
    }
  } catch (error) {
    console.error('Error handling admin action:', error);
    bot.answerCallbackQuery(query.id, { text: '❌ Ошибка при обработке' }).catch(() => {});
  }
}

// Вспомогательная функция для получения emoji статуса
function getStatusEmoji(status: string): string {
  const statusMap: { [key: string]: string } = {
    pending: '⏳',
    confirmed: '✅',
    preparing: '👨‍🍳',
    ready: '🎉',
    delivered: '✅',
  };
  return statusMap[status] || '❓';
}

// Обработчик информации о Mini App
export async function handleAboutMiniApp(bot: BotInstance, query: BotCallbackQuery): Promise<void> {
  const message = `
📱 Что такое Telegram Mini App?

Mini App - это веб-приложение, встроенное прямо в Telegram. Преимущества:

✅ Не нужно устанавливать отдельное приложение
✅ Быстрый доступ прямо из чата
✅ Адаптируется под тему Telegram
✅ Безопасная передача данных
✅ Работает на всех устройствах

🌯 В нашем Mini App вы можете:
• Просматривать полное меню с фотографиями
• Добавлять товары в корзину
• Оформлять заказы онлайн
• Отслеживать статус заказов
• Получать персональные рекомендации

Попробуйте прямо сейчас! 👆
  `;

  try {
    await bot.answerCallbackQuery(query.id, { text: 'ℹ️ Информация о Mini App' });

    if (query.message?.message_id) {
      await bot.editMessageText(message, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🌯 Открыть Шаурма App',
                web_app: { url: 'https://botgarden.store/' },
              },
            ],
            [
              {
                text: '🔙 Назад к началу',
                callback_data: 'back_to_start',
              },
            ],
          ],
        },
      });
    }
  } catch (error) {
    console.error('Error handling about mini app:', error);
  }
}

// Обработчик возврата к началу
export async function handleBackToStart(bot: BotInstance, query: BotCallbackQuery): Promise<void> {
  const miniAppMessage = `
🚀 Попробуйте наше новое Mini App!

В мини-приложении вы можете:
• Просматривать меню с фотографиями
• Управлять корзиной
• Отслеживать заказы
• Получать персональные рекомендации

Нажмите кнопку ниже, чтобы открыть приложение:
  `;

  const miniAppKeyboard = {
    inline_keyboard: [
      [
        {
          text: '🌯 Открыть Шаурма App',
          web_app: { url: 'https://botgarden.store/' },
        },
      ],
      [
        {
          text: '📱 Что такое Mini App?',
          callback_data: 'about_miniapp',
        },
      ],
    ],
  };

  try {
    await bot.answerCallbackQuery(query.id, { text: '🏠 Возврат к началу' });

    if (query.message?.message_id) {
      await bot.editMessageText(miniAppMessage, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: miniAppKeyboard,
      });
    }
  } catch (error) {
    console.error('Error handling back to start:', error);
  }
}

// Обработчик кнопки Mini App из главного меню
export function handleMiniApp(bot: BotInstance, msg: BotMessage): void {
  const chatId = msg.chat.id;
  const userName = msg.from?.first_name || 'Друг';

  const miniAppMessage = `
🚀 Привет, ${userName}! Добро пожаловать в наше Mini App!

В мини-приложении вы можете:
• 🍽️ Просматривать полное меню с фотографиями
• 🛒 Добавлять товары в корзину
• 📦 Оформлять заказы онлайн
• 📊 Отслеживать статус заказов в реальном времени
• 🎯 Получать персональные рекомендации
• 🎨 Пользоваться интерфейсом, адаптированным под вашу тему Telegram

Нажмите кнопку ниже, чтобы открыть приложение:
  `;

  const miniAppKeyboard = {
    inline_keyboard: [
      [
        {
          text: '🌯 Открыть Шаурма App',
          web_app: { url: 'https://botgarden.store/' },
        },
      ],
      [
        {
          text: '📱 Что такое Mini App?',
          callback_data: 'about_miniapp',
        },
      ],
      [
        {
          text: '🔙 Назад в меню',
          callback_data: 'back_to_menu',
        },
      ],
    ],
  };

  bot.sendMessage(chatId, miniAppMessage, {
    reply_markup: miniAppKeyboard,
  });
}
