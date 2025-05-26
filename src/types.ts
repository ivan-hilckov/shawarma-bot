import TelegramBot from "node-telegram-bot-api";

export interface Config {
  BOT_TOKEN: string;
  NODE_ENV: string;
  REDIS_URL: string;
  DATABASE_URL: string;
  NOTIFICATIONS_CHAT_ID?: string; // ID канала/группы для уведомлений персонала
  ADMIN_USER_IDS?: string; // Список ID администраторов через запятую
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "shawarma" | "drinks";
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface UserCart {
  [userId: number]: CartItem[];
}

export interface Order {
  id: string;
  userId: number;
  userName: string;
  items: CartItem[];
  totalPrice: number;
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered";
  createdAt: Date;
}

export type BotMessage = TelegramBot.Message;
export type BotCallbackQuery = TelegramBot.CallbackQuery;
export type BotInstance = TelegramBot;
