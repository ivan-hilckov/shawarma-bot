import '../apiSetupJest';
import { buildServer } from '../../src/api/server';

describe('Cart API Contract Tests', () => {
  let server: any;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Validation', () => {
    it('GET /api/cart/:userId should validate userId parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/cart/invalid',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('POST /api/cart/add should validate request body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/cart/add',
        payload: {
          userId: 'invalid',
          itemId: '',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('PUT /api/cart/update should validate quantity parameter', async () => {
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
    });

    it('GET /api/cart/:userId/total should validate userId parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/cart/invalid/total',
      });

      expect(response.statusCode).toBe(400);
    });

    it('DELETE /api/cart/remove/:userId/:itemId should validate userId parameter', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/api/cart/remove/invalid/1',
      });

      expect(response.statusCode).toBe(400);
    });

    it('DELETE /api/cart/clear/:userId should validate userId parameter', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/api/cart/clear/invalid',
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
