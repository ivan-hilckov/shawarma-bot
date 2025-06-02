// Отключаем глобальные моки из setupJest.ts которые мешают
jest.unmock('../../src/api-client');
jest.unmock('../../src/logger');
jest.unmock('../../src/api/plugins/database');

// Устанавливаем короткий timeout
jest.setTimeout(5000);

// Добавляем недостающий мок OrderService (setupJest.ts уже содержит другие моки)
jest.mock('../../src/api/services/orderService', () => ({
  OrderService: jest.fn().mockImplementation((db: any) => ({
    getOrders: jest.fn().mockResolvedValue({ orders: [], total: 0 }),
    getOrderById: jest.fn().mockResolvedValue(null),
    getOrderStats: jest.fn().mockResolvedValue({
      total_orders: 0,
      pending_orders: 0,
      confirmed_orders: 0,
      preparing_orders: 0,
      ready_orders: 0,
      delivered_orders: 0,
      total_revenue: 0,
      avg_order_value: 0,
      orders_today: 0,
      revenue_today: 0,
      popular_items: [],
    }),
  })),
}));

// Мокируем config для тестирования аутентификации
jest.mock('../../src/config', () => ({
  __esModule: true,
  default: {
    API_KEYS: ['admin-key-dev', 'test-key'],
  },
}));

import orderRoutes from '../../src/api/routes/orders';
import { OrderService } from '../../src/api/services/orderService';

describe('Orders Routes - Complete Coverage Tests', () => {
  let mockFastify: any;
  let mockOrderService: any;
  let mockGet: jest.Mock;
  const routes: { [key: string]: any } = {};

  beforeAll(async () => {
    // Создаем mock функцию отдельно
    mockGet = jest.fn().mockImplementation((path, config, handler) => {
      routes[path] = { config, handler };
    });

    // Создаем mock Fastify instance с database из setupJest.ts
    mockFastify = {
      db: {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        end: jest.fn().mockResolvedValue(undefined),
      },
      get: mockGet,
    };

    // Получаем mock OrderService instance перед регистрацией routes
    const MockOrderService = OrderService as jest.MockedClass<typeof OrderService>;

    // Регистрируем routes с правильными аргументами (fastify, options)
    await orderRoutes(mockFastify, {});

    // Получаем созданный instance
    mockOrderService =
      MockOrderService.mock.results[MockOrderService.mock.results.length - 1]?.value;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Route Registration', () => {
    it('should register all three GET routes', () => {
      // Проверяем что routes зарегистрированы (это важно для coverage)
      expect(routes['/orders']).toBeDefined();
      expect(routes['/orders/:id']).toBeDefined();
      expect(routes['/orders/stats']).toBeDefined();

      // Проверяем что у каждого route есть handler и config
      expect(routes['/orders'].handler).toBeInstanceOf(Function);
      expect(routes['/orders/:id'].handler).toBeInstanceOf(Function);
      expect(routes['/orders/stats'].handler).toBeInstanceOf(Function);
    });

    it('should configure routes with preHandler authenticateAdmin', () => {
      expect(routes['/orders'].config.preHandler).toBeDefined();
      expect(routes['/orders/:id'].config.preHandler).toBeDefined();
      expect(routes['/orders/stats'].config.preHandler).toBeDefined();
    });

    it('should configure routes with correct schemas', () => {
      expect(routes['/orders'].config.schema.description).toContain('Получение заказов');
      expect(routes['/orders/:id'].config.schema.description).toContain('детальной информации');
      expect(routes['/orders/stats'].config.schema.description).toContain('Получение статистики');
    });
  });

  describe('AuthenticateAdmin Middleware', () => {
    const mockRequest = (authHeader?: string) => ({
      headers: { authorization: authHeader },
      log: { error: jest.fn() },
    });

    const mockReply = () => {
      const reply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };
      return reply;
    };

    it('should reject request without authorization header', () => {
      const authenticateAdmin = routes['/orders'].config.preHandler;
      const request = mockRequest();
      const reply = mockReply();

      authenticateAdmin(request, reply);

      expect(reply.code).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'UNAUTHORIZED',
          }),
        })
      );
    });

    it('should reject request with invalid Bearer format', () => {
      const authenticateAdmin = routes['/orders'].config.preHandler;
      const request = mockRequest('InvalidFormat');
      const reply = mockReply();

      authenticateAdmin(request, reply);

      expect(reply.code).toHaveBeenCalledWith(401);
    });

    it('should reject request with invalid API key', () => {
      const authenticateAdmin = routes['/orders'].config.preHandler;
      const request = mockRequest('Bearer invalid-key');
      const reply = mockReply();

      authenticateAdmin(request, reply);

      expect(reply.code).toHaveBeenCalledWith(403);
      expect(reply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'FORBIDDEN',
          }),
        })
      );
    });

    it('should allow request with valid API key', () => {
      const authenticateAdmin = routes['/orders'].config.preHandler;
      const request = mockRequest('Bearer admin-key-dev');
      const reply = mockReply();

      authenticateAdmin(request, reply);

      expect(reply.code).not.toHaveBeenCalled();
      expect(reply.send).not.toHaveBeenCalled();
    });

    it('should allow request with test API key', () => {
      const authenticateAdmin = routes['/orders'].config.preHandler;
      const request = mockRequest('Bearer test-key');
      const reply = mockReply();

      authenticateAdmin(request, reply);

      expect(reply.code).not.toHaveBeenCalled();
      expect(reply.send).not.toHaveBeenCalled();
    });
  });

  describe('GET /orders handler', () => {
    const createMockRequest = (query: any = {}) => ({
      query,
      log: { error: jest.fn() },
    });

    const createMockReply = () => {
      const reply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };
      return reply;
    };

    it('should handle successful orders request', async () => {
      const mockOrders = [
        {
          id: 1,
          user: { id: 123, first_name: 'John' },
          status: 'pending',
          total_price: 500,
        },
      ];

      mockOrderService.getOrders.mockResolvedValueOnce({
        orders: mockOrders,
        total: 1,
      });

      const handler = routes['/orders'].handler;
      const request = createMockRequest({
        status: 'pending',
        limit: 10,
        offset: 0,
      });
      const reply = createMockReply();

      const result = await handler(request, reply);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrders);
      expect(result.meta.total).toBe(1);
      expect(result.meta.has_more).toBe(false);
    });

    it('should handle service errors (catch block coverage)', async () => {
      // Заставляем OrderService.getOrders бросить ошибку для покрытия catch блока
      mockOrderService.getOrders.mockRejectedValueOnce(new Error('Database connection failed'));

      const handler = routes['/orders'].handler;
      const request = createMockRequest({});
      const reply = createMockReply();

      const result = await handler(request, reply);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(result.error.message).toBe('Failed to fetch orders');
      expect(reply.code).toHaveBeenCalledWith(500);
      expect(request.log.error).toHaveBeenCalledWith('Failed to get orders:', expect.any(Error));
    });

    it('should build filters correctly', async () => {
      mockOrderService.getOrders.mockResolvedValueOnce({ orders: [], total: 0 });

      const handler = routes['/orders'].handler;
      const request = createMockRequest({
        status: 'pending',
        user_id: 123,
        date_from: '2024-01-01T00:00:00Z',
        limit: 5,
      });
      const reply = createMockReply();

      await handler(request, reply);

      expect(mockOrderService.getOrders).toHaveBeenCalledWith({
        status: 'pending',
        user_id: 123,
        date_from: '2024-01-01T00:00:00Z',
        date_to: undefined,
        limit: 5,
        offset: 0,
      });
    });

    it('should use default values for limit and offset', async () => {
      mockOrderService.getOrders.mockResolvedValueOnce({ orders: [], total: 0 });

      const handler = routes['/orders'].handler;
      const request = createMockRequest({ status: 'pending' });
      const reply = createMockReply();

      await handler(request, reply);

      expect(mockOrderService.getOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
          offset: 0,
        })
      );
    });

    it('should calculate has_more correctly', async () => {
      mockOrderService.getOrders.mockResolvedValueOnce({ orders: [], total: 25 });

      const handler = routes['/orders'].handler;
      const request = createMockRequest({ limit: 10, offset: 5 });
      const reply = createMockReply();

      const result = await handler(request, reply);

      expect(result.meta.has_more).toBe(true); // 5 + 10 = 15 < 25
    });

    it('should handle conditional filters properly', async () => {
      mockOrderService.getOrders.mockResolvedValueOnce({ orders: [], total: 0 });

      const handler = routes['/orders'].handler;
      const request = createMockRequest({
        status: 'confirmed',
        user_id: 456,
        date_from: '2024-01-01T00:00:00Z',
        date_to: '2024-01-31T23:59:59Z',
      });
      const reply = createMockReply();

      const result = await handler(request, reply);

      expect(result.meta.filters).toEqual({
        status: 'confirmed',
        user_id: 456,
        date_from: '2024-01-01T00:00:00Z',
        date_to: '2024-01-31T23:59:59Z',
      });
    });
  });

  describe('GET /orders/:id handler', () => {
    const createMockRequest = (paramId: string) => ({
      params: { id: paramId },
      log: { error: jest.fn() },
    });

    const createMockReply = () => {
      const reply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };
      return reply;
    };

    it('should validate order ID parameter', async () => {
      const handler = routes['/orders/:id'].handler;
      const request = createMockRequest('invalid');
      const reply = createMockReply();

      const result = await handler(request, reply);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETER');
      expect(reply.code).toHaveBeenCalledWith(400);
    });

    it('should reject negative order ID', async () => {
      const handler = routes['/orders/:id'].handler;
      const request = createMockRequest('-1');
      const reply = createMockReply();

      const result = await handler(request, reply);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETER');
    });

    it('should reject zero order ID', async () => {
      const handler = routes['/orders/:id'].handler;
      const request = createMockRequest('0');
      const reply = createMockReply();

      const result = await handler(request, reply);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INVALID_PARAMETER');
    });

    it('should return 404 for non-existent order', async () => {
      mockOrderService.getOrderById.mockResolvedValueOnce(null);

      const handler = routes['/orders/:id'].handler;
      const request = createMockRequest('999');
      const reply = createMockReply();

      const result = await handler(request, reply);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toBe('Order with id 999 not found');
      expect(reply.code).toHaveBeenCalledWith(404);
    });

    it('should return order successfully', async () => {
      const mockOrder = {
        id: 1,
        user: { id: 123, first_name: 'John' },
        status: 'pending',
        total_price: 500,
      };

      mockOrderService.getOrderById.mockResolvedValueOnce(mockOrder);

      const handler = routes['/orders/:id'].handler;
      const request = createMockRequest('1');
      const reply = createMockReply();

      const result = await handler(request, reply);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrder);
    });

    it('should handle service errors (catch block coverage)', async () => {
      // Заставляем OrderService.getOrderById бросить ошибку для покрытия catch блока
      mockOrderService.getOrderById.mockRejectedValueOnce(new Error('Database timeout'));

      const handler = routes['/orders/:id'].handler;
      const request = createMockRequest('1');
      const reply = createMockReply();

      const result = await handler(request, reply);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(result.error.message).toBe('Failed to fetch order');
      expect(reply.code).toHaveBeenCalledWith(500);
      expect(request.log.error).toHaveBeenCalledWith('Failed to get order:', expect.any(Error));
    });
  });

  describe('GET /orders/stats handler', () => {
    const createMockRequest = () => ({
      log: { error: jest.fn() },
    });

    const createMockReply = () => {
      const reply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };
      return reply;
    };

    it('should return statistics successfully', async () => {
      const mockStats = {
        total_orders: 50,
        pending_orders: 5,
        confirmed_orders: 10,
        preparing_orders: 8,
        ready_orders: 2,
        delivered_orders: 25,
        total_revenue: 15000,
        avg_order_value: 300,
        orders_today: 8,
        revenue_today: 2400,
        popular_items: [
          {
            item_id: 1,
            name: 'Шаурма Классик',
            total_ordered: 120,
            revenue: 26400,
          },
        ],
      };

      mockOrderService.getOrderStats.mockResolvedValueOnce(mockStats);

      const handler = routes['/orders/stats'].handler;
      const request = createMockRequest();
      const reply = createMockReply();

      const result = await handler(request, reply);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
    });

    it('should handle service errors (catch block coverage)', async () => {
      // Заставляем OrderService.getOrderStats бросить ошибку для покрытия catch блока
      mockOrderService.getOrderStats.mockRejectedValueOnce(new Error('Query execution failed'));

      const handler = routes['/orders/stats'].handler;
      const request = createMockRequest();
      const reply = createMockReply();

      const result = await handler(request, reply);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(result.error.message).toBe('Failed to fetch order statistics');
      expect(reply.code).toHaveBeenCalledWith(500);
      expect(request.log.error).toHaveBeenCalledWith(
        'Failed to get order stats:',
        expect.any(Error)
      );
    });
  });
});
