import dotenv from "dotenv";
import { Config } from "./types";

dotenv.config();

const config: Config = {
  BOT_TOKEN: process.env.BOT_TOKEN || "YOUR_BOT_TOKEN_HERE",
  NODE_ENV: process.env.NODE_ENV || "development",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://shawarma_user:shawarma_pass@localhost:5432/shawarma_db",
};

// Добавляем опциональные поля только если они заданы
if (process.env.NOTIFICATIONS_CHAT_ID) {
  config.NOTIFICATIONS_CHAT_ID = process.env.NOTIFICATIONS_CHAT_ID;
}

if (process.env.ADMIN_USER_IDS) {
  config.ADMIN_USER_IDS = process.env.ADMIN_USER_IDS;
}

export default config;
