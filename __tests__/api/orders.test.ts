import '../apiSetupJest';
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
  });

  describe('GET /api/orders', () => {
    it('should validate query parameters', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders?status=invalid_status',
        headers: {
          authorization: `Bearer ${validApiKey}`,
        },
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FST_ERR_VALIDATION');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders/1',
      });

      expect(response.statusCode).toBe(401);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHORIZED');
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

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FST_ERR_VALIDATION');
    });
  });

  describe('GET /api/orders/stats', () => {
    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orders/stats',
      });

      expect(response.statusCode).toBe(401);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
