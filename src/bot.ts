import TelegramBot from 'node-telegram-bot-api';

import config from './config';
import {
  handleStart,
  handleShawarmaMenu,
  handleDrinksMenu,
  handleAbout,
  handleProfile,
  handleItemSelection,
  handleBackToMenu,
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
  handleAboutMiniApp,
  handleBackToStart,
  handleIncreaseFromItem,
  handleDecreaseFromItem,
  handleRemoveAllFromItem,
  handleFavorites,
  handleRecommendations,
  handleAddToFavorites,
  handleRemoveFromFavorites,
} from './handlers';
import NotificationService from './notifications';
import { BotInstance, BotMessage, BotCallbackQuery } from './types';

// Проверяем наличие токена
if (!config.BOT_TOKEN || config.BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.error('❌ Ошибка: BOT_TOKEN не установлен!');
  console.log('📝 Создайте файл .env и добавьте:');
  console.log('BOT_TOKEN=ваш_токен_от_BotFather');
  process.exit(1);
}

// Создаем экземпляр бота
const bot: BotInstance = new TelegramBot(config.BOT_TOKEN, { polling: true });

// Создаем сервис уведомлений
const notificationService = new NotificationService(bot);

// Делаем сервис доступным глобально для handlers
(global as any).notificationService = notificationService;

console.log('🤖 Шаурма Бот запускается...');

// Обработчик команды /start
bot.onText(/\/start/, (msg: BotMessage) => {
  console.log(`👤 Пользователь ${msg.from?.first_name} (${msg.from?.id}) запустил бота`);
  handleStart(bot, msg);
});

// Обработчик текстовых сообщений
bot.on('message', (msg: BotMessage) => {
  // Игнорируем команды (они обрабатываются отдельно)
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }

  const chatId = msg.chat.id;
  const text = msg.text;

  console.log(`💬 Сообщение от ${msg.from?.first_name}: ${text}`);

  switch (text) {
    case '🌯 Шаурма':
      handleShawarmaMenu(bot, msg);
      break;

    case '🥤 Напитки':
      handleDrinksMenu(bot, msg);
      break;

    case 'ℹ️ О нас':
      handleAbout(bot, msg);
      break;

    case '👤 Профиль':
      handleProfile(bot, msg);
      break;

    default:
      // Проверяем кнопку корзины (может быть с индикатором)
      if (text && text.startsWith('🛒 Корзина')) {
        handleViewCart(bot, msg);
        break;
      }

      // Если сообщение не распознано, показываем помощь
      bot.sendMessage(
        chatId,
        'Используйте кнопки меню или команду /start для начала работы с ботом! 😊'
      );
  }
});

// Обработчик inline кнопок
bot.on('callback_query', (query: BotCallbackQuery) => {
  const data = query.data;

  console.log(`🔘 Callback от ${query.from?.first_name}: ${data}`);

  try {
    if (data?.startsWith('item_')) {
      handleItemSelection(bot, query);
    } else if (data?.startsWith('add_to_cart_')) {
      handleAddToCart(bot, query);
    } else if (data === 'view_cart') {
      handleViewCart(bot, query);
    } else if (data?.startsWith('increase_')) {
      handleIncreaseQuantity(bot, query);
    } else if (data?.startsWith('decrease_')) {
      handleDecreaseQuantity(bot, query);
    } else if (data?.startsWith('remove_')) {
      handleRemoveFromCart(bot, query);
    } else if (data === 'clear_cart') {
      handleClearCart(bot, query);
    } else if (data === 'checkout') {
      handleCheckout(bot, query);
    } else if (data === 'profile') {
      handleProfile(bot, query);
    } else if (data === 'my_orders') {
      handleMyOrders(bot, query);
    } else if (data?.startsWith('order_details_')) {
      handleOrderDetails(bot, query);
    } else if (data?.startsWith('admin_')) {
      handleAdminOrderAction(bot, query);
    } else if (data === 'back_to_menu') {
      handleBackToMenu(bot, query);
    } else if (data === 'about_miniapp') {
      handleAboutMiniApp(bot, query);
    } else if (data === 'back_to_start') {
      handleBackToStart(bot, query);
    } else if (data?.startsWith('increase_from_item_')) {
      handleIncreaseFromItem(bot, query);
    } else if (data?.startsWith('decrease_from_item_')) {
      handleDecreaseFromItem(bot, query);
    } else if (data?.startsWith('remove_all_from_item_')) {
      handleRemoveAllFromItem(bot, query);
    } else if (data === 'favorites') {
      handleFavorites(bot, query);
    } else if (data === 'recommendations') {
      handleRecommendations(bot, query);
    } else if (data === 'add_to_favorites') {
      handleAddToFavorites(bot, query);
    } else if (data === 'remove_from_favorites') {
      handleRemoveFromFavorites(bot, query);
    } else if (data?.startsWith('add_favorite_')) {
      handleAddToFavorites(bot, query);
    } else if (data?.startsWith('remove_favorite_')) {
      handleRemoveFromFavorites(bot, query);
    } else {
      bot.answerCallbackQuery(query.id, { text: 'Неизвестная команда' }).catch(() => {});
    }
  } catch (error) {
    console.error('❌ Ошибка при обработке callback:', error);
    bot.answerCallbackQuery(query.id, { text: 'Произошла ошибка' }).catch(() => {});
  }
});

// Обработчик ошибок polling
bot.on('polling_error', (error: Error) => {
  console.error('❌ Ошибка polling:', error.message);
});

// Обработчик успешного запуска
bot
  .getMe()
  .then(botInfo => {
    console.log('✅ Бот успешно запущен!');
    console.log(`🤖 Имя бота: @${botInfo.username}`);
    console.log(`🆔 ID бота: ${botInfo.id}`);
    console.log(`📢 ${notificationService.getStatus()}`);
    console.log('📱 Бот готов к работе!');
  })
  .catch((error: Error) => {
    console.error('❌ Ошибка при получении информации о боте:', error.message);
    console.log('🔍 Проверьте правильность BOT_TOKEN');
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал SIGINT. Завершение работы...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал SIGTERM. Завершение работы...');
  bot.stopPolling();
  process.exit(0);
});
