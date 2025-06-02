import { Pool } from 'pg';

import { UserService } from '../../src/api/services/userService';

// Мокаем логгер
jest.mock('../../src/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
  }),
}));

describe('UserService', () => {
  let userService: UserService;
  let mockPool: {
    query: jest.Mock;
  };

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };

    userService = new UserService(mockPool as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertUser', () => {
    const userData = {
      id: 123,
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should create new user successfully', async () => {
      const userRow = {
        id: 123,
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
      };

      const statsRow = {
        orders_count: '5',
        total_spent: '125.50',
        last_order_date: new Date('2023-12-01'),
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [userRow] })
        .mockResolvedValueOnce({ rows: [statsRow] });

      const result = await userService.upsertUser(userData);

      expect(result).toEqual({
        id: 123,
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
        ordersCount: 5,
        totalSpent: 125.5,
        lastOrderDate: new Date('2023-12-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      });

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(mockPool.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('INSERT INTO users'),
        [123, 'johndoe', 'John', 'Doe']
      );
    });

    it('should update existing user', async () => {
      const userRow = {
        id: 123,
        username: 'johndoe_updated',
        first_name: 'John Updated',
        last_name: 'Doe Updated',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-12-01'),
      };

      const statsRow = {
        orders_count: '10',
        total_spent: '250.00',
        last_order_date: new Date('2023-12-01'),
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [userRow] })
        .mockResolvedValueOnce({ rows: [statsRow] });

      const result = await userService.upsertUser({
        id: 123,
        username: 'johndoe_updated',
        firstName: 'John Updated',
        lastName: 'Doe Updated',
      });

      expect(result.username).toBe('johndoe_updated');
      expect(result.firstName).toBe('John Updated');
      expect(result.ordersCount).toBe(10);
      expect(result.totalSpent).toBe(250.0);
    });

    it('should handle user without orders', async () => {
      const userRow = {
        id: 456,
        username: null,
        first_name: 'Jane',
        last_name: null,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
      };

      const statsRow = {
        orders_count: '0',
        total_spent: '0',
        last_order_date: null,
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [userRow] })
        .mockResolvedValueOnce({ rows: [statsRow] });

      const result = await userService.upsertUser({
        id: 456,
        firstName: 'Jane',
      });

      expect(result).toEqual({
        id: 456,
        username: null,
        firstName: 'Jane',
        lastName: null,
        ordersCount: 0,
        totalSpent: 0,
        lastOrderDate: null,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      });
    });

    it('should throw error on database failure', async () => {
      const dbError = new Error('Database connection failed');
      mockPool.query.mockRejectedValue(dbError);

      await expect(userService.upsertUser(userData)).rejects.toThrow(
        'Failed to create or update user'
      );

      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserById', () => {
    it('should return user with statistics', async () => {
      const userRow = {
        id: 123,
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
      };

      const statsRow = {
        orders_count: '3',
        total_spent: '75.99',
        last_order_date: new Date('2023-11-01'),
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [userRow] })
        .mockResolvedValueOnce({ rows: [statsRow] });

      const result = await userService.getUserById(123);

      expect(result).toEqual({
        id: 123,
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
        ordersCount: 3,
        totalSpent: 75.99,
        lastOrderDate: new Date('2023-11-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      });
    });

    it('should return null for non-existent user', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await userService.getUserById(999);

      expect(result).toBeNull();
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });

    it('should throw error on database failure', async () => {
      const dbError = new Error('Database error');
      mockPool.query.mockRejectedValue(dbError);

      await expect(userService.getUserById(123)).rejects.toThrow('Failed to fetch user');
    });
  });

  describe('getUserOrders', () => {
    const mockOrders = [
      {
        id: 1,
        status: 'delivered',
        total_price: '25.99',
        created_at: new Date('2023-11-01'),
        updated_at: new Date('2023-11-01'),
        items_count: '2',
      },
      {
        id: 2,
        status: 'pending',
        total_price: '15.50',
        created_at: new Date('2023-12-01'),
        updated_at: new Date('2023-12-01'),
        items_count: '1',
      },
    ];

    it('should return user orders with pagination', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ total: '10' }] })
        .mockResolvedValueOnce({ rows: mockOrders });

      const result = await userService.getUserOrders(123, {
        limit: 10,
        offset: 0,
      });

      expect(result.total).toBe(10);
      expect(result.orders).toHaveLength(2);
      expect(result.orders[0]).toEqual({
        id: 1,
        status: 'delivered',
        totalPrice: 25.99,
        itemsCount: 2,
        createdAt: '2023-11-01T00:00:00.000Z',
        updatedAt: '2023-11-01T00:00:00.000Z',
      });
    });

    it('should filter orders by status', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ total: '5' }] })
        .mockResolvedValueOnce({ rows: [mockOrders[1]] });

      const result = await userService.getUserOrders(123, {
        limit: 10,
        offset: 0,
        status: 'pending',
      });

      expect(result.total).toBe(5);
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0]?.status).toBe('pending');
    });

    it('should handle empty orders list', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await userService.getUserOrders(456, {
        limit: 10,
        offset: 0,
      });

      expect(result.total).toBe(0);
      expect(result.orders).toHaveLength(0);
    });

    it('should throw error on database failure', async () => {
      const dbError = new Error('Database error');
      mockPool.query.mockRejectedValue(dbError);

      await expect(userService.getUserOrders(123, { limit: 10, offset: 0 })).rejects.toThrow(
        'Failed to fetch user orders'
      );
    });
  });

  describe('getUsers', () => {
    const mockUsers = [
      {
        id: 1,
        username: 'user1',
        first_name: 'User',
        last_name: 'One',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
        orders_count: '5',
        total_spent: '125.50',
        last_order_date: new Date('2023-11-01'),
      },
      {
        id: 2,
        username: null,
        first_name: 'User',
        last_name: 'Two',
        created_at: new Date('2023-02-01'),
        updated_at: new Date('2023-02-01'),
        orders_count: '0',
        total_spent: '0',
        last_order_date: null,
      },
    ];

    it('should return users list with pagination', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ total: '25' }] })
        .mockResolvedValueOnce({ rows: mockUsers });

      const result = await userService.getUsers({ limit: 10, offset: 0 });

      expect(result.total).toBe(25);
      expect(result.users).toHaveLength(2);
      expect(result.users[0]).toEqual({
        id: 1,
        username: 'user1',
        firstName: 'User',
        lastName: 'One',
        ordersCount: 5,
        totalSpent: 125.5,
        lastOrderDate: new Date('2023-11-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      });
    });

    it('should handle empty users list', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ total: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await userService.getUsers({ limit: 10, offset: 0 });

      expect(result.total).toBe(0);
      expect(result.users).toHaveLength(0);
    });

    it('should throw error on database failure', async () => {
      const dbError = new Error('Database error');
      mockPool.query.mockRejectedValue(dbError);

      await expect(userService.getUsers({ limit: 10, offset: 0 })).rejects.toThrow(
        'Failed to fetch users'
      );
    });
  });

  describe('getUserStats', () => {
    it('should return comprehensive user statistics', async () => {
      const overallStats = {
        total_users: '100',
        active_users: '75',
      };

      const newUsersStats = {
        new_users_today: '5',
        new_users_this_week: '20',
        new_users_this_month: '80',
      };

      const avgStats = {
        avg_orders_per_user: '3.5',
        avg_spent_per_user: '87.50',
      };

      const topSpenders = [
        {
          id: 1,
          first_name: 'John',
          username: 'johndoe',
          orders_count: '10',
          total_spent: '250.00',
        },
        {
          id: 2,
          first_name: 'Jane',
          username: null,
          orders_count: '8',
          total_spent: '200.00',
        },
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [overallStats] })
        .mockResolvedValueOnce({ rows: [newUsersStats] })
        .mockResolvedValueOnce({ rows: [avgStats] })
        .mockResolvedValueOnce({ rows: topSpenders });

      const result = await userService.getUserStats();

      expect(result).toEqual({
        totalUsers: 100,
        activeUsers: 75,
        newUsersToday: 5,
        newUsersThisWeek: 20,
        newUsersThisMonth: 80,
        avgOrdersPerUser: 3.5,
        avgSpentPerUser: 87.5,
        topSpenders: [
          {
            id: 1,
            firstName: 'John',
            username: 'johndoe',
            totalSpent: 250.0,
            ordersCount: 10,
          },
          {
            id: 2,
            firstName: 'Jane',
            username: null,
            totalSpent: 200.0,
            ordersCount: 8,
          },
        ],
      });

      expect(mockPool.query).toHaveBeenCalledTimes(4);
    });

    it('should handle empty top spenders', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ total_users: '0', active_users: '0' }] })
        .mockResolvedValueOnce({
          rows: [{ new_users_today: '0', new_users_this_week: '0', new_users_this_month: '0' }],
        })
        .mockResolvedValueOnce({ rows: [{ avg_orders_per_user: '0', avg_spent_per_user: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await userService.getUserStats();

      expect(result.totalUsers).toBe(0);
      expect(result.topSpenders).toHaveLength(0);
    });

    it('should throw error on database failure', async () => {
      const dbError = new Error('Database error');
      mockPool.query.mockRejectedValue(dbError);

      await expect(userService.getUserStats()).rejects.toThrow('Failed to fetch user statistics');
    });
  });
});
