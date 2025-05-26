import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Pool } from 'pg';

import config from '../../config';
import { createLogger } from '../../logger';

const logger = createLogger('Database');

declare module 'fastify' {
  interface FastifyInstance {
    db: Pool;
  }
}

const databasePlugin: FastifyPluginAsync = async fastify => {
  const pool = new Pool({
    connectionString: config.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Проверяем подключение
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', {
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }

  // Добавляем pool в fastify instance
  fastify.decorate('db', pool);

  // Закрываем pool при завершении работы
  fastify.addHook('onClose', async () => {
    await pool.end();
    logger.info('🔌 Database connection closed');
  });
};

export default fp(databasePlugin, {
  name: 'database',
});
