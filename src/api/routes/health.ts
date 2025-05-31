import { FastifyPluginAsync } from 'fastify';

const healthRoutes: FastifyPluginAsync = async fastify => {
  // GET /api/health - основной health check
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Health check для мониторинга состояния сервисов',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
              timestamp: { type: 'string', format: 'date-time' },
              uptime: { type: 'number' },
              services: {
                type: 'object',
                properties: {
                  database: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['up', 'down'] },
                      response_time: { type: 'number' },
                    },
                  },
                  redis: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['up', 'down'] },
                      response_time: { type: 'number' },
                    },
                  },
                  telegram_bot: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['up', 'down'] },
                      last_update: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
              metrics: {
                type: 'object',
                properties: {
                  memory_usage: { type: 'number' },
                  cpu_usage: { type: 'number' },
                  active_connections: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async () => {
      // Проверяем базу данных
      let dbStatus = 'down';
      let dbResponseTime = 0;
      try {
        const dbStart = Date.now();
        await fastify.db.query('SELECT 1');
        dbResponseTime = Date.now() - dbStart;
        dbStatus = 'up';
      } catch (error) {
        fastify.log.error('Database health check failed:', error);
      }

      // Проверяем Redis (если подключен)
      let redisStatus = 'down';
      let redisResponseTime = 0;
      try {
        // Проверяем наличие Redis через any type для избежания ошибок типизации
        const redis = (fastify as any).redis;
        if (redis) {
          const redisStart = Date.now();
          await redis.ping();
          redisResponseTime = Date.now() - redisStart;
          redisStatus = 'up';
        }
      } catch (error) {
        fastify.log.error('Redis health check failed:', error);
      }

      // Определяем общий статус
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (dbStatus === 'down') {
        overallStatus = 'unhealthy';
      } else if (redisStatus === 'down') {
        overallStatus = 'degraded';
      }

      // Метрики системы
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: {
            status: dbStatus,
            response_time: dbResponseTime,
          },
          redis: {
            status: redisStatus,
            response_time: redisResponseTime,
          },
          telegram_bot: {
            status: 'up', // TODO: реальная проверка бота
            last_update: new Date().toISOString(),
          },
        },
        metrics: {
          memory_usage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
          cpu_usage: Math.round((cpuUsage.user + cpuUsage.system) / 1000000), // микросекунды в миллисекунды
          active_connections: 0, // TODO: реальное количество подключений
        },
      };
    }
  );

  // GET /api/health/ready - readiness probe для Kubernetes
  fastify.get(
    '/health/ready',
    {
      schema: {
        description: 'Readiness probe - проверка готовности к обработке запросов',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              ready: { type: 'boolean' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
          503: {
            type: 'object',
            properties: {
              ready: { type: 'boolean' },
              reason: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Проверяем критичные сервисы
        await fastify.db.query('SELECT 1');

        return {
          ready: true,
          timestamp: new Date().toISOString(),
        };
      } catch {
        reply.code(503);
        return {
          ready: false,
          reason: 'Database connection failed',
          timestamp: new Date().toISOString(),
        };
      }
    }
  );

  // GET /api/health/live - liveness probe для Kubernetes
  fastify.get(
    '/health/live',
    {
      schema: {
        description: 'Liveness probe - проверка что сервис жив',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              alive: { type: 'boolean' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
    async () => {
      return {
        alive: true,
        timestamp: new Date().toISOString(),
      };
    }
  );

  await Promise.resolve();
};

export default healthRoutes;
