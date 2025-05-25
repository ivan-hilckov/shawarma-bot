import { getMenuByCategory, getItemById } from "./menu";
import { BotInstance, BotMessage, BotCallbackQuery } from "./types";

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
    keyboard: [[{ text: "🌯 Шаурма" }, { text: "🥤 Напитки" }], [{ text: "ℹ️ О нас" }]],
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
✅ Вы выбрали: ${item.name}

💰 Цена: ${item.price} руб.
📝 ${item.description}

В будущих версиях здесь будет возможность добавить товар в корзину!
  `;

  const keyboard = {
    inline_keyboard: [[{ text: "🔙 Назад к меню", callback_data: "back_to_menu" }]],
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
