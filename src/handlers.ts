import botApiClient from './api-client';
import config from './config';
import databaseService from './database';
import { getMenuByCategory, getItemById } from './menu';
import { BotInstance, BotMessage, BotCallbackQuery, MenuItem, CartItem } from './types';

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

// Получить количество товара в корзине пользователя
async function getItemQuantityInCart(userId: number, itemId: string): Promise<number> {
  try {
    const cart = await botApiClient.getCart(userId);
    const cartItem = cart.find(item => item.menuItem.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  } catch (error) {
    console.error('Error getting item quantity from cart:', error);
    return 0;
  }
}

// Создать клавиатуру с +/- для товара
function createItemQuantityKeyboard(
  itemId: string,
  currentQuantity: number
): Array<Array<{ text: string; callback_data: string }>> {
  const keyboard = [];

  if (currentQuantity === 0) {
    // Если товара нет в корзине, показываем кнопку "Добавить в корзину"
    keyboard.push([{ text: '🛒 Добавить в корзину', callback_data: `add_to_cart_${itemId}` }]);
  } else {
    // Если товар есть в корзине, показываем +/- интерфейс
    keyboard.push([
      { text: '➖', callback_data: `decrease_from_item_${itemId}` },
      { text: `${currentQuantity} шт.`, callback_data: `quantity_${itemId}` },
      { text: '➕', callback_data: `increase_from_item_${itemId}` },
    ]);

    // Добавляем кнопку быстрого удаления
    keyboard.push([
      { text: '🗑 Убрать все из корзины', callback_data: `remove_all_from_item_${itemId}` },
    ]);
  }

  // Кнопки навигации
  keyboard.push([
    { text: '🛒 Перейти в корзину', callback_data: 'view_cart' },
    { text: '🔙 Назад к каталогу', callback_data: 'back_to_menu' },
  ]);

  return keyboard;
}

// Создать главную клавиатуру с индикатором корзины
async function createMainKeyboardWithBadge(userId?: number): Promise<any> {
  let cartText = '🛒 Корзина';

  if (userId) {
    try {
      const cartTotal = await botApiClient.getCartTotal(userId);
      if (cartTotal.itemsCount > 0) {
        cartText = `🛒 Корзина (${cartTotal.itemsCount})`;
      }
    } catch (error) {
      console.error('Error getting cart total for badge:', error);
    }
  }

  return {
    keyboard: [
      [{ text: '🌯 Шаурма' }, { text: '🥤 Напитки' }],
      [{ text: cartText }, { text: '📋 Мои заказы' }],
      [{ text: '📱 Mini App' }, { text: 'ℹ️ О нас' }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}

// Создать каталог с быстрыми кнопками +/-
async function createCatalogKeyboard(
  items: MenuItem[],
  userId: number
): Promise<Array<Array<{ text: string; callback_data: string }>>> {
  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];

  // Получаем корзину пользователя один раз
  let cart: CartItem[] = [];
  try {
    cart = await botApiClient.getCart(userId);
    // Убеждаемся что cart это массив
    if (!Array.isArray(cart)) {
      cart = [];
    }
  } catch (error) {
    console.error('Error getting cart for catalog:', error);
    cart = [];
  }

  items.forEach(item => {
    const cartItem = cart.find(cartItem => cartItem.menuItem.id === item.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    const photoIcon = item.photo ? '📸 ' : '';

    // Строка с товаром и быстрыми кнопками
    if (quantity === 0) {
      keyboard.push([
        { text: `👁 ${photoIcon}${item.name} - ${item.price}₽`, callback_data: `item_${item.id}` },
        { text: '➕', callback_data: `quick_add_${item.id}` },
      ]);
    } else {
      keyboard.push([
        { text: `👁 ${photoIcon}${item.name} - ${item.price}₽`, callback_data: `item_${item.id}` },
      ]);
      keyboard.push([
        { text: '➖', callback_data: `quick_decrease_${item.id}` },
        { text: `${quantity} шт.`, callback_data: `item_${item.id}` },
        { text: '➕', callback_data: `quick_increase_${item.id}` },
      ]);
    }
  });

  // Кнопка назад
  keyboard.push([{ text: '🔙 Назад в меню', callback_data: 'back_to_menu' }]);

  return keyboard;
}

// Обновить главное меню с актуальным счетчиком корзины
async function updateMainKeyboard(bot: BotInstance, chatId: number, userId: number): Promise<void> {
  try {
    const keyboard = await createMainKeyboardWithBadge(userId);
    const message = `
🥙 Главное меню

Выберите действие:
    `;

    await bot.sendMessage(chatId, message, {
      reply_markup: keyboard,
    });
  } catch (error) {
    console.error('Error updating main keyboard:', error);
  }
}

// ===== ОБРАБОТЧИКИ =====

// Обработчик команды /start
export async function handleStart(bot: BotInstance, msg: BotMessage): Promise<void> {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const userName = msg.from?.first_name || 'Друг';

  const welcomeMessage = `
🥙 Привет, ${userName}! Добро пожаловать в Шаурма Бот!

Здесь вы можете посмотреть наше меню и выбрать что-то вкусное.

Выберите действие:
  `;

  // Создаем клавиатуру с индикатором корзины
  const keyboard = await createMainKeyboardWithBadge(userId);

  // Отправляем приветствие с обновленной клавиатурой
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
export async function handleShawarmaMenu(bot: BotInstance, msg: BotMessage): Promise<void> {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const items = getMenuByCategory('shawarma');

  if (!userId) {
    bot.sendMessage(chatId, 'Ошибка: не удалось определить пользователя');
    return;
  }

  let message = '🌯 Наша шаурма:\n\n';

  // Добавляем краткое описание товаров в текст
  items.forEach((item, index) => {
    const photoIcon = item.photo ? '📸 ' : '';
    message += `${index + 1}. ${photoIcon}${item.name} - ${item.price}₽\n`;
    message += `   📝 ${item.description}\n\n`;
  });

  message += `💡 Используйте кнопки ➕ для быстрого добавления или 👁 для подробной информации о товаре.`;

  // Создаем клавиатуру с быстрыми кнопками
  const keyboard = await createCatalogKeyboard(items, userId);

  bot.sendMessage(chatId, message, {
    reply_markup: { inline_keyboard: keyboard },
  });
}

// Обработчик категории "Напитки"
export async function handleDrinksMenu(bot: BotInstance, msg: BotMessage): Promise<void> {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;
  const items = getMenuByCategory('drinks');

  if (!userId) {
    bot.sendMessage(chatId, 'Ошибка: не удалось определить пользователя');
    return;
  }

  let message = '🥤 Наши напитки:\n\n';

  // Добавляем краткое описание товаров в текст
  items.forEach((item, index) => {
    message += `${index + 1}. ${item.name} - ${item.price}₽\n`;
    message += `   📝 ${item.description}\n\n`;
  });

  message += `💡 Используйте кнопки ➕ для быстрого добавления или 👁 для подробной информации о товаре.`;

  // Создаем клавиатуру с быстрыми кнопками
  const keyboard = await createCatalogKeyboard(items, userId);

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
export async function handleItemSelection(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void> {
  const chatId = query.message?.chat.id;
  const userId = query.from?.id;
  const itemId = query.data?.replace('item_', '');

  if (!chatId || !itemId || !userId) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  const item = getItemById(itemId);

  if (!item) {
    bot.answerCallbackQuery(query.id, { text: 'Товар не найден' }).catch(() => {});
    return;
  }

  // Получаем текущее количество товара в корзине
  const currentQuantity = await getItemQuantityInCart(userId, itemId);

  // Формируем сообщение с подробной информацией
  let message = `
📦 ${item.name}

💰 Цена: ${item.price} руб.
📝 ${item.description}
`;

  // Добавляем информацию о корзине
  if (currentQuantity > 0) {
    const subtotal = item.price * currentQuantity;
    message += `\n🛒 В корзине: ${currentQuantity} шт.`;
    message += `\n💰 Подытог: ${subtotal}₽`;
  }

  message += `\n\nВыберите действие:`;

  // Создаем клавиатуру с +/- интерфейсом
  const keyboard = {
    inline_keyboard: createItemQuantityKeyboard(itemId, currentQuantity),
  };

  // Если у товара есть фотография, отправляем её
  if (item.photo) {
    // Формируем URL изображения вместо локального пути
    const photoUrl = `${config.ASSETS_BASE_URL}/${item.photo.replace('assets/', '')}`;

    console.log(`📸 Отправляем фото по URL: ${photoUrl}`);
    bot
      .sendPhoto(chatId, photoUrl, {
        caption: message,
        reply_markup: keyboard,
      })
      .catch(error => {
        console.error('❌ Ошибка отправки фото:', error);
        // Если не удалось отправить фото, отправляем обычное сообщение
        bot.sendMessage(chatId, message, { reply_markup: keyboard }).catch(() => {});
      });
  } else {
    // Если фото нет, отправляем/редактируем сообщение
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

  // Улучшенное уведомление
  const notificationText =
    currentQuantity > 0 ? `📦 ${item.name} • В корзине: ${currentQuantity} шт.` : `📦 ${item.name}`;

  bot.answerCallbackQuery(query.id, { text: notificationText }).catch(() => {});
}

// Обработчик возврата в главное меню
export async function handleBackToMenu(bot: BotInstance, query: BotCallbackQuery): Promise<void> {
  const chatId = query.message?.chat.id;
  const userId = query.from?.id;
  const userName = query.from?.first_name || 'Друг';

  if (!chatId || !userId) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  const welcomeMessage = `
🥙 Привет, ${userName}! Добро пожаловать в Шаурма Бот!

Здесь вы можете посмотреть наше меню и выбрать что-то вкусное.

Выберите категорию:
  `;

  // Создаем клавиатуру с актуальным счетчиком корзины
  const keyboard = await createMainKeyboardWithBadge(userId);

  if (query.message?.message_id) {
    bot
      .editMessageText(welcomeMessage, {
        chat_id: chatId,
        message_id: query.message.message_id,
      })
      .catch(() => {});
  }

  // Обновляем главную клавиатуру с актуальным счетчиком
  bot.sendMessage(chatId, '🏠 Главное меню обновлен', {
    reply_markup: keyboard,
  });

  bot.answerCallbackQuery(query.id, { text: '🏠 Возврат в главное меню' }).catch(() => {});
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
    const cartTotalPrice = cartTotal.total;

    // Улучшенное уведомление с подробной информацией
    bot
      .answerCallbackQuery(query.id, {
        text: `✅ ${item.name} добавлен! В корзине: ${cartCount} товаров на ${cartTotalPrice}₽`,
      })
      .catch(() => {});

    // Вместо смены интерфейса, обновляем тот же экран товара
    // Создаем новый query объект для вызова handleItemSelection
    const updatedQuery = {
      ...query,
      data: `item_${itemId}`,
    };

    // Вызываем обработчик выбора товара для обновления интерфейса
    await handleItemSelection(bot, updatedQuery);
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

// Обработчик увеличения количества товара с экрана товара
export async function handleIncreaseFromItem(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void> {
  const userId = query.from?.id;
  const itemId = query.data?.replace('increase_from_item_', '');

  if (!userId || !itemId) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  try {
    const cart = await botApiClient.getCart(userId);
    const cartItem = cart.find((item: any) => item.menuItem.id === itemId);

    if (cartItem) {
      await botApiClient.updateCartQuantity(userId, itemId, cartItem.quantity + 1);

      // Получаем обновленную информацию о корзине для уведомления
      const cartTotal = await botApiClient.getCartTotal(userId);
      const item = getItemById(itemId);

      bot
        .answerCallbackQuery(query.id, {
          text: `➕ ${item?.name} добавлен! В корзине: ${cartTotal.itemsCount} товаров на ${cartTotal.total}₽`,
        })
        .catch(() => {});

      // Обновляем экран товара
      const updatedQuery = { ...query, data: `item_${itemId}` };
      await handleItemSelection(bot, updatedQuery);
    }
  } catch (error) {
    console.error('Error increasing quantity from item:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при изменении количества' }).catch(() => {});
  }
}

// Обработчик уменьшения количества товара с экрана товара
export async function handleDecreaseFromItem(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void> {
  const userId = query.from?.id;
  const itemId = query.data?.replace('decrease_from_item_', '');

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
        bot.answerCallbackQuery(query.id, { text: '🗑 Товар удален из корзины' }).catch(() => {});
      } else {
        await botApiClient.updateCartQuantity(userId, itemId, newQuantity);

        // Получаем обновленную информацию о корзине для уведомления
        const cartTotal = await botApiClient.getCartTotal(userId);
        const item = getItemById(itemId);

        bot
          .answerCallbackQuery(query.id, {
            text: `➖ ${item?.name} убран! В корзине: ${cartTotal.itemsCount} товаров на ${cartTotal.total}₽`,
          })
          .catch(() => {});
      }

      // Обновляем экран товара
      const updatedQuery = { ...query, data: `item_${itemId}` };
      await handleItemSelection(bot, updatedQuery);
    }
  } catch (error) {
    console.error('Error decreasing quantity from item:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при изменении количества' }).catch(() => {});
  }
}

// Обработчик быстрого удаления всех единиц товара с экрана товара
export async function handleRemoveAllFromItem(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void> {
  const userId = query.from?.id;
  const itemId = query.data?.replace('remove_all_from_item_', '');

  if (!userId || !itemId) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  try {
    await botApiClient.removeFromCart(userId, itemId);
    const item = getItemById(itemId);

    bot
      .answerCallbackQuery(query.id, { text: `🗑 ${item?.name} полностью удален из корзины` })
      .catch(() => {});

    // Обновляем экран товара
    const updatedQuery = { ...query, data: `item_${itemId}` };
    await handleItemSelection(bot, updatedQuery);
  } catch (error) {
    console.error('Error removing all from item:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при удалении товара' }).catch(() => {});
  }
}

// Обработчик быстрого добавления товара из каталога
export async function handleQuickAdd(bot: BotInstance, query: BotCallbackQuery): Promise<void> {
  const userId = query.from?.id;
  const itemId = query.data?.replace('quick_add_', '');

  if (!userId || !itemId) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  const item = getItemById(itemId);
  if (!item) {
    bot.answerCallbackQuery(query.id, { text: 'Товар не найден' }).catch(() => {});
    return;
  }

  try {
    await botApiClient.addToCart(userId, itemId, 1);
    const cartTotal = await botApiClient.getCartTotal(userId);

    bot
      .answerCallbackQuery(query.id, {
        text: `✅ ${item.name} добавлен! В корзине: ${cartTotal.itemsCount} товаров на ${cartTotal.total}₽`,
      })
      .catch(() => {});

    // Обновляем каталог с новыми кнопками
    const category = item.category;
    if (category === 'shawarma') {
      await handleShawarmaMenu(bot, {
        chat: { id: query.message?.chat.id! },
        from: query.from,
      } as BotMessage);
    } else if (category === 'drinks') {
      await handleDrinksMenu(bot, {
        chat: { id: query.message?.chat.id! },
        from: query.from,
      } as BotMessage);
    }
  } catch (error) {
    console.error('Error quick adding item:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при добавлении товара' }).catch(() => {});
  }
}

// Обработчик быстрого увеличения количества из каталога
export async function handleQuickIncrease(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void> {
  const userId = query.from?.id;
  const itemId = query.data?.replace('quick_increase_', '');

  if (!userId || !itemId) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  try {
    const cart = await botApiClient.getCart(userId);
    const cartItem = cart.find((item: any) => item.menuItem.id === itemId);

    if (cartItem) {
      await botApiClient.updateCartQuantity(userId, itemId, cartItem.quantity + 1);

      const cartTotal = await botApiClient.getCartTotal(userId);
      const item = getItemById(itemId);

      bot
        .answerCallbackQuery(query.id, {
          text: `➕ ${item?.name} добавлен! В корзине: ${cartTotal.itemsCount} товаров на ${cartTotal.total}₽`,
        })
        .catch(() => {});

      // Обновляем каталог
      const category = item?.category;
      if (category === 'shawarma') {
        await handleShawarmaMenu(bot, {
          chat: { id: query.message?.chat.id! },
          from: query.from,
        } as BotMessage);
      } else if (category === 'drinks') {
        await handleDrinksMenu(bot, {
          chat: { id: query.message?.chat.id! },
          from: query.from,
        } as BotMessage);
      }
    }
  } catch (error) {
    console.error('Error quick increasing quantity:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при изменении количества' }).catch(() => {});
  }
}

// Обработчик быстрого уменьшения количества из каталога
export async function handleQuickDecrease(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void> {
  const userId = query.from?.id;
  const itemId = query.data?.replace('quick_decrease_', '');

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

        const item = getItemById(itemId);
        bot
          .answerCallbackQuery(query.id, { text: `🗑 ${item?.name} удален из корзины` })
          .catch(() => {});
      } else {
        await botApiClient.updateCartQuantity(userId, itemId, newQuantity);

        const cartTotal = await botApiClient.getCartTotal(userId);
        const item = getItemById(itemId);

        bot
          .answerCallbackQuery(query.id, {
            text: `➖ ${item?.name} убран! В корзине: ${cartTotal.itemsCount} товаров на ${cartTotal.total}₽`,
          })
          .catch(() => {});
      }

      // Обновляем каталог
      const item = getItemById(itemId);
      const category = item?.category;
      if (category === 'shawarma') {
        await handleShawarmaMenu(bot, {
          chat: { id: query.message?.chat.id! },
          from: query.from,
        } as BotMessage);
      } else if (category === 'drinks') {
        await handleDrinksMenu(bot, {
          chat: { id: query.message?.chat.id! },
          from: query.from,
        } as BotMessage);
      }
    }
  } catch (error) {
    console.error('Error quick decreasing quantity:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при изменении количества' }).catch(() => {});
  }
}
