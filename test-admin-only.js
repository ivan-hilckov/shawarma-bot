const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

async function testAdmin() {
  try {
    console.log("🧪 Тестирование отправки сообщения администратору...");

    const adminId = 121270837; // Ваш ID
    const message =
      "🧪 Тест уведомлений для администратора\n\nЕсли вы видите это сообщение - система работает!";

    await bot.sendMessage(adminId, message);
    console.log("✅ Сообщение отправлено администратору!");
  } catch (error) {
    console.log("❌ Ошибка:", error.message);
  }
}

testAdmin();
