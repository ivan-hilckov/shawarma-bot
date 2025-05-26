const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

// Проверяем загрузку переменных
console.log("🔍 Проверка переменных окружения:");
console.log("BOT_TOKEN:", process.env.BOT_TOKEN ? "✅ Загружен" : "❌ НЕ НАЙДЕН");
console.log("NOTIFICATIONS_CHAT_ID:", process.env.NOTIFICATIONS_CHAT_ID || "❌ НЕ НАЙДЕН");
console.log("ADMIN_USER_IDS:", process.env.ADMIN_USER_IDS || "❌ НЕ НАЙДЕН");

if (!process.env.BOT_TOKEN || process.env.BOT_TOKEN === "YOUR_BOT_TOKEN_HERE") {
  console.log("❌ Пожалуйста, обновите BOT_TOKEN в .env файле");
  process.exit(1);
}

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

async function testNotifications() {
  try {
    console.log("\n🤖 Тестирование бота...");

    // Получаем информацию о боте
    const botInfo = await bot.getMe();
    console.log(`✅ Бот подключен: @${botInfo.username}`);

    // Проверяем канал уведомлений
    if (
      process.env.NOTIFICATIONS_CHAT_ID &&
      process.env.NOTIFICATIONS_CHAT_ID !== "-1001234567890"
    ) {
      console.log("\n📢 Тестирование отправки уведомления...");

      const testMessage = `
🧪 <b>ТЕСТОВОЕ УВЕДОМЛЕНИЕ</b>

📦 Заказ: #TEST123
👤 Клиент: Тестовый пользователь
📅 Время: ${new Date().toLocaleString("ru-RU")}
📊 Статус: ⏳ В ожидании

🛒 <b>Состав заказа:</b>
1. <b>Шаурма классик большая</b>
   💰 270₽ × 1 = <b>270₽</b>

💰 <b>Общая сумма: 270₽</b>

<i>Это тестовое сообщение для проверки системы уведомлений</i>
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: "✅ Принять", callback_data: "admin_confirm_TEST123" },
            { text: "❌ Отклонить", callback_data: "admin_reject_TEST123" },
          ],
          [
            { text: "👨‍🍳 Готовится", callback_data: "admin_preparing_TEST123" },
            { text: "🎉 Готово", callback_data: "admin_ready_TEST123" },
          ],
          [{ text: "📋 Детали", callback_data: "admin_details_TEST123" }],
        ],
      };

      await bot.sendMessage(process.env.NOTIFICATIONS_CHAT_ID, testMessage, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });

      console.log("✅ Тестовое уведомление отправлено в канал!");
    } else {
      console.log("⚠️ NOTIFICATIONS_CHAT_ID не настроен или использует значение по умолчанию");
    }

    // Проверяем администраторов
    if (process.env.ADMIN_USER_IDS && process.env.ADMIN_USER_IDS !== "123456789,987654321") {
      const adminIds = process.env.ADMIN_USER_IDS.split(",").map((id) => parseInt(id.trim()));
      console.log(
        `\n👨‍💼 Тестирование отправки уведомлений администраторам (${adminIds.length} чел.)...`
      );

      for (const adminId of adminIds) {
        try {
          await bot.sendMessage(
            adminId,
            "🧪 Тестовое сообщение для администратора\n\nСистема уведомлений работает корректно!"
          );
          console.log(`✅ Уведомление отправлено админу ${adminId}`);
        } catch (error) {
          console.log(`❌ Ошибка отправки админу ${adminId}:`, error.message);
        }
      }
    } else {
      console.log("⚠️ ADMIN_USER_IDS не настроен или использует значения по умолчанию");
    }

    console.log("\n🎉 Тестирование завершено!");
  } catch (error) {
    console.log("❌ Ошибка:", error.message);
  }
}

testNotifications();
