import TelegramBot from 'node-telegram-bot-api';

export interface Config {
  BOT_TOKEN: string;
  NODE_ENV: string;
  REDIS_URL: string;
  DATABASE_URL: string;
  ASSETS_BASE_URL: string; // Базовый URL для изображений (например, https://botgarden.store/assets)
  NOTIFICATIONS_CHAT_ID?: string; // ID канала/группы для уведомлений персонала
  ADMIN_USER_IDS?: string; // Список ID администраторов через запятую

  // API Configuration
  API_PORT: number;
  API_HOST: string;
  API_PREFIX: string;

  // Security
  API_KEYS: string[];
  CORS_ORIGINS: string[];

  // Rate Limiting
  RATE_LIMIT_PUBLIC: number;
  RATE_LIMIT_ADMIN: number;

  // Cache
  REDIS_CACHE_TTL: number;
  ENABLE_CACHE: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'shawarma' | 'drinks';
  photo?: string; // Путь к фотографии товара
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
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
  createdAt: Date;
}

// Новые типы для Этапа 3

export interface UserAnalytics {
  id: string;
  userId: number;
  menuItem: MenuItem;
  orderCount: number;
  lastOrdered: Date;
  totalSpent: number;
  frequencyLevel: 'frequent' | 'regular' | 'occasional';
}

export interface Recommendation {
  type: 'frequent' | 'popular' | 'new' | 'time_based';
  menuItem: MenuItem;
  reason: string;
  priority: number;
}

export interface CartSummary {
  itemsCount: number;
  total: number;
  isEmpty: boolean;
}

export type BotMessage = TelegramBot.Message;
export type BotCallbackQuery = TelegramBot.CallbackQuery;
export type BotInstance = TelegramBot;
