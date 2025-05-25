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

export default config;
