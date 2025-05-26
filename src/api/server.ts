import Fastify from 'fastify';
import config from '../config';
import { createLogger } from '../logger';

// Импорт плагинов
import databasePlugin from './plugins/database';

// Импорт маршрутов
import healthRoutes from './routes/health';
import menuRoutes from './routes/menu';

const logger = createLogger('API');

async function buildServer() {
  const fastify = Fastify({
    logger:
      config.NODE_ENV === 'development'
        ? true
        : {
            level: 'info',
          },
  });

  try {
    // Регистрируем Swagger
    await fastify.register(require('@fastify/swagger'), {
      swagger: {
        info: {
          title: 'Shawarma Bot API',
          description: 'REST API для доступа к данным шаурма-бота',
          version: '1.0.0',
          contact: {
            name: 'API Support',
            email: 'support@shawarma-bot.com',
          },
        },
        host:
          config.NODE_ENV === 'production'
            ? 'api.shawarma-bot.com'
            : `localhost:${config.API_PORT}`,
        schemes: [config.NODE_ENV === 'production' ? 'https' : 'http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [
          { name: 'Health', description: 'Health check endpoints' },
          { name: 'Menu', description: 'Menu management endpoints' },
          { name: 'Orders', description: 'Orders management endpoints' },
          { name: 'Analytics', description: 'Analytics and statistics endpoints' },
        ],
        securityDefinitions: {
          apiKey: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
            description: 'API key для доступа к админским функциям',
          },
        },
      },
    });

    // Регистрируем Swagger UI
    await fastify.register(require('@fastify/swagger-ui'), {
      routePrefix: '/api/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
      staticCSP: true,
      transformStaticCSP: (header: string) => header,
      transformSpecification: (swaggerObject: any) => {
        return swaggerObject;
      },
      transformSpecificationClone: true,
    });

    // Регистрируем CORS
    await fastify.register(require('@fastify/cors'), {
      origin: config.CORS_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    });

    // Регистрируем Rate Limiting
    await fastify.register(require('@fastify/rate-limit'), {
      max: config.RATE_LIMIT_PUBLIC,
      timeWindow: '1 minute',
      skipOnError: true,
      keyGenerator: (request: any) => {
        // Разные лимиты для разных типов запросов
        const isAdmin = request.headers.authorization?.startsWith('Bearer ');
        return `${request.ip}-${isAdmin ? 'admin' : 'public'}`;
      },
      errorResponseBuilder: (request: any, context: any) => {
        return {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
            details: {
              limit: context.max,
              window: context.timeWindow,
              remaining: context.remaining,
            },
          },
          timestamp: new Date().toISOString(),
        };
      },
    });

    // Регистрируем Redis (если включен)
    // Временно отключено для отладки
    /*
    if (config.ENABLE_CACHE) {
      try {
        await fastify.register(require('@fastify/redis'), {
          url: config.REDIS_URL,
          connectTimeout: 2000,
          lazyConnect: true
        });
      } catch (error) {
        logger.warn('Redis connection failed, continuing without cache', { error: error instanceof Error ? error.message : error });
      }
    }
    */

    // Регистрируем плагин базы данных
    await fastify.register(databasePlugin);

    // Middleware для логирования запросов
    fastify.addHook('onRequest', async (request, reply) => {
      request.log.info(
        {
          method: request.method,
          url: request.url,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        },
        'Incoming request'
      );
    });

    // Middleware для обработки ошибок
    fastify.setErrorHandler(async (error, request, reply) => {
      request.log.error(error, 'Request error');

      const statusCode = error.statusCode || 500;
      const errorResponse = {
        success: false,
        error: {
          code: error.code || 'INTERNAL_SERVER_ERROR',
          message:
            config.NODE_ENV === 'production' && statusCode === 500
              ? 'Internal server error'
              : error.message,
          ...(config.NODE_ENV === 'development' && { stack: error.stack }),
        },
        timestamp: new Date().toISOString(),
      };

      reply.status(statusCode).send(errorResponse);
    });

    // Middleware для 404 ошибок
    fastify.setNotFoundHandler(async (request, reply) => {
      reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route ${request.method} ${request.url} not found`,
        },
        timestamp: new Date().toISOString(),
      });
    });

    // Регистрируем маршруты
    await fastify.register(healthRoutes, { prefix: config.API_PREFIX });
    await fastify.register(menuRoutes, { prefix: config.API_PREFIX });

    return fastify;
  } catch (error) {
    logger.error('Failed to build server:', {
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

async function startServer() {
  try {
    const server = await buildServer();

    await server.listen({
      port: config.API_PORT,
      host: config.API_HOST,
    });

    logger.info(`🚀 API Server started on ${config.API_HOST}:${config.API_PORT}`);
    logger.info(`📚 Swagger UI available at http://${config.API_HOST}:${config.API_PORT}/api/docs`);

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      try {
        await server.close();
        logger.info('✅ Server closed successfully');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', {
          error: error instanceof Error ? error.message : error,
        });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('❌ Failed to start server:', {
      error: error instanceof Error ? error.message : error,
    });
    process.exit(1);
  }
}

// Запускаем сервер только если файл запущен напрямую
if (require.main === module) {
  startServer();
}

export { buildServer, startServer };
