// Локальные моки для cart API тестов

// Мок CartApiService
jest.mock('../../src/api/services/cartApiService', () => ({
  CartApiService: jest.fn().mockImplementation(() => ({
    getCart: jest.fn().mockResolvedValue({ items: [], total: 0, itemsCount: 0 }),
    addToCart: jest.fn().mockResolvedValue(undefined),
    updateQuantity: jest.fn().mockResolvedValue(undefined),
    removeFromCart: jest.fn().mockResolvedValue(undefined),
    clearCart: jest.fn().mockResolvedValue(undefined),
    getCartTotal: jest.fn().mockResolvedValue({ total: 0, itemsCount: 0 }),
  })),
}));

// Мок database plugin
jest.mock('../../src/api/plugins/database', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(async (fastify: any) => {
    const mockPool = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      end: jest.fn().mockResolvedValue(undefined),
    };
    fastify.decorate('db', mockPool);
    return Promise.resolve();
  }),
}));

// Мок для логгера
jest.mock('../../src/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

import { buildServer } from '../../src/api/server';

describe('Cart API Routes Tests', () => {
  let server: any;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /api/cart/:userId', () => {
    it('should validate userId parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/cart/invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('should return cart successfully', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/cart/123',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.meta).toBeDefined();
      expect(body.meta.userId).toBe(123);
    });
  });

  describe('POST /api/cart/add', () => {
    it('should validate request body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/cart/add',
        payload: {
          userId: 'invalid',
          itemId: '',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('should add item to cart successfully', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/cart/add',
        payload: {
          userId: 123,
          itemId: 'item1',
          quantity: 2,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Item added to cart successfully');
    });
  });

  describe('PUT /api/cart/update', () => {
    it('should validate quantity parameter', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/cart/update',
        payload: {
          userId: 123,
          itemId: '1',
          quantity: 0, // Invalid quantity
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('should update item quantity successfully', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/cart/update',
        payload: {
          userId: 123,
          itemId: 'item1',
          quantity: 3,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Cart item quantity updated successfully');
    });
  });

  describe('DELETE /api/cart/remove/:userId/:itemId', () => {
    it('should validate userId parameter', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/api/cart/remove/invalid/1',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('should remove item from cart successfully', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/api/cart/remove/123/item1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Item removed from cart successfully');
    });
  });

  describe('DELETE /api/cart/clear/:userId', () => {
    it('should validate userId parameter', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/api/cart/clear/invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('should clear cart successfully', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/api/cart/clear/123',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toBe('Cart cleared successfully');
    });
  });

  describe('GET /api/cart/:userId/total', () => {
    it('should validate userId parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/cart/invalid/total',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it('should return cart total successfully', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/cart/123/total',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.userId).toBe(123);
    });
  });
});
