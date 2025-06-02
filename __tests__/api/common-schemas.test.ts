import {
  SuccessResponseSchema,
  ErrorResponseSchema,
  PaginationSchema,
  PaginationMetaSchema,
  DateRangeSchema,
  HealthStatusSchema,
  ServiceStatusSchema,
} from '../../src/api/schemas/common';

describe('Common Schemas', () => {
  describe('SuccessResponseSchema', () => {
    it('should validate success response', () => {
      const validData = { success: true };
      expect(() => SuccessResponseSchema.parse(validData)).not.toThrow();
    });

    it('should validate success response with timestamp', () => {
      const validData = {
        success: true,
        timestamp: '2023-12-07T12:00:00.000Z',
      };
      expect(() => SuccessResponseSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid success value', () => {
      const invalidData = { success: false };
      expect(() => SuccessResponseSchema.parse(invalidData)).toThrow();
    });
  });

  describe('ErrorResponseSchema', () => {
    it('should validate error response', () => {
      const validData = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
        },
        timestamp: '2023-12-07T12:00:00.000Z',
      };
      expect(() => ErrorResponseSchema.parse(validData)).not.toThrow();
    });

    it('should validate error response with details', () => {
      const validData = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: { field: 'email', issue: 'required' },
        },
        timestamp: '2023-12-07T12:00:00.000Z',
      };
      expect(() => ErrorResponseSchema.parse(validData)).not.toThrow();
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        success: false,
        error: { code: 'ERROR' },
      };
      expect(() => ErrorResponseSchema.parse(invalidData)).toThrow();
    });
  });

  describe('PaginationSchema', () => {
    it('should validate pagination with defaults', () => {
      const result = PaginationSchema.parse({});
      expect(result).toEqual({ limit: 50, offset: 0 });
    });

    it('should validate custom pagination', () => {
      const validData = { limit: 25, offset: 100 };
      const result = PaginationSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid limits', () => {
      expect(() => PaginationSchema.parse({ limit: 0 })).toThrow();
      expect(() => PaginationSchema.parse({ limit: 101 })).toThrow();
      expect(() => PaginationSchema.parse({ offset: -1 })).toThrow();
    });
  });

  describe('PaginationMetaSchema', () => {
    it('should validate pagination meta', () => {
      const validData = {
        total: 100,
        limit: 50,
        offset: 0,
        has_more: true,
      };
      expect(() => PaginationMetaSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid meta', () => {
      const invalidData = {
        total: 'invalid',
        limit: 50,
        offset: 0,
        has_more: true,
      };
      expect(() => PaginationMetaSchema.parse(invalidData)).toThrow();
    });
  });

  describe('DateRangeSchema', () => {
    it('should validate date range', () => {
      const validData = {
        date_from: '2023-12-01T00:00:00.000Z',
        date_to: '2023-12-31T23:59:59.999Z',
      };
      expect(() => DateRangeSchema.parse(validData)).not.toThrow();
    });

    it('should validate partial date range', () => {
      const validData = {
        date_from: '2023-12-01T00:00:00.000Z',
      };
      expect(() => DateRangeSchema.parse(validData)).not.toThrow();
    });

    it('should validate empty date range', () => {
      expect(() => DateRangeSchema.parse({})).not.toThrow();
    });

    it('should reject invalid dates', () => {
      const invalidData = {
        date_from: 'invalid-date',
      };
      expect(() => DateRangeSchema.parse(invalidData)).toThrow();
    });
  });

  describe('HealthStatusSchema', () => {
    it('should validate health statuses', () => {
      expect(() => HealthStatusSchema.parse('healthy')).not.toThrow();
      expect(() => HealthStatusSchema.parse('degraded')).not.toThrow();
      expect(() => HealthStatusSchema.parse('unhealthy')).not.toThrow();
    });

    it('should reject invalid status', () => {
      expect(() => HealthStatusSchema.parse('unknown')).toThrow();
      expect(() => HealthStatusSchema.parse('excellent')).toThrow();
    });
  });

  describe('ServiceStatusSchema', () => {
    it('should validate service status', () => {
      const validData = {
        status: 'up',
        response_time: 50.5,
      };
      expect(() => ServiceStatusSchema.parse(validData)).not.toThrow();
    });

    it('should validate down service', () => {
      const validData = {
        status: 'down',
        response_time: 0,
      };
      expect(() => ServiceStatusSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid service status', () => {
      const invalidData = {
        status: 'unknown',
        response_time: 100,
      };
      expect(() => ServiceStatusSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing response_time', () => {
      const invalidData = {
        status: 'up',
      };
      expect(() => ServiceStatusSchema.parse(invalidData)).toThrow();
    });
  });
});
