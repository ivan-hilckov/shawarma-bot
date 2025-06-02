import {
  OrderUserSchema,
  OrderItemSchema,
  OrderSchema,
  OrderDetailSchema,
  OrdersQuerySchema,
  OrderStatsSchema,
  OrdersResponseSchema,
  OrderDetailResponseSchema,
  OrderStatsResponseSchema,
} from '../../src/api/schemas/orders';

describe('Orders Schemas Validation', () => {
  describe('OrderUserSchema', () => {
    it('should validate valid user data', () => {
      const validUser = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
      };

      const result = OrderUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should validate user without optional fields', () => {
      const validUser = {
        id: 1,
        first_name: 'John',
      };

      const result = OrderUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid user data', () => {
      const invalidUser = {
        id: 'invalid',
        first_name: '',
      };

      const result = OrderUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('OrderItemSchema', () => {
    it('should validate valid order item', () => {
      const validItem = {
        id: 1,
        menu_item: {
          id: 1,
          name: 'Pizza',
          price: 15.99,
        },
        quantity: 2,
        price: 15.99,
        subtotal: 31.98,
      };

      const result = OrderItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('should reject invalid order item', () => {
      const invalidItem = {
        id: 1,
        menu_item: {
          id: 1,
          name: '',
          price: -5,
        },
        quantity: 0,
        price: -10,
        subtotal: 0,
      };

      const result = OrderItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });

  describe('OrderSchema', () => {
    it('should validate valid order', () => {
      const validOrder = {
        id: 1,
        user: {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          username: 'johndoe',
        },
        status: 'pending',
        total_price: 31.98,
        items_count: 2,
        created_at: '2023-12-01T10:00:00Z',
        updated_at: '2023-12-01T10:00:00Z',
      };

      const result = OrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const invalidOrder = {
        id: 1,
        user: {
          id: 1,
          first_name: 'John',
        },
        status: 'invalid_status',
        total_price: 31.98,
        items_count: 2,
        created_at: '2023-12-01T10:00:00Z',
        updated_at: '2023-12-01T10:00:00Z',
      };

      const result = OrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });
  });

  describe('OrderDetailSchema', () => {
    it('should validate detailed order with items', () => {
      const validDetailOrder = {
        id: 1,
        user: {
          id: 1,
          first_name: 'John',
        },
        status: 'confirmed',
        total_price: 31.98,
        items_count: 2,
        created_at: '2023-12-01T10:00:00Z',
        updated_at: '2023-12-01T10:00:00Z',
        items: [
          {
            id: 1,
            menu_item: {
              id: 1,
              name: 'Pizza',
              price: 15.99,
            },
            quantity: 2,
            price: 15.99,
            subtotal: 31.98,
          },
        ],
      };

      const result = OrderDetailSchema.safeParse(validDetailOrder);
      expect(result.success).toBe(true);
    });
  });

  describe('OrdersQuerySchema', () => {
    it('should validate query with all parameters', () => {
      const validQuery = {
        limit: 10,
        offset: 0,
        status: 'pending',
        user_id: 1,
        date_from: '2023-12-01T00:00:00Z',
        date_to: '2023-12-31T23:59:59Z',
      };

      const result = OrdersQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('should validate query with minimal parameters', () => {
      const validQuery = {
        limit: 20,
        offset: 10,
      };

      const result = OrdersQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status in query', () => {
      const invalidQuery = {
        limit: 10,
        offset: 0,
        status: 'invalid_status',
      };

      const result = OrdersQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  describe('OrderStatsSchema', () => {
    it('should validate order statistics', () => {
      const validStats = {
        total_orders: 100,
        pending_orders: 5,
        confirmed_orders: 10,
        preparing_orders: 15,
        ready_orders: 20,
        delivered_orders: 50,
        total_revenue: 5000.5,
        avg_order_value: 50.005,
        orders_today: 10,
        revenue_today: 500.25,
        popular_items: [
          {
            item_id: 1,
            name: 'Pizza',
            total_ordered: 50,
            revenue: 799.5,
          },
        ],
      };

      const result = OrderStatsSchema.safeParse(validStats);
      expect(result.success).toBe(true);
    });

    it('should accept negative values (no min constraint)', () => {
      const statsWithNegatives = {
        total_orders: -10,
        pending_orders: 5,
        confirmed_orders: 10,
        preparing_orders: 15,
        ready_orders: 20,
        delivered_orders: 50,
        total_revenue: 5000.5,
        avg_order_value: 50.005,
        orders_today: 10,
        revenue_today: 500.25,
        popular_items: [],
      };

      const result = OrderStatsSchema.safeParse(statsWithNegatives);
      expect(result.success).toBe(true);
    });
  });

  describe('Response Schemas', () => {
    it('should validate OrdersResponseSchema', () => {
      const validResponse = {
        success: true,
        data: [],
        meta: {
          total: 0,
          limit: 10,
          offset: 0,
          has_more: false,
          filters: {
            status: 'pending',
          },
        },
      };

      const result = OrdersResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should validate OrderDetailResponseSchema', () => {
      const validResponse = {
        success: true,
        data: {
          id: 1,
          user: {
            id: 1,
            first_name: 'John',
          },
          status: 'pending',
          total_price: 31.98,
          items_count: 2,
          created_at: '2023-12-01T10:00:00Z',
          updated_at: '2023-12-01T10:00:00Z',
          items: [],
        },
      };

      const result = OrderDetailResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should validate OrderStatsResponseSchema', () => {
      const validResponse = {
        success: true,
        data: {
          total_orders: 100,
          pending_orders: 5,
          confirmed_orders: 10,
          preparing_orders: 15,
          ready_orders: 20,
          delivered_orders: 50,
          total_revenue: 5000.5,
          avg_order_value: 50.005,
          orders_today: 10,
          revenue_today: 500.25,
          popular_items: [],
        },
      };

      const result = OrderStatsResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });
});
