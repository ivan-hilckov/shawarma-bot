import dotenv from 'dotenv';
import { Config } from './types';

dotenv.config();

const config: Config = {
  BOT_TOKEN: process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE',
  NODE_ENV: process.env.NODE_ENV || 'development',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://shawarma_user:shawarma_pass@localhost:5432/shawarma_db',

  // API Configuration
  API_PORT: parseInt(process.env.API_PORT || '3000'),
  API_HOST: process.env.API_HOST || '0.0.0.0',
  API_PREFIX: process.env.API_PREFIX || '/api',

  // Security
  API_KEYS: process.env.API_KEYS?.split(',') || ['admin-key-dev'],
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],

  // Rate Limiting
  RATE_LIMIT_PUBLIC: parseInt(process.env.RATE_LIMIT_PUBLIC || '100'),
  RATE_LIMIT_ADMIN: parseInt(process.env.RATE_LIMIT_ADMIN || '1000'),

  // Cache
  REDIS_CACHE_TTL: parseInt(process.env.REDIS_CACHE_TTL || '300'),
  ENABLE_CACHE: process.env.ENABLE_CACHE !== 'false',
};

// Добавляем опциональные поля только если они заданы
if (process.env.NOTIFICATIONS_CHAT_ID) {
  config.NOTIFICATIONS_CHAT_ID = process.env.NOTIFICATIONS_CHAT_ID;
}

if (process.env.ADMIN_USER_IDS) {
  config.ADMIN_USER_IDS = process.env.ADMIN_USER_IDS;
}

export default config;
