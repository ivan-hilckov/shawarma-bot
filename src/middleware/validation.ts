import { createLogger } from '../logger';
import { BotMessage, BotCallbackQuery } from '../types';

const logger = createLogger('Validation');

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class ValidationMiddleware {
  static validateMessage(msg: BotMessage): ValidationResult {
    if (!msg.chat?.id) {
      logger.warn('Message validation failed: missing chat.id');
      return { isValid: false, error: 'Missing chat ID' };
    }

    if (!msg.from?.id) {
      logger.warn('Message validation failed: missing from.id');
      return { isValid: false, error: 'Missing user ID' };
    }

    return { isValid: true };
  }

  static validateCallbackQuery(query: BotCallbackQuery): ValidationResult {
    if (!query.from?.id) {
      logger.warn('Callback query validation failed: missing from.id');
      return { isValid: false, error: 'Missing user ID' };
    }

    if (!query.message?.chat?.id) {
      logger.warn('Callback query validation failed: missing message.chat.id');
      return { isValid: false, error: 'Missing chat ID' };
    }

    return { isValid: true };
  }

  static validateItemId(itemId: string | undefined): ValidationResult {
    if (!itemId || itemId.trim() === '') {
      logger.warn('Item ID validation failed: empty or undefined');
      return { isValid: false, error: 'Invalid item ID' };
    }

    // Проверяем что ID содержит только допустимые символы
    if (!/^[a-zA-Z0-9_-]+$/.test(itemId)) {
      logger.warn('Item ID validation failed: invalid characters', { itemId });
      return { isValid: false, error: 'Invalid item ID format' };
    }

    return { isValid: true };
  }

  static validateUserId(userId: number | undefined): ValidationResult {
    if (!userId || userId <= 0) {
      logger.warn('User ID validation failed: invalid value', { userId });
      return { isValid: false, error: 'Invalid user ID' };
    }

    return { isValid: true };
  }

  static validateOrderId(orderId: string | undefined): ValidationResult {
    if (!orderId || orderId.trim() === '') {
      logger.warn('Order ID validation failed: empty or undefined');
      return { isValid: false, error: 'Invalid order ID' };
    }

    // Проверяем что ID является числом
    if (!/^\d+$/.test(orderId)) {
      logger.warn('Order ID validation failed: not a number', { orderId });
      return { isValid: false, error: 'Invalid order ID format' };
    }

    return { isValid: true };
  }

  static validateQuantity(quantity: number): ValidationResult {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      logger.warn('Quantity validation failed: invalid value', { quantity });
      return { isValid: false, error: 'Quantity must be between 1 and 99' };
    }

    return { isValid: true };
  }
}
