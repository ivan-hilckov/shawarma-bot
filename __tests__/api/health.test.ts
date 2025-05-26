import { buildServer } from '../../src/api/server';

describe('Health API', () => {
  let server: any;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/health',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('uptime');
      expect(body).toHaveProperty('services');
      expect(body).toHaveProperty('metrics');

      expect(['healthy', 'degraded', 'unhealthy']).toContain(body.status);
      expect(body.services).toHaveProperty('database');
      expect(body.services).toHaveProperty('redis');
      expect(body.services).toHaveProperty('telegram_bot');
    });

    it('should have proper service status structure', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/health',
      });

      const body = JSON.parse(response.body);

      // Проверяем структуру database service
      expect(body.services.database).toHaveProperty('status');
      expect(body.services.database).toHaveProperty('response_time');
      expect(['up', 'down']).toContain(body.services.database.status);
      expect(typeof body.services.database.response_time).toBe('number');

      // Проверяем структуру metrics
      expect(body.metrics).toHaveProperty('memory_usage');
      expect(body.metrics).toHaveProperty('cpu_usage');
      expect(body.metrics).toHaveProperty('active_connections');
      expect(typeof body.metrics.memory_usage).toBe('number');
    });
  });

  describe('GET /api/health/ready', () => {
    it('should return readiness status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/health/ready',
      });

      expect([200, 503]).toContain(response.statusCode);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('ready');
      expect(body).toHaveProperty('timestamp');
      expect(typeof body.ready).toBe('boolean');
    });

    it('should return 503 when database is down', async () => {
      // Мокаем падение базы данных
      const originalQuery = server.db.query;
      server.db.query = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await server.inject({
        method: 'GET',
        url: '/api/health/ready',
      });

      expect(response.statusCode).toBe(503);

      const body = JSON.parse(response.body);
      expect(body.ready).toBe(false);
      expect(body).toHaveProperty('reason');

      // Восстанавливаем оригинальный метод
      server.db.query = originalQuery;
    });
  });

  describe('GET /api/health/live', () => {
    it('should always return alive status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/health/live',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('alive');
      expect(body).toHaveProperty('timestamp');
      expect(body.alive).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/non-existent',
      });

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should handle rate limiting (basic test)', async () => {
      // Отправляем много запросов подряд
      const promises = Array.from({ length: 50 }, () =>
        server.inject({
          method: 'GET',
          url: '/api/health',
          headers: {
            'x-forwarded-for': '192.168.1.100', // Фиксированный IP для тестирования
          },
        })
      );

      const responses = await Promise.all(promises);

      // Проверяем что все запросы получили ответ (200 или 429)
      responses.forEach(response => {
        expect([200, 429, 500]).toContain(response.statusCode);
      });

      // Проверяем что есть хотя бы один успешный ответ
      const successfulResponses = responses.filter(r => r.statusCode === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });
  });
});
