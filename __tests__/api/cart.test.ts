import { buildServer } from '../../src/api/server';

describe('Cart API', () => {
  let server: any;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
    // Принудительно завершаем процесс если есть висящие соединения
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  });

  const testUserId = 123456789;
  const testItemId = '1';

  beforeEach(async () => {
    // Очищаем корзину перед каждым тестом
    await server.inject({
      method: 'DELETE',
      url: `/api/cart/clear/${testUserId}`,
    });
  });

  describe('GET /api/cart/:userId', () => {
    it('should return empty cart for new user', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/cart/${testUserId}`,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data).toHaveLength(0);
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('total', 0);
      expect(body.meta).toHaveProperty('itemsCount', 0);
      expect(body.meta).toHaveProperty('userId', testUserId);
    });

    it('should return 400 for invalid userId', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/cart/invalid',
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', false);
      expect(body).toHaveProperty('error');
    });
  });

  describe('POST /api/cart/add', () => {
    it('should add item to cart', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/cart/add',
        payload: {
          userId: testUserId,
          itemId: testItemId,
          quantity: 2,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('message', 'Item added to cart successfully');
    });

    it('should return 404 for non-existent item', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/cart/add',
        payload: {
          userId: testUserId,
          itemId: 'non-existent',
          quantity: 1,
        },
      });

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', false);
      expect(body).toHaveProperty('error');
      expect(body.error).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should return 400 for invalid payload', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/cart/add',
        payload: {
          userId: 'invalid',
          itemId: testItemId,
        },
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', false);
      expect(body).toHaveProperty('error');
    });

    it('should use default quantity of 1', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/cart/add',
        payload: {
          userId: testUserId + 1,
          itemId: testItemId,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/cart/:userId after adding items', () => {
    it('should return cart with added items', async () => {
      // Сначала добавляем товар в корзину
      await server.inject({
        method: 'POST',
        url: '/api/cart/add',
        payload: {
          userId: testUserId,
          itemId: testItemId,
          quantity: 2,
        },
      });

      const response = await server.inject({
        method: 'GET',
        url: `/api/cart/${testUserId}`,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body).toHaveProperty('meta');
      expect(body.meta.total).toBeGreaterThan(0);
      expect(body.meta.itemsCount).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/cart/update', () => {
    it('should update item quantity', async () => {
      // Сначала добавляем товар в корзину
      await server.inject({
        method: 'POST',
        url: '/api/cart/add',
        payload: {
          userId: testUserId,
          itemId: testItemId,
          quantity: 1,
        },
      });

      const response = await server.inject({
        method: 'PUT',
        url: '/api/cart/update',
        payload: {
          userId: testUserId,
          itemId: testItemId,
          quantity: 5,
        },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('message', 'Cart item quantity updated successfully');
    });

    it('should return 404 for non-existent cart item', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/cart/update',
        payload: {
          userId: testUserId,
          itemId: 'non-existent',
          quantity: 1,
        },
      });

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', false);
      expect(body).toHaveProperty('error');
      expect(body.error).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should return 400 for invalid payload', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/cart/update',
        payload: {
          userId: testUserId,
          itemId: testItemId,
          quantity: 0, // Invalid quantity
        },
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', false);
      expect(body).toHaveProperty('error');
    });
  });

  describe('GET /api/cart/:userId/total', () => {
    it('should return cart total', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/cart/${testUserId}/total`,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('total');
      expect(body.data).toHaveProperty('itemsCount');
      expect(body.data).toHaveProperty('userId', testUserId);
      expect(typeof body.data.total).toBe('number');
      expect(typeof body.data.itemsCount).toBe('number');
    });

    it('should return 400 for invalid userId', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/cart/invalid/total',
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', false);
      expect(body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/cart/remove/:userId/:itemId', () => {
    it('should remove item from cart', async () => {
      // Сначала добавляем товар в корзину
      await server.inject({
        method: 'POST',
        url: '/api/cart/add',
        payload: {
          userId: testUserId,
          itemId: testItemId,
          quantity: 1,
        },
      });

      const response = await server.inject({
        method: 'DELETE',
        url: `/api/cart/remove/${testUserId}/${testItemId}`,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('message', 'Item removed from cart successfully');
    });

    it('should return 404 for non-existent cart item', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `/api/cart/remove/${testUserId}/non-existent`,
      });

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', false);
      expect(body).toHaveProperty('error');
      expect(body.error).toHaveProperty('code', 'NOT_FOUND');
    });

    it('should return 400 for invalid userId', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `/api/cart/remove/invalid/${testItemId}`,
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', false);
      expect(body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/cart/clear/:userId', () => {
    beforeEach(async () => {
      // Add some items to cart before clearing
      await server.inject({
        method: 'POST',
        url: '/api/cart/add',
        payload: {
          userId: testUserId,
          itemId: testItemId,
          quantity: 1,
        },
      });
    });

    it('should clear cart', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `/api/cart/clear/${testUserId}`,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('message', 'Cart cleared successfully');
    });

    it('should return empty cart after clearing', async () => {
      await server.inject({
        method: 'DELETE',
        url: `/api/cart/clear/${testUserId}`,
      });

      const response = await server.inject({
        method: 'GET',
        url: `/api/cart/${testUserId}`,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body.data).toHaveLength(0);
      expect(body.meta.total).toBe(0);
      expect(body.meta.itemsCount).toBe(0);
    });

    it('should return 400 for invalid userId', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/api/cart/clear/invalid',
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', false);
      expect(body).toHaveProperty('error');
    });
  });

  describe('Error handling', () => {
    it('should handle server errors gracefully', async () => {
      // Test with extremely large userId that might cause issues
      const response = await server.inject({
        method: 'GET',
        url: '/api/cart/999999999999999999999',
      });

      // Should either work or return a proper error
      expect([200, 400, 500]).toContain(response.statusCode);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success');

      if (!body.success) {
        expect(body).toHaveProperty('error');
        expect(body).toHaveProperty('timestamp');
      }
    });
  });
});
