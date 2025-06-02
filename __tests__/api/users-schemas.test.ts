import {
  UserUpsertSchema,
  UserParamsSchema,
  UserOrdersQuerySchema,
} from '../../src/api/schemas/users';

describe('Users Schemas Validation', () => {
  describe('UserUpsertSchema', () => {
    it('should validate complete user data', () => {
      const validUser = {
        id: 123,
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = UserUpsertSchema.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUser);
      }
    });

    it('should validate user without optional fields', () => {
      const validUser = {
        id: 456,
        firstName: 'Jane',
      };

      const result = UserUpsertSchema.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(456);
        expect(result.data.firstName).toBe('Jane');
        expect(result.data.username).toBeUndefined();
        expect(result.data.lastName).toBeUndefined();
      }
    });

    it('should reject negative user id', () => {
      const invalidUser = {
        id: -1,
        firstName: 'John',
      };

      const result = UserUpsertSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject zero user id', () => {
      const invalidUser = {
        id: 0,
        firstName: 'John',
      };

      const result = UserUpsertSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject empty firstName', () => {
      const invalidUser = {
        id: 123,
        firstName: '',
      };

      const result = UserUpsertSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject too long firstName', () => {
      const invalidUser = {
        id: 123,
        firstName: 'a'.repeat(101),
      };

      const result = UserUpsertSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject too long lastName', () => {
      const invalidUser = {
        id: 123,
        firstName: 'John',
        lastName: 'a'.repeat(101),
      };

      const result = UserUpsertSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should accept exactly 100 characters in firstName', () => {
      const validUser = {
        id: 123,
        firstName: 'a'.repeat(100),
      };

      const result = UserUpsertSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should accept exactly 100 characters in lastName', () => {
      const validUser = {
        id: 123,
        firstName: 'John',
        lastName: 'a'.repeat(100),
      };

      const result = UserUpsertSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });
  });

  describe('UserParamsSchema', () => {
    it('should transform string id to number', () => {
      const params = { id: '123' };

      const result = UserParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(123);
        expect(typeof result.data.id).toBe('number');
      }
    });

    it('should handle valid numeric string', () => {
      const params = { id: '999' };

      const result = UserParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(999);
      }
    });

    it('should parse non-numeric string to NaN', () => {
      const params = { id: 'abc' };

      const result = UserParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Number.isNaN(result.data.id)).toBe(true);
      }
    });

    it('should parse empty string to NaN', () => {
      const params = { id: '' };

      const result = UserParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Number.isNaN(result.data.id)).toBe(true);
      }
    });

    it('should handle zero as valid id', () => {
      const params = { id: '0' };

      const result = UserParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(0);
      }
    });

    it('should handle negative numbers', () => {
      const params = { id: '-5' };

      const result = UserParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(-5);
      }
    });
  });

  describe('UserOrdersQuerySchema', () => {
    it('should validate query with all parameters', () => {
      const query = {
        limit: 25,
        offset: 10,
        status: 'pending',
      };

      const result = UserOrdersQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(query);
      }
    });

    it('should apply default values', () => {
      const query = {};

      const result = UserOrdersQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
        expect(result.data.offset).toBe(0);
        expect(result.data.status).toBeUndefined();
      }
    });

    it('should validate query without status', () => {
      const query = {
        limit: 5,
        offset: 15,
      };

      const result = UserOrdersQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(5);
        expect(result.data.offset).toBe(15);
        expect(result.data.status).toBeUndefined();
      }
    });

    it('should reject limit less than 1', () => {
      const query = {
        limit: 0,
        offset: 0,
      };

      const result = UserOrdersQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });

    it('should reject limit greater than 50', () => {
      const query = {
        limit: 51,
        offset: 0,
      };

      const result = UserOrdersQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });

    it('should accept limit exactly 50', () => {
      const query = {
        limit: 50,
        offset: 0,
      };

      const result = UserOrdersQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it('should reject negative offset', () => {
      const query = {
        limit: 10,
        offset: -1,
      };

      const result = UserOrdersQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });

    it('should accept offset exactly 0', () => {
      const query = {
        limit: 10,
        offset: 0,
      };

      const result = UserOrdersQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it('should validate all valid status values', () => {
      const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];

      statuses.forEach(status => {
        const query = { status };
        const result = UserOrdersQuerySchema.safeParse(query);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(status);
        }
      });
    });

    it('should reject invalid status', () => {
      const query = {
        limit: 10,
        offset: 0,
        status: 'invalid_status',
      };

      const result = UserOrdersQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });
  });
});
