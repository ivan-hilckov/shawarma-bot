import { ValidationMiddleware } from '../src/middleware/validation';
import { BotMessage, BotCallbackQuery } from '../src/types';

describe('ValidationMiddleware', () => {
  describe('validateMessage', () => {
    it('should validate correct message', () => {
      const msg: BotMessage = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 123, type: 'private' },
        from: { id: 456, is_bot: false, first_name: 'Test' },
        text: 'test message',
      };

      const result = ValidationMiddleware.validateMessage(msg);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail validation when chat.id is missing', () => {
      const msg: any = {
        message_id: 1,
        date: Date.now(),
        chat: {},
        from: { id: 456, is_bot: false, first_name: 'Test' },
        text: 'test message',
      };

      const result = ValidationMiddleware.validateMessage(msg);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing chat ID');
    });

    it('should fail validation when from.id is missing', () => {
      const msg: any = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 123, type: 'private' },
        from: {},
        text: 'test message',
      };

      const result = ValidationMiddleware.validateMessage(msg);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing user ID');
    });

    it('should fail validation when from is missing', () => {
      const msg: any = {
        message_id: 1,
        date: Date.now(),
        chat: { id: 123, type: 'private' },
        text: 'test message',
      };

      const result = ValidationMiddleware.validateMessage(msg);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing user ID');
    });
  });

  describe('validateCallbackQuery', () => {
    it('should validate correct callback query', () => {
      const query: BotCallbackQuery = {
        id: 'test_id',
        from: { id: 456, is_bot: false, first_name: 'Test' },
        chat_instance: 'test_instance',
        message: {
          message_id: 1,
          date: Date.now(),
          chat: { id: 123, type: 'private' },
        },
        data: 'test_data',
      };

      const result = ValidationMiddleware.validateCallbackQuery(query);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail validation when from.id is missing', () => {
      const query: any = {
        id: 'test_id',
        from: {},
        message: {
          message_id: 1,
          date: Date.now(),
          chat: { id: 123, type: 'private' },
        },
        data: 'test_data',
      };

      const result = ValidationMiddleware.validateCallbackQuery(query);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing user ID');
    });

    it('should fail validation when message.chat.id is missing', () => {
      const query: any = {
        id: 'test_id',
        from: { id: 456, is_bot: false, first_name: 'Test' },
        message: {
          message_id: 1,
          date: Date.now(),
          chat: {},
        },
        data: 'test_data',
      };

      const result = ValidationMiddleware.validateCallbackQuery(query);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing chat ID');
    });

    it('should fail validation when message is missing', () => {
      const query: any = {
        id: 'test_id',
        from: { id: 456, is_bot: false, first_name: 'Test' },
        data: 'test_data',
      };

      const result = ValidationMiddleware.validateCallbackQuery(query);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing chat ID');
    });
  });

  describe('validateItemId', () => {
    it('should validate correct item ID', () => {
      const result = ValidationMiddleware.validateItemId('item_123');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate item ID with underscores and hyphens', () => {
      const result = ValidationMiddleware.validateItemId('item_123-abc');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail validation for empty item ID', () => {
      const result = ValidationMiddleware.validateItemId('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid item ID');
    });

    it('should fail validation for undefined item ID', () => {
      const result = ValidationMiddleware.validateItemId(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid item ID');
    });

    it('should fail validation for item ID with special characters', () => {
      const result = ValidationMiddleware.validateItemId('item@123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid item ID format');
    });

    it('should fail validation for item ID with spaces', () => {
      const result = ValidationMiddleware.validateItemId('item 123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid item ID format');
    });
  });

  describe('validateUserId', () => {
    it('should validate correct user ID', () => {
      const result = ValidationMiddleware.validateUserId(123456);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail validation for zero user ID', () => {
      const result = ValidationMiddleware.validateUserId(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid user ID');
    });

    it('should fail validation for negative user ID', () => {
      const result = ValidationMiddleware.validateUserId(-123);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid user ID');
    });

    it('should fail validation for undefined user ID', () => {
      const result = ValidationMiddleware.validateUserId(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid user ID');
    });
  });

  describe('validateOrderId', () => {
    it('should validate correct order ID', () => {
      const result = ValidationMiddleware.validateOrderId('12345');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail validation for empty order ID', () => {
      const result = ValidationMiddleware.validateOrderId('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid order ID');
    });

    it('should fail validation for undefined order ID', () => {
      const result = ValidationMiddleware.validateOrderId(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid order ID');
    });

    it('should fail validation for non-numeric order ID', () => {
      const result = ValidationMiddleware.validateOrderId('abc123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid order ID format');
    });

    it('should fail validation for order ID with special characters', () => {
      const result = ValidationMiddleware.validateOrderId('123-456');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid order ID format');
    });
  });

  describe('validateQuantity', () => {
    it('should validate correct quantity', () => {
      const result = ValidationMiddleware.validateQuantity(5);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate minimum quantity', () => {
      const result = ValidationMiddleware.validateQuantity(1);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate maximum quantity', () => {
      const result = ValidationMiddleware.validateQuantity(99);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail validation for zero quantity', () => {
      const result = ValidationMiddleware.validateQuantity(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Quantity must be between 1 and 99');
    });

    it('should fail validation for negative quantity', () => {
      const result = ValidationMiddleware.validateQuantity(-1);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Quantity must be between 1 and 99');
    });

    it('should fail validation for quantity over 99', () => {
      const result = ValidationMiddleware.validateQuantity(100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Quantity must be between 1 and 99');
    });

    it('should fail validation for non-integer quantity', () => {
      const result = ValidationMiddleware.validateQuantity(5.5);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Quantity must be between 1 and 99');
    });
  });
});
