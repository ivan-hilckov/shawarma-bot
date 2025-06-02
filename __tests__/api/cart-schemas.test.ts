import {
  CartAddSchema,
  CartUpdateSchema,
  CartParamsSchema,
  CartRemoveParamsSchema,
} from '../../src/api/schemas/cart';

describe('Cart Schemas', () => {
  describe('CartAddSchema', () => {
    it('should validate add to cart request', () => {
      const validData = {
        userId: 123,
        itemId: 'item-1',
        quantity: 2,
      };
      expect(() => CartAddSchema.parse(validData)).not.toThrow();
    });

    it('should use default quantity 1', () => {
      const data = {
        userId: 123,
        itemId: 'item-1',
      };
      const result = CartAddSchema.parse(data);
      expect(result.quantity).toBe(1);
    });

    it('should reject invalid userId', () => {
      const invalidData = {
        userId: -1,
        itemId: 'item-1',
        quantity: 1,
      };
      expect(() => CartAddSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid quantity', () => {
      const invalidData = {
        userId: 123,
        itemId: 'item-1',
        quantity: 0,
      };
      expect(() => CartAddSchema.parse(invalidData)).toThrow();
    });

    it('should reject quantity over 99', () => {
      const invalidData = {
        userId: 123,
        itemId: 'item-1',
        quantity: 100,
      };
      expect(() => CartAddSchema.parse(invalidData)).toThrow();
    });

    it('should reject empty itemId', () => {
      const invalidData = {
        userId: 123,
        itemId: '',
        quantity: 1,
      };
      expect(() => CartAddSchema.parse(invalidData)).toThrow();
    });
  });

  describe('CartUpdateSchema', () => {
    it('should validate update cart request', () => {
      const validData = {
        userId: 123,
        itemId: 'item-1',
        quantity: 5,
      };
      expect(() => CartUpdateSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid quantity', () => {
      const invalidData = {
        userId: 123,
        itemId: 'item-1',
        quantity: 0,
      };
      expect(() => CartUpdateSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        userId: 123,
        quantity: 5,
      };
      expect(() => CartUpdateSchema.parse(invalidData)).toThrow();
    });
  });

  describe('CartParamsSchema', () => {
    it('should validate and convert string userId to number', () => {
      const validData = {
        userId: '123',
      };
      const result = CartParamsSchema.parse(validData);
      expect(result.userId).toBe(123);
      expect(typeof result.userId).toBe('number');
    });

    it('should reject invalid userId string', () => {
      const invalidData = {
        userId: 'invalid',
      };
      expect(() => CartParamsSchema.parse(invalidData)).toThrow();
    });

    it('should reject negative userId', () => {
      const invalidData = {
        userId: '-1',
      };
      expect(() => CartParamsSchema.parse(invalidData)).toThrow();
    });
  });

  describe('CartRemoveParamsSchema', () => {
    it('should validate remove cart item params', () => {
      const validData = {
        userId: '123',
        itemId: 'item-1',
      };
      const result = CartRemoveParamsSchema.parse(validData);
      expect(result.userId).toBe(123);
      expect(result.itemId).toBe('item-1');
    });

    it('should reject empty itemId', () => {
      const invalidData = {
        userId: '123',
        itemId: '',
      };
      expect(() => CartRemoveParamsSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing userId', () => {
      const invalidData = {
        itemId: 'item-1',
      };
      expect(() => CartRemoveParamsSchema.parse(invalidData)).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle boundary values for quantity', () => {
      // Test minimum valid quantity
      const minData = {
        userId: 123,
        itemId: 'item-1',
        quantity: 1,
      };
      expect(() => CartAddSchema.parse(minData)).not.toThrow();

      // Test maximum valid quantity
      const maxData = {
        userId: 123,
        itemId: 'item-1',
        quantity: 99,
      };
      expect(() => CartAddSchema.parse(maxData)).not.toThrow();
    });

    it('should handle special characters in itemId', () => {
      const validData = {
        userId: 123,
        itemId: 'item-with-dashes_and_underscores123',
        quantity: 1,
      };
      expect(() => CartAddSchema.parse(validData)).not.toThrow();
    });

    it('should coerce valid numeric strings for userId in params', () => {
      const testCases = ['1', '123', '999999'];

      testCases.forEach(userIdStr => {
        const data = { userId: userIdStr };
        const result = CartParamsSchema.parse(data);
        expect(typeof result.userId).toBe('number');
        expect(result.userId).toBe(parseInt(userIdStr));
      });
    });
  });
});
