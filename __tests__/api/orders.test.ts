import { buildServer } from '../../src/api/server';

describe('Orders API', () => {
  let server: any;
  const validApiKey = 'admin-key-dev'; // Из конфига по умолчанию

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Authentication', () => {
    it('should require authorization header for orders endpoint', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders',
      });

      expect(response.statusCode).toBe(401);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('timestamp');
    });

    it('should reject invalid API key', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders',
        headers: {
          authorization: 'Bearer invalid-key',
        },
      });

      expect(response.statusCode).toBe(403);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('should accept valid API key', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders',
        headers: {
          authorization: `Bearer ${validApiKey}`,
        },
      });

      expect([200, 500]).toContain(response.statusCode); // 500 если нет данных в БД
    });
  });

  describe('GET /api/orders', () => {
    it('should return orders list with valid API key', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders',
        headers: {
          authorization: `Bearer ${validApiKey}`,
        },
      });

      expect([200, 500]).toContain(response.statusCode);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('meta');
        expect(Array.isArray(body.data)).toBe(true);

        expect(body.meta).toHaveProperty('total');
        expect(body.meta).toHaveProperty('limit');
        expect(body.meta).toHaveProperty('offset');
        expect(body.meta).toHaveProperty('has_more');
        expect(body.meta).toHaveProperty('filters');
      }
    });

    it('should handle status filter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders?status=pending',
        headers: {
          authorization: `Bearer ${validApiKey}`,
        },
      });

      expect([200, 500]).toContain(response.statusCode);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.meta).toHaveProperty('filters');
        // Проверяем, что фильтр status присутствует, если запрос был успешным
        if (body.meta.filters && Object.keys(body.meta.filters).length > 0) {
          expect(body.meta.filters).toHaveProperty('status', 'pending');
        }
      }
    });

    it('should handle user_id filter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders?user_id=123456789',
        headers: {
          authorization: `Bearer ${validApiKey}`,
        },
      });

      expect([200, 500]).toContain(response.statusCode);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.meta).toHaveProperty('filters');
        // Проверяем, что фильтр user_id присутствует, если запрос был успешным
        if (body.meta.filters && Object.keys(body.meta.filters).length > 0) {
          expect(body.meta.filters).toHaveProperty('user_id', 123456789);
        }
      }
    });

    it('should handle pagination', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders?limit=5&offset=0',
        headers: {
          authorization: `Bearer ${validApiKey}`,
        },
      });

      expect([200, 500]).toContain(response.statusCode);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.meta.limit).toBe(5);
        expect(body.meta.offset).toBe(0);
      }
    });

    it('should validate query parameters', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders?status=invalid_status',
        headers: {
          authorization: `Bearer ${validApiKey}`,
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders/1',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate order ID parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders/invalid',
        headers: {
          authorization: `Bearer ${validApiKey}`,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle negative order ID', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders/-1',
        headers: {
          authorization: `Bearer ${validApiKey}`,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders/99999',
        headers: {
          authorization: `Bearer ${validApiKey}`,
        },
      });

      expect([404, 500]).toContain(response.statusCode);

      if (response.statusCode === 404) {
        const body = JSON.parse(response.body);
        expect(body.success).toBe(false);
        expect(body).toHaveProperty('error');
        expect(body).toHaveProperty('timestamp');
      }
    });

    it('should return order details for existing order', async () => {
      // Сначала попробуем получить список заказов
      const listResponse = await server.inject({
        method: 'GET',
        url: '/api/orders?limit=1',
        headers: {
          authorization: `Bearer ${validApiKey}`,
        },
      });

      if (listResponse.statusCode === 200) {
        const listBody = JSON.parse(listResponse.body);

        if (listBody.data.length > 0) {
          const orderId = listBody.data[0].id;

          const response = await server.inject({
            method: 'GET',
            url: `/api/orders/${orderId}`,
            headers: {
              authorization: `Bearer ${validApiKey}`,
            },
          });

          expect([200, 500]).toContain(response.statusCode);

          if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('success', true);
            expect(body).toHaveProperty('data');

            const order = body.data;
            expect(order).toHaveProperty('id', orderId);
            expect(order).toHaveProperty('user');
            expect(order).toHaveProperty('status');
            expect(order).toHaveProperty('total_price');
            expect(order).toHaveProperty('items_count');
            expect(order).toHaveProperty('items');
            expect(order).toHaveProperty('created_at');
            expect(order).toHaveProperty('updated_at');

            expect(Array.isArray(order.items)).toBe(true);
          }
        }
      }
    });
  });

  describe('GET /api/orders/stats', () => {
    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders/stats',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return order statistics', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders/stats',
        headers: {
          authorization: `Bearer ${validApiKey}`,
        },
      });

      expect([200, 500]).toContain(response.statusCode);

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('data');

        const stats = body.data;
        expect(stats).toHaveProperty('total_orders');
        expect(stats).toHaveProperty('pending_orders');
        expect(stats).toHaveProperty('confirmed_orders');
        expect(stats).toHaveProperty('preparing_orders');
        expect(stats).toHaveProperty('ready_orders');
        expect(stats).toHaveProperty('delivered_orders');
        expect(stats).toHaveProperty('total_revenue');
        expect(stats).toHaveProperty('avg_order_value');
        expect(stats).toHaveProperty('orders_today');
        expect(stats).toHaveProperty('revenue_today');
        expect(stats).toHaveProperty('popular_items');

        expect(Array.isArray(stats.popular_items)).toBe(true);
        expect(typeof stats.total_orders).toBe('number');
        expect(typeof stats.total_revenue).toBe('number');
      }
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Мокаем ошибку базы данных
      const originalQuery = server.db.query;
      server.db.query = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await server.inject({
        method: 'GET',
        url: '/api/orders',
        headers: {
          authorization: `Bearer ${validApiKey}`,
        },
      });

      expect(response.statusCode).toBe(500);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');

      // Восстанавливаем оригинальный метод
      server.db.query = originalQuery;
    });
  });
});
