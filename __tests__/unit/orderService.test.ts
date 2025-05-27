import { OrderService } from '../../src/api/services/orderService';

describe('OrderService Unit Tests', () => {
  let orderService: OrderService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
    };
    orderService = new OrderService(mockDb);
  });

  describe('getOrders', () => {
    it('should return orders with correct structure', async () => {
      const mockCountResult = { rows: [{ total: '5' }] };
      const mockDataResult = {
        rows: [
          {
            id: 1,
            status: 'pending',
            total_price: '250.00',
            created_at: new Date('2024-01-01'),
            updated_at: new Date('2024-01-01'),
            user_id: 123,
            first_name: 'John',
            last_name: 'Doe',
            username: 'johndoe',
            items_count: '2',
          },
        ],
      };

      mockDb.query.mockResolvedValueOnce(mockCountResult).mockResolvedValueOnce(mockDataResult);

      const result = await orderService.getOrders({
        limit: 10,
        offset: 0,
      });

      expect(result.total).toBe(5);
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0]).toEqual({
        id: 1,
        user: {
          id: 123,
          first_name: 'John',
          last_name: 'Doe',
          username: 'johndoe',
        },
        status: 'pending',
        total_price: 250,
        items_count: 2,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it('should handle filters correctly', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await orderService.getOrders({
        status: 'pending',
        user_id: 123,
        limit: 10,
        offset: 0,
      });

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockDb.query.mock.calls[0][0]).toContain('WHERE');
      expect(mockDb.query.mock.calls[0][0]).toContain('o.status = $1');
      expect(mockDb.query.mock.calls[0][0]).toContain('o.user_id = $2');
    });
  });

  describe('getOrderById', () => {
    it('should return order details when order exists', async () => {
      const mockOrderResult = {
        rows: [
          {
            id: 1,
            status: 'pending',
            total_price: '250.00',
            created_at: new Date('2024-01-01'),
            updated_at: new Date('2024-01-01'),
            user_id: 123,
            first_name: 'John',
            last_name: 'Doe',
            username: 'johndoe',
          },
        ],
      };

      const mockItemsResult = {
        rows: [
          {
            id: 1,
            quantity: 2,
            price: '125.00',
            subtotal: '250.00',
            menu_item_id: 5,
            menu_item_name: 'Шаурма с курицей',
            current_price: '130.00',
          },
        ],
      };

      mockDb.query.mockResolvedValueOnce(mockOrderResult).mockResolvedValueOnce(mockItemsResult);

      const result = await orderService.getOrderById(1);

      expect(result).toEqual({
        id: 1,
        user: {
          id: 123,
          first_name: 'John',
          last_name: 'Doe',
          username: 'johndoe',
        },
        status: 'pending',
        total_price: 250,
        items_count: 1,
        items: [
          {
            id: 1,
            menu_item: {
              id: 5,
              name: 'Шаурма с курицей',
              price: 130,
            },
            quantity: 2,
            price: 125,
            subtotal: 250,
          },
        ],
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it('should return null when order does not exist', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });

      const result = await orderService.getOrderById(999);

      expect(result).toBeNull();
    });
  });

  describe('getOrderStats', () => {
    it('should return correct statistics structure', async () => {
      const mockStatusResult = { rows: [{ status: 'pending', count: '5', revenue: '1250.00' }] };
      const mockOverallResult = {
        rows: [{ total_orders: '10', total_revenue: '2500.00', avg_order_value: '250.00' }],
      };
      const mockTodayResult = { rows: [{ orders_today: '3', revenue_today: '750.00' }] };
      const mockPopularResult = {
        rows: [{ item_id: 1, name: 'Шаурма', total_ordered: '15', revenue: '1875.00' }],
      };

      mockDb.query
        .mockResolvedValueOnce(mockStatusResult)
        .mockResolvedValueOnce(mockOverallResult)
        .mockResolvedValueOnce(mockTodayResult)
        .mockResolvedValueOnce(mockPopularResult);

      const result = await orderService.getOrderStats();

      expect(result).toEqual({
        total_orders: 10,
        pending_orders: 5,
        confirmed_orders: 0,
        preparing_orders: 0,
        ready_orders: 0,
        delivered_orders: 0,
        total_revenue: 2500,
        avg_order_value: 250,
        orders_today: 3,
        revenue_today: 750,
        popular_items: [
          {
            item_id: 1,
            name: 'Шаурма',
            total_ordered: 15,
            revenue: 1875,
          },
        ],
      });
    });
  });

  describe('error handling', () => {
    it('should throw error when database query fails', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(orderService.getOrders({ limit: 10, offset: 0 })).rejects.toThrow(
        'Failed to fetch orders'
      );
    });
  });
});
