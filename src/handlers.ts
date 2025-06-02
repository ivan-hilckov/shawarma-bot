// eslint-disable-next-line import/no-named-as-default
import botApiClient from './api-client';
import config from './config';
// eslint-disable-next-line import/no-named-as-default
import databaseService from './database';
import { getMenuByCategory, getItemById } from './menu';
import { serviceRegistry } from './services';
import { BotInstance, BotMessage, BotCallbackQuery, MenuItem } from './types';

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

// Получить количество товара в корзине пользователя
export async function getItemQuantityInCart(userId: number, itemId: string): Promise<number> {
  try {
    const cart = await botApiClient.getCart(userId);
    const cartItem = cart.find(item => item.menuItem.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  } catch (error) {
    console.error('Error getting item quantity from cart:', error);
    return 0;
  }
}

// ===== УЛУЧШЕННЫЕ HELPER ФУНКЦИИ ДЛЯ ИСПРАВЛЕНИЯ БАГОВ =====

// Результат операции с корзиной
interface CartOperationResult {
  success: boolean;
  newQuantity?: number;
  cartTotal?: { total: number; itemsCount: number };
  error?: string;
}

// Атомарное обновление товара в корзине с optimistic updates
async function updateCartItemAtomically(
  userId: number,
  itemId: string,
  operation: 'increase' | 'decrease' | 'remove'
): Promise<CartOperationResult> {
  console.log(`🛒 Атомарная операция ${operation} для товара ${itemId}, пользователь ${userId}`);

  try {
    // Шаг 1: Получаем текущее состояние корзины
    const cart = await botApiClient.getCart(userId);
    const cartItem = cart.find(item => item.menuItem.id === itemId);

    console.log(`📊 Текущее количество товара в корзине: ${cartItem ? cartItem.quantity : 0}`);

    if (!cartItem && operation !== 'increase') {
      console.log(`❌ Товар ${itemId} не найден в корзине для операции ${operation}`);
      return { success: false, error: 'Товар не найден в корзине' };
    }

    // Шаг 2: Вычисляем новое количество
    let newQuantity: number;
    switch (operation) {
      case 'increase':
        newQuantity = cartItem ? cartItem.quantity + 1 : 1;
        break;
      case 'decrease':
        if (!cartItem) return { success: false, error: 'Товар не найден в корзине' };
        newQuantity = cartItem.quantity - 1;
        break;
      case 'remove':
        newQuantity = 0;
        break;
    }

    console.log(`🔢 Новое количество: ${newQuantity}`);

    // Шаг 3: Выполняем операцию
    if (newQuantity <= 0) {
      console.log(`🗑️ Удаляем товар ${itemId} из корзины`);
      await botApiClient.removeFromCart(userId, itemId);
    } else {
      if (cartItem) {
        console.log(`📝 Обновляем количество товара ${itemId} до ${newQuantity}. Вызываем API...`);
        console.log(`📡 API Call: updateCartQuantity(${userId}, "${itemId}", ${newQuantity})`);
        await botApiClient.updateCartQuantity(userId, itemId, newQuantity);
        console.log(`✅ API Call завершен успешно`);
      } else {
        console.log(
          `➕ Добавляем товар ${itemId} в корзину с количеством ${newQuantity}. Вызываем API...`
        );
        console.log(`📡 API Call: addToCart(${userId}, "${itemId}", ${newQuantity})`);
        await botApiClient.addToCart(userId, itemId, newQuantity);
        console.log(`✅ API Call завершен успешно`);
      }
    }

    // Шаг 4: Получаем обновленные данные корзины
    const cartTotal = await botApiClient.getCartTotal(userId);
    console.log(
      `✅ Операция завершена. Итого в корзине: ${cartTotal.itemsCount} товаров на ${cartTotal.total}₽`
    );

    return {
      success: true,
      newQuantity: newQuantity > 0 ? newQuantity : 0,
      cartTotal,
    };
  } catch (error) {
    console.error(`❌ КРИТИЧЕСКАЯ ОШИБКА в updateCartItemAtomically для товара ${itemId}:`, error);
    console.error(`🔍 Детали ошибки:`, {
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      itemId,
      operation,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

// Обновление отображения товара без ручного создания query
async function refreshItemDisplay(
  bot: BotInstance,
  originalQuery: BotCallbackQuery,
  itemId: string
): Promise<void> {
  console.log(`🔄 Обновляем отображение товара ${itemId}`);

  const chatId = originalQuery.message?.chat.id;
  const userId = originalQuery.from?.id;

  if (!chatId || !userId) {
    console.error('Missing chatId or userId for refreshItemDisplay');
    return;
  }

  try {
    // Получаем актуальную информацию о товаре и корзине
    const item = getItemById(itemId);
    if (!item) {
      console.error(`Item ${itemId} not found for refresh`);
      return;
    }

    const currentQuantity = await getItemQuantityInCart(userId, itemId);
    const keyboard = await createItemKeyboard(itemId, currentQuantity, item.category);

    // Формируем сообщение
    let message = `
${item.name}

Цена: ${item.price} руб.
${item.description}
`;

    if (currentQuantity > 0) {
      const subtotal = item.price * currentQuantity;
      message += `\nВ корзине: ${currentQuantity} шт. (${subtotal}₽)`;
    }

    message += `\n\nВыберите действие:`;

    // Обновляем сообщение - проверяем есть ли фото
    if (originalQuery.message?.message_id) {
      if (originalQuery.message.photo) {
        console.log(`📸 Обновляем caption фото товара ${itemId}`);
        // Если это сообщение с фото, редактируем caption
        await bot.editMessageCaption(message, {
          chat_id: chatId,
          message_id: originalQuery.message.message_id,
          reply_markup: { inline_keyboard: keyboard },
        });
      } else {
        console.log(`📝 Обновляем текст сообщения товара ${itemId}`);
        // Если это текстовое сообщение, редактируем text
        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: originalQuery.message.message_id,
          reply_markup: { inline_keyboard: keyboard },
        });
      }
      console.log(`✅ Интерфейс товара ${itemId} успешно обновлен`);
    }
  } catch (error) {
    console.error(`❌ Ошибка обновления интерфейса товара ${itemId}:`, error);

    // Если не можем обновить - отправляем новое сообщение
    try {
      const item = getItemById(itemId);
      console.log(`🔧 Отправляем fallback сообщение для товара ${itemId}`);

      await bot.sendMessage(chatId, `❌ Ошибка обновления. Товар: ${item?.name || 'Неизвестный'}`, {
        reply_markup: {
          inline_keyboard: [[{ text: 'Назад к каталогу', callback_data: 'back_to_menu' }]],
        },
      });
    } catch (fallbackError) {
      console.error('❌ Критическая ошибка в fallback сообщении:', fallbackError);
    }
  }
}

// Создать простой каталог товаров
async function createCatalogKeyboard(
  items: MenuItem[]
): Promise<Array<Array<{ text: string; callback_data: string }>>> {
  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];

  items.forEach(item => {
    const photoIcon = item.photo ? '📸 ' : '';
    // Простая кнопка с названием и ценой
    keyboard.push([
      { text: `${photoIcon}${item.name} — ${item.price}₽`, callback_data: `item_${item.id}` },
    ]);
  });

  // Кнопка назад
  keyboard.push([{ text: 'Назад в меню', callback_data: 'back_to_menu' }]);

  return keyboard;
}

// ===== НОВЫЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ЭТАПА 3 =====

// Создать клавиатуру для товара
export async function createItemKeyboard(
  itemId: string,
  currentQuantity: number,
  category?: 'shawarma' | 'drinks'
): Promise<Array<Array<{ text: string; callback_data: string }>>> {
  const keyboard = [];

  if (currentQuantity === 0) {
    // Если товара нет в корзине, показываем кнопку "Добавить в корзину"
    keyboard.push([{ text: 'Добавить в корзину', callback_data: `add_to_cart_${itemId}` }]);
  } else {
    // Если товар есть в корзине, показываем +/- интерфейс
    keyboard.push([
      { text: '−', callback_data: `decrease_from_item_${itemId}` },
      { text: `${currentQuantity} шт.`, callback_data: `quantity_${itemId}` },
      { text: '+', callback_data: `increase_from_item_${itemId}` },
    ]);
  }

  // Кнопки навигации с контекстным возвратом
  const backText =
    category === 'shawarma' ? 'К шаурме' : category === 'drinks' ? 'К напиткам' : 'К каталогу';
  const backAction =
    category === 'shawarma'
      ? 'back_to_shawarma'
      : category === 'drinks'
        ? 'back_to_drinks'
        : 'back_to_menu';

  keyboard.push([
    { text: 'Перейти в корзину', callback_data: 'view_cart' },
    { text: backText, callback_data: backAction },
  ]);

  return keyboard;
}

// Создать упрощенную клавиатуру главного меню
async function createMainKeyboard(): Promise<any> {
  return {
    keyboard: [
      [{ text: '🌯 Шаурма' }, { text: '🥤 Напитки' }],
      [{ text: '🛒 Корзина' }, { text: '👤 Профиль' }],
      [{ text: 'ℹ️ О нас' }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}

// ===== ОБРАБОТЧИКИ =====

// Обработчик команды /start
export async function handleStart(bot: BotInstance, msg: BotMessage): Promise<void> {
  const chatId = msg.chat.id;
  const userName = msg.from?.first_name || 'Друг';

  const welcomeMessage = `
Привет, ${userName}! 👋

Добро пожаловать в наш бот для заказа вкусной шаурмы!

Здесь вы можете:
• Посмотреть наше меню
• Добавить товары в корзину
• Оформить заказ
• Отследить статус заказа

Выберите нужное действие в меню ниже.
  `;

  // Создаем клавиатуру
  const keyboard = await createMainKeyboard();

  // Отправляем приветствие с обновленной клавиатурой
  bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: keyboard,
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

  let message = 'Наша шаурма 🌯\n\n';

  // Добавляем краткое описание товаров в текст
  items.forEach((item, index) => {
    const photoIcon = item.photo ? '📸 ' : '';
    message += `${index + 1}. ${photoIcon}${item.name} — ${item.price}₽\n`;
    message += `${item.description}\n\n`;
  });

  message += `Нажмите на название товара для подробной информации и добавления в корзину.`;

  // Создаем клавиатуру каталога
  const keyboard = await createCatalogKeyboard(items);

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

  let message = 'Наши напитки 🥤\n\n';

  // Добавляем краткое описание товаров в текст
  items.forEach((item, index) => {
    message += `${index + 1}. ${item.name} — ${item.price}₽\n`;
    message += `${item.description}\n\n`;
  });

  message += `Нажмите на название товара для подробной информации и добавления в корзину.`;

  // Создаем клавиатуру каталога
  const keyboard = await createCatalogKeyboard(items);

  bot.sendMessage(chatId, message, {
    reply_markup: { inline_keyboard: keyboard },
  });
}

// Обработчик информации о заведении
export function handleAbout(bot: BotInstance, msg: BotMessage): void {
  const chatId = msg.chat.id;

  const aboutMessage = `
О нас ℹ️

Мы готовим самую вкусную шаурму в городе!

Время работы: 10:00 — 23:00
Телефон: +7 (999) 123-45-67
Адрес: г. Москва, ул. Примерная, д. 1

Это демо-версия бота. В будущем здесь будет возможность оформления реальных заказов!

📱 Также попробуйте наше мини-приложение с расширенными возможностями!
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

  bot.sendMessage(chatId, aboutMessage, {
    reply_markup: miniAppKeyboard,
  });
}

// Обработчик профиля пользователя
export async function handleProfile(
  bot: BotInstance,
  msg: BotMessage | BotCallbackQuery
): Promise<void> {
  const chatId = 'chat' in msg ? msg.chat.id : msg.message?.chat.id;
  const userId = msg.from?.id;
  const userName = msg.from?.first_name || 'Пользователь';

  if (!chatId || !userId) {
    return;
  }

  try {
    // Получаем статистику пользователя
    const userStats = await databaseService.getUserStats(userId);

    let message = `Профиль пользователя 👤\n\n`;
    message += `Привет, ${userName}! 👋\n\n`;

    if (userStats.totalOrders > 0) {
      message += `📊 Ваша статистика:\n`;
      message += `• Заказов: ${userStats.totalOrders}\n`;
      message += `• Потрачено: ${userStats.totalSpent.toFixed(0)}₽\n`;
      message += `• Средний чек: ${userStats.avgOrderValue.toFixed(0)}₽\n\n`;
    } else {
      message += `Добро пожаловать! 🎉\nВы еще не делали заказов.\n\n`;
    }

    message += `Выберите действие:`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '📋 Мои заказы', callback_data: 'my_orders' }],
        [{ text: 'Назад в меню', callback_data: 'back_to_menu' }],
      ],
    };

    if ('data' in msg) {
      // Это callback query
      if (msg.message?.message_id) {
        bot
          .editMessageText(message, {
            chat_id: chatId,
            message_id: msg.message.message_id,
            reply_markup: keyboard,
          })
          .catch(() => {});
      }
      bot.answerCallbackQuery(msg.id, { text: 'Профиль' }).catch(() => {});
    } else {
      // Это обычное сообщение
      bot.sendMessage(chatId, message, {
        reply_markup: keyboard,
      });
    }
  } catch (error) {
    console.error('Error viewing profile:', error);
    const errorMessage = 'Ошибка при загрузке профиля';

    if ('data' in msg) {
      bot.answerCallbackQuery(msg.id, { text: errorMessage }).catch(() => {});
    } else {
      bot.sendMessage(chatId, errorMessage);
    }
  }
}

// Результат отправки сообщения с товаром
interface ItemDisplayResult {
  success: boolean;
  method: 'photo' | 'text' | 'error';
  error?: string;
}

// Единая функция для отправки информации о товаре
async function sendItemMessage(
  bot: BotInstance,
  chatId: number,
  item: MenuItem,
  message: string,
  keyboard: any
): Promise<ItemDisplayResult> {
  // Если у товара есть фотография, пытаемся отправить её
  if (item.photo) {
    try {
      const photoUrl = `${config.ASSETS_BASE_URL}/${item.photo.replace('assets/', '')}`;

      await bot.sendPhoto(chatId, photoUrl, {
        caption: message,
        reply_markup: keyboard,
      });

      return { success: true, method: 'photo' };
    } catch (photoError) {
      console.warn(`Не удалось отправить фото для товара ${item.name}:`, photoError);
      // Fallback: отправляем текстовое сообщение с emoji фото
      try {
        await bot.sendMessage(chatId, `📸 ${message}`, { reply_markup: keyboard });
        return { success: true, method: 'text' };
      } catch (textError) {
        return {
          success: false,
          method: 'error',
          error: `Ошибка отправки текста: ${textError instanceof Error ? textError.message : textError}`,
        };
      }
    }
  } else {
    // Если фото нет, отправляем текстовое сообщение
    try {
      await bot.sendMessage(chatId, message, { reply_markup: keyboard });
      return { success: true, method: 'text' };
    } catch (textError) {
      return {
        success: false,
        method: 'error',
        error: `Ошибка отправки текста: ${textError instanceof Error ? textError.message : textError}`,
      };
    }
  }
}

// Обработчик выбора товара (УЛУЧШЕННЫЙ - без дублирования сообщений)
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

  try {
    // Получаем текущее количество товара в корзине
    const currentQuantity = await getItemQuantityInCart(userId, itemId);

    // Формируем сообщение с подробной информацией
    let message = `
${item.name}

Цена: ${item.price} руб.
${item.description}
`;

    // Добавляем информацию о корзине
    if (currentQuantity > 0) {
      const subtotal = item.price * currentQuantity;
      message += `\nВ корзине: ${currentQuantity} шт. (${subtotal}₽)`;
    }

    message += `\n\nВыберите действие:`;

    // Создаем клавиатуру с +/- интерфейсом
    const keyboard = {
      inline_keyboard: await createItemKeyboard(itemId, currentQuantity, item.category),
    };

    // ЕДИНСТВЕННАЯ точка отправки сообщения - решает проблему дублирования
    const result = await sendItemMessage(bot, chatId, item, message, keyboard);

    if (result.success) {
      // Успех: отвечаем на callback query с информацией о методе отправки
      const methodText =
        result.method === 'photo' ? '📸 Фото загружено' : '📝 Информация загружена';
      bot.answerCallbackQuery(query.id, { text: methodText }).catch(() => {});
    } else {
      // Ошибка отправки: отправляем базовое сообщение об ошибке
      console.error('Ошибка отправки сообщения о товаре:', result.error);

      await bot.sendMessage(chatId, `❌ Ошибка загрузки товара "${item.name}". Попробуйте снова.`, {
        reply_markup: {
          inline_keyboard: [[{ text: 'Назад к каталогу', callback_data: 'back_to_menu' }]],
        },
      });

      bot.answerCallbackQuery(query.id, { text: 'Ошибка загрузки товара' }).catch(() => {});
    }
  } catch (error) {
    console.error('Критическая ошибка в handleItemSelection:', error);

    // Fallback: минимальный ответ пользователю
    bot
      .answerCallbackQuery(query.id, { text: 'Ошибка загрузки. Попробуйте снова.' })
      .catch(() => {});

    // Попытка отправить сообщение об ошибке
    try {
      await bot.sendMessage(
        chatId,
        `❌ Критическая ошибка при загрузке товара. Попробуйте снова.`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: 'Назад к каталогу', callback_data: 'back_to_menu' }]],
          },
        }
      );
    } catch (fallbackError) {
      console.error('Не удалось отправить даже fallback сообщение:', fallbackError);
    }
  }
}

// Обработчик возврата к профилю
export async function handleBackToProfile(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void> {
  await handleProfile(bot, query);
}

// Обработчик возврата к шаурме
export async function handleBackToShawarma(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void> {
  const mockMessage = {
    chat: { id: query.message?.chat.id || 0 },
    from: query.from,
  } as BotMessage;

  try {
    await handleShawarmaMenu(bot, mockMessage);
    bot.answerCallbackQuery(query.id, { text: 'Возврат к шаурме' }).catch(() => {});
  } catch (error) {
    console.error('Error returning to shawarma menu:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка возврата' }).catch(() => {});
  }
}

// Обработчик возврата к напиткам
export async function handleBackToDrinks(bot: BotInstance, query: BotCallbackQuery): Promise<void> {
  const mockMessage = {
    chat: { id: query.message?.chat.id || 0 },
    from: query.from,
  } as BotMessage;

  try {
    await handleDrinksMenu(bot, mockMessage);
    bot.answerCallbackQuery(query.id, { text: 'Возврат к напиткам' }).catch(() => {});
  } catch (error) {
    console.error('Error returning to drinks menu:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка возврата' }).catch(() => {});
  }
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
Привет, ${userName}! 👋

Добро пожаловать в наш бот для заказа вкусной шаурмы!

Выберите нужную категорию из меню ниже.
  `;

  // Создаем клавиатуру
  const keyboard = await createMainKeyboard();

  if (query.message?.message_id) {
    bot
      .editMessageText(welcomeMessage, {
        chat_id: chatId,
        message_id: query.message.message_id,
      })
      .catch(() => {});
  }

  // Обновляем главную клавиатуру с актуальным счетчиком
  bot.sendMessage(chatId, 'Главное меню обновлено 🏠', {
    reply_markup: keyboard,
  });

  bot.answerCallbackQuery(query.id, { text: 'Возврат в главное меню' }).catch(() => {});
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
        text: `${item.name} добавлен! В корзине: ${cartCount} товаров на ${cartTotalPrice}₽`,
      })
      .catch(() => {});

    // Обновляем отображение товара
    await refreshItemDisplay(bot, query, itemId);
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
  console.log(`🛒 ВХОД В handleViewCart! Тип сообщения: ${'data' in msg ? 'callback' : 'message'}`);

  const chatId = 'chat' in msg ? msg.chat.id : msg.message?.chat.id;
  const userId = msg.from?.id;

  console.log(`🛒 chatId: ${chatId}, userId: ${userId}`);

  if (!chatId || !userId) {
    console.log(`❌ Ошибка в handleViewCart: отсутствует chatId или userId`);
    return;
  }

  try {
    console.log(`🛒 Получаем данные корзины для пользователя ${userId}`);
    const cart = await botApiClient.getCart(userId);
    console.log(`🛒 Корзина получена, товаров: ${cart.length}`);

    const cartTotal = await botApiClient.getCartTotal(userId);
    console.log(`🛒 Итого корзины получено: ${cartTotal.total}₽`);
    const total = cartTotal.total;

    if (cart.length === 0) {
      console.log(`🛒 Корзина пуста, отправляем сообщение об этом`);
      const message = 'Ваша корзина пуста 🛒\n\nВыберите товары из меню для заказа.';

      if ('data' in msg) {
        // Это callback query
        console.log(`🛒 Отправляем пустую корзину через callback`);
        if (msg.message?.message_id) {
          bot
            .editMessageText(message, {
              chat_id: chatId,
              message_id: msg.message.message_id,
              reply_markup: {
                inline_keyboard: [[{ text: 'Назад к меню', callback_data: 'back_to_menu' }]],
              },
            })
            .catch(() => {});
        }
        bot.answerCallbackQuery(msg.id, { text: 'Корзина пуста' }).catch(() => {});
        console.log(`🛒 Ответ на callback отправлен`);
      } else {
        // Это обычное сообщение
        console.log(`🛒 Отправляем пустую корзину через обычное сообщение`);
        bot.sendMessage(chatId, message);
      }
      return;
    }

    console.log(`🛒 Формируем сообщение с корзиной, товаров: ${cart.length}`);
    let message = 'Ваша корзина 🛒\n\n';
    const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];

    cart.forEach((cartItem, index) => {
      const item = cartItem.menuItem;
      const subtotal = item.price * cartItem.quantity;

      message += `${index + 1}. ${item.name}\n`;
      message += `${item.price}₽ × ${cartItem.quantity} = ${subtotal}₽\n\n`;

      // Кнопки для изменения количества
      keyboard.push([
        { text: '−', callback_data: `decrease_${item.id}` },
        { text: `${cartItem.quantity} шт.`, callback_data: `quantity_${item.id}` },
        { text: '+', callback_data: `increase_${item.id}` },
        { text: 'Удалить', callback_data: `remove_${item.id}` },
      ]);
    });

    message += `Общая сумма: ${total}₽`;

    // Кнопки управления корзиной
    keyboard.push([
      { text: 'Очистить корзину', callback_data: 'clear_cart' },
      { text: 'Оформить заказ', callback_data: 'checkout' },
    ]);
    keyboard.push([{ text: 'Назад к меню', callback_data: 'back_to_menu' }]);

    console.log(`🛒 Сообщение сформировано, отправляем пользователю`);

    if ('data' in msg) {
      // Это callback query
      console.log(`🛒 Отправляем заполненную корзину через callback`);
      if (msg.message?.message_id) {
        console.log(`🛒 Определяем тип сообщения для редактирования`);

        // Проверяем, есть ли фото в сообщении
        if (msg.message?.photo && msg.message.photo.length > 0) {
          console.log(`📸 Сообщение с фото - используем editMessageCaption`);
          bot
            .editMessageCaption(message, {
              chat_id: chatId,
              message_id: msg.message.message_id,
              reply_markup: { inline_keyboard: keyboard },
            })
            .then(() => {
              console.log(`✅ editMessageCaption успешно выполнен - корзина показана`);
            })
            .catch(error => {
              console.error(`❌ ОШИБКА editMessageCaption:`, error);
              console.error(`❌ Детали ошибки:`, {
                chatId,
                messageId: msg.message?.message_id,
                messageLength: message.length,
                keyboardLength: keyboard.length,
                hasPhoto: !!msg.message?.photo,
              });
            });
        } else {
          console.log(`📝 Текстовое сообщение - используем editMessageText`);
          bot
            .editMessageText(message, {
              chat_id: chatId,
              message_id: msg.message.message_id,
              reply_markup: { inline_keyboard: keyboard },
            })
            .then(() => {
              console.log(`✅ editMessageText успешно выполнен - корзина показана`);
            })
            .catch(error => {
              console.error(`❌ ОШИБКА editMessageText:`, error);
              console.error(`❌ Детали ошибки:`, {
                chatId,
                messageId: msg.message?.message_id,
                messageLength: message.length,
                keyboardLength: keyboard.length,
                hasPhoto: !!msg.message?.photo,
              });
            });
        }
      }
      console.log(`🛒 Отвечаем на callback query`);
      bot.answerCallbackQuery(msg.id).catch(() => {});
      console.log(`🛒 Ответ на callback отправлен`);
    } else {
      // Это обычное сообщение
      console.log(`🛒 Отправляем заполненную корзину через обычное сообщение`);
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

// Обработчик оформления заказа
export async function handleCheckout(bot: BotInstance, query: BotCallbackQuery): Promise<void> {
  const chatId = query.message?.chat.id;
  const userId = query.from?.id;
  const userName = query.from?.first_name;

  console.log(`🛒 CHECKOUT: Начало оформления заказа для пользователя ${userId}`);

  if (!chatId || !userId) {
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  try {
    const cart = await botApiClient.getCart(userId);
    const cartTotal = await botApiClient.getCartTotal(userId);
    const total = cartTotal.total;

    console.log(
      `🛒 CHECKOUT: Корзина пользователя ${userId} содержит ${cart.length} товаров на сумму ${total}₽`
    );

    if (cart.length === 0) {
      bot.answerCallbackQuery(query.id, { text: 'Корзина пуста' }).catch(() => {});
      return;
    }

    // Сохраняем пользователя в БД
    await databaseService.upsertUser(userId, query.from?.username, userName);

    // Создаем заказ в БД
    const orderId = await databaseService.createOrder(userId, cart, total);
    console.log(`🛒 CHECKOUT: Заказ #${orderId} создан в базе данных`);

    // Получаем созданный заказ для уведомления
    const order = await databaseService.getOrderById(orderId);

    // Отправляем уведомление персоналу
    if (order) {
      try {
        const notificationService = serviceRegistry.get('notifications');
        await notificationService.notifyNewOrder(order);
        console.log(`📢 CHECKOUT: Уведомление персонала о заказе #${orderId} отправлено`);
      } catch (error) {
        console.error('Ошибка отправки уведомления:', error);
      }
    }

    // Очищаем корзину после успешного заказа
    await botApiClient.clearCart(userId);
    console.log(`🛒 CHECKOUT: Корзина пользователя ${userId} очищена`);

    const successMessage = `
✅ **Заказ успешно оформлен!**

📦 Номер заказа: #${orderId}
💰 Сумма заказа: ${total}₽

⏳ Ваш заказ принят в обработку
📋 Текущий статус: В ожидании

🙏 Спасибо за заказ! Вы будете уведомлены об изменении статуса.
    `;

    const keyboard = {
      inline_keyboard: [
        [{ text: '📋 Мои заказы', callback_data: 'my_orders' }],
        [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }],
      ],
    };

    console.log(`📝 CHECKOUT: Отправляем сообщение об успешном заказе пользователю ${userId}`);

    // Попытка редактирования сообщения
    try {
      if (query.message?.message_id) {
        await bot.editMessageText(successMessage, {
          chat_id: chatId,
          message_id: query.message.message_id,
          reply_markup: keyboard,
        });
        console.log(`✅ CHECKOUT: Сообщение об успешном заказе отредактировано`);
      } else {
        // Fallback: отправляем новое сообщение
        await bot.sendMessage(chatId, successMessage, {
          reply_markup: keyboard,
        });
        console.log(`✅ CHECKOUT: Новое сообщение об успешном заказе отправлено`);
      }
    } catch (editError) {
      console.error(`❌ CHECKOUT: Ошибка редактирования сообщения:`, editError);
      // Fallback: отправляем новое сообщение
      try {
        await bot.sendMessage(chatId, successMessage, {
          reply_markup: keyboard,
        });
        console.log(`✅ CHECKOUT: Fallback сообщение об успешном заказе отправлено`);
      } catch (sendError) {
        console.error(`❌ CHECKOUT: Критическая ошибка отправки сообщения:`, sendError);
      }
    }

    // Отвечаем на callback query с подробной информацией
    bot
      .answerCallbackQuery(query.id, {
        text: `🎉 Заказ #${orderId} оформлен! Переходим к заказам...`,
      })
      .catch(() => {});

    console.log(`✅ CHECKOUT: Оформление заказа #${orderId} завершено успешно`);

    // Сразу переходим к "Мои заказы"
    try {
      console.log(`🔄 CHECKOUT: Переход к списку заказов для пользователя ${userId}`);
      // Создаем новый query для перехода к заказам с тем же message_id
      const ordersQuery = {
        ...query,
        data: 'my_orders',
      } as BotCallbackQuery;
      await handleMyOrders(bot, ordersQuery);
    } catch (autoRedirectError) {
      console.error(`❌ CHECKOUT: Ошибка перехода к заказам:`, autoRedirectError);
    }
  } catch (error) {
    console.error('❌ CHECKOUT: Критическая ошибка при оформлении заказа:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при оформлении заказа' }).catch(() => {});

    // Отправляем сообщение об ошибке
    try {
      await bot.sendMessage(chatId, '❌ Произошла ошибка при оформлении заказа. Попробуйте снова.');
    } catch (errorMessageError) {
      console.error('Не удалось отправить сообщение об ошибке:', errorMessageError);
    }
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
        'У вас пока нет заказов 📋\n\nВыберите товары из меню и оформите первый заказ!';

      if ('data' in msg) {
        // Это callback query
        if (msg.message?.message_id) {
          bot
            .editMessageText(message, {
              chat_id: chatId,
              message_id: msg.message.message_id,
              reply_markup: {
                inline_keyboard: [[{ text: 'Назад к профилю', callback_data: 'back_to_profile' }]],
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

    let message = 'Ваши заказы 📋\n\n';

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
      message += `${statusEmoji} Статус: ${getStatusText(order.status)}\n`;
      message += `Сумма: ${order.totalPrice}₽\n`;
      message += `Дата: ${formatDate(order.createdAt)}\n\n`;
    });

    const keyboard: Array<Array<{ text: string; callback_data: string }>> = [
      [{ text: 'Назад к профилю', callback_data: 'back_to_profile' }],
    ];

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
  const notificationService = serviceRegistry.get('notifications');
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
Что такое Telegram Mini App? 📱

Mini App — это веб-приложение, встроенное прямо в Telegram.

Преимущества:
• Не нужно устанавливать отдельное приложение
• Быстрый доступ прямо из чата
• Адаптируется под тему Telegram
• Безопасная передача данных
• Работает на всех устройствах

В нашем Mini App вы можете:
• Просматривать полное меню с фотографиями
• Добавлять товары в корзину
• Оформлять заказы онлайн
• Отслеживать статус заказов
• Получать персональные рекомендации

Попробуйте прямо сейчас!
  `;

  try {
    await bot.answerCallbackQuery(query.id, { text: 'Информация о Mini App' });

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
                text: 'Назад к началу',
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
Попробуйте наше мини-приложение! 🚀

В нём доступны дополнительные возможности:
• Полное меню с фотографиями товаров
• Удобное управление корзиной
• Отслеживание заказов в реальном времени
• Персональные рекомендации

Нажмите кнопку ниже, чтобы открыть приложение.
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
    await bot.answerCallbackQuery(query.id, { text: 'Возврат к началу' });

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
Привет, ${userName}! 👋

Добро пожаловать в наше мини-приложение!

В нём доступны расширенные возможности:
• Полное меню с фотографиями товаров
• Удобное добавление товаров в корзину
• Оформление заказов онлайн
• Отслеживание статуса заказов в реальном времени
• Персональные рекомендации на основе ваших предпочтений
• Интерфейс, адаптированный под вашу тему Telegram

Нажмите кнопку ниже, чтобы открыть приложение.
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
          text: 'Назад в меню',
          callback_data: 'back_to_menu',
        },
      ],
    ],
  };

  bot.sendMessage(chatId, miniAppMessage, {
    reply_markup: miniAppKeyboard,
  });
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

// Обработчик увеличения количества товара с экрана товара (УЛУЧШЕННЫЙ)
export async function handleIncreaseFromItem(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void> {
  console.log(
    `🚀 ВХОД В handleIncreaseFromItem! query.data: ${query.data}, userId: ${query.from?.id}`
  );

  const userId = query.from?.id;
  const itemId = query.data?.replace('increase_from_item_', '');

  console.log(`🔄 Увеличение товара ${itemId} для пользователя ${userId}`);

  if (!userId || !itemId) {
    console.error('Missing userId or itemId in handleIncreaseFromItem');
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  const item = getItemById(itemId);
  if (!item) {
    console.error(`Item ${itemId} not found in handleIncreaseFromItem`);
    bot.answerCallbackQuery(query.id, { text: 'Товар не найден' }).catch(() => {});
    return;
  }

  try {
    // Выполняем атомарную операцию с корзиной
    const result = await updateCartItemAtomically(userId, itemId, 'increase');

    if (result.success && result.cartTotal) {
      console.log(`✅ Товар ${itemId} успешно увеличен для пользователя ${userId}`);

      // Успех: показываем пользователю результат
      bot
        .answerCallbackQuery(query.id, {
          text: `${item.name} добавлен! В корзине: ${result.cartTotal.itemsCount} товаров на ${result.cartTotal.total}₽`,
        })
        .catch(() => {});

      // Обновляем отображение товара
      await refreshItemDisplay(bot, query, itemId);
    } else {
      console.error(`❌ Ошибка увеличения товара ${itemId}:`, result.error);

      // Ошибка: показываем пользователю
      bot
        .answerCallbackQuery(query.id, {
          text: result.error || 'Ошибка при добавлении товара',
        })
        .catch(() => {});
    }
  } catch (error) {
    console.error('Error in handleIncreaseFromItem:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при изменении количества' }).catch(() => {});
  }
}

// Обработчик уменьшения количества товара с экрана товара (УЛУЧШЕННЫЙ)
export async function handleDecreaseFromItem(
  bot: BotInstance,
  query: BotCallbackQuery
): Promise<void> {
  const userId = query.from?.id;
  const itemId = query.data?.replace('decrease_from_item_', '');

  console.log(`🔄 Уменьшение товара ${itemId} для пользователя ${userId}`);

  if (!userId || !itemId) {
    console.error('Missing userId or itemId in handleDecreaseFromItem');
    bot.answerCallbackQuery(query.id, { text: 'Ошибка обработки запроса' }).catch(() => {});
    return;
  }

  const item = getItemById(itemId);
  if (!item) {
    console.error(`Item ${itemId} not found in handleDecreaseFromItem`);
    bot.answerCallbackQuery(query.id, { text: 'Товар не найден' }).catch(() => {});
    return;
  }

  try {
    // Выполняем атомарную операцию с корзиной
    const result = await updateCartItemAtomically(userId, itemId, 'decrease');

    if (result.success) {
      console.log(`✅ Товар ${itemId} успешно уменьшен для пользователя ${userId}`);

      // Успех: показываем пользователю результат
      if (result.newQuantity === 0) {
        bot.answerCallbackQuery(query.id, { text: 'Товар удален из корзины' }).catch(() => {});
      } else if (result.cartTotal) {
        bot
          .answerCallbackQuery(query.id, {
            text: `${item.name} убран! В корзине: ${result.cartTotal.itemsCount} товаров на ${result.cartTotal.total}₽`,
          })
          .catch(() => {});
      }

      // Обновляем отображение товара
      await refreshItemDisplay(bot, query, itemId);
    } else {
      console.error(`❌ Ошибка уменьшения товара ${itemId}:`, result.error);

      // Ошибка: показываем пользователю
      bot
        .answerCallbackQuery(query.id, {
          text: result.error || 'Ошибка при изменении количества',
        })
        .catch(() => {});
    }
  } catch (error) {
    console.error('Error in handleDecreaseFromItem:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при изменении количества' }).catch(() => {});
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
        text: `${item.name} добавлен! В корзине: ${cartTotal.itemsCount} товаров на ${cartTotal.total}₽`,
      })
      .catch(() => {});

    // Обновляем каталог с новыми кнопками
    const chatId = query.message?.chat?.id;
    if (chatId) {
      const category = item.category;
      if (category === 'shawarma') {
        await handleShawarmaMenu(bot, {
          chat: { id: chatId },
          from: query.from,
        } as BotMessage);
      } else if (category === 'drinks') {
        await handleDrinksMenu(bot, {
          chat: { id: chatId },
          from: query.from,
        } as BotMessage);
      }
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
          text: `${item?.name} добавлен! В корзине: ${cartTotal.itemsCount} товаров на ${cartTotal.total}₽`,
        })
        .catch(() => {});

      // Обновляем каталог
      const chatId = query.message?.chat?.id;
      if (chatId) {
        const category = item?.category;
        if (category === 'shawarma') {
          await handleShawarmaMenu(bot, {
            chat: { id: chatId },
            from: query.from,
          } as BotMessage);
        } else if (category === 'drinks') {
          await handleDrinksMenu(bot, {
            chat: { id: chatId },
            from: query.from,
          } as BotMessage);
        }
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
          .answerCallbackQuery(query.id, { text: `${item?.name} удален из корзины` })
          .catch(() => {});
      } else {
        await botApiClient.updateCartQuantity(userId, itemId, newQuantity);

        const cartTotal = await botApiClient.getCartTotal(userId);
        const item = getItemById(itemId);

        bot
          .answerCallbackQuery(query.id, {
            text: `${item?.name} убран! В корзине: ${cartTotal.itemsCount} товаров на ${cartTotal.total}₽`,
          })
          .catch(() => {});
      }

      // Обновляем каталог
      const chatId = query.message?.chat?.id;
      if (chatId) {
        const item = getItemById(itemId);
        const category = item?.category;
        if (category === 'shawarma') {
          await handleShawarmaMenu(bot, {
            chat: { id: chatId },
            from: query.from,
          } as BotMessage);
        } else if (category === 'drinks') {
          await handleDrinksMenu(bot, {
            chat: { id: chatId },
            from: query.from,
          } as BotMessage);
        }
      }
    }
  } catch (error) {
    console.error('Error quick decreasing quantity:', error);
    bot.answerCallbackQuery(query.id, { text: 'Ошибка при изменении количества' }).catch(() => {});
  }
}
