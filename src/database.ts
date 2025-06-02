import { Pool, PoolClient } from 'pg';

import config from './config';
import { createLogger } from './logger';
import { CartItem, Order } from './types';

export class DatabaseService {
  private pool: Pool;
  private logger = createLogger('DatabaseService');

  constructor() {
    // Отключаем SSL для Docker окружения (когда DATABASE_URL содержит @postgres:)
    const isDockerEnvironment = config.DATABASE_URL.includes('@postgres:');

    this.pool = new Pool({
      connectionString: config.DATABASE_URL,
      ssl:
        config.NODE_ENV === 'production' && !isDockerEnvironment
          ? { rejectUnauthorized: false }
          : false,
      // Настройки connection pooling
      max: 20, // максимальное количество соединений в пуле
      min: 2, // минимальное количество соединений
      idleTimeoutMillis: 30000, // время ожидания перед закрытием неактивного соединения
      connectionTimeoutMillis: 2000, // время ожидания подключения
      maxUses: 7500, // максимальное количество использований соединения
    });

    this.pool.on('error', err => {
      this.logger.error('PostgreSQL Pool Error', { error: err.message });
    });

    this.pool.on('connect', () => {
      this.logger.info('Connected to PostgreSQL');
    });
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  // Создание или обновление пользователя
  async upsertUser(
    userId: number,
    username?: string,
    firstName?: string,
    lastName?: string
  ): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(
        `
        INSERT INTO users (id, username, first_name, last_name)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          updated_at = CURRENT_TIMESTAMP
      `,
        [userId, username, firstName, lastName]
      );
    } finally {
      client.release();
    }
  }

  // Получение товара по ID из базы данных
  async getMenuItemById(itemId: string): Promise<any | null> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `
        SELECT mi.*, c.name as category_name
        FROM menu_items mi
        JOIN categories c ON mi.category_id = c.id
        WHERE mi.id = $1 AND mi.is_available = true
      `,
        [itemId]
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Создание заказа
  async createOrder(userId: number, cartItems: CartItem[], totalPrice: number): Promise<string> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');

      // Убеждаемся что пользователь существует
      await this.upsertUser(userId);

      // Создаем заказ
      const orderResult = await client.query(
        `
        INSERT INTO orders (user_id, total_price, status)
        VALUES ($1, $2, 'pending')
        RETURNING id
      `,
        [userId, totalPrice]
      );

      const orderId = orderResult.rows[0].id;

      // Добавляем элементы заказа
      for (const cartItem of cartItems) {
        await client.query(
          `
          INSERT INTO order_items (order_id, menu_item_id, quantity, price)
          VALUES ($1, $2, $3, $4)
        `,
          [orderId, cartItem.menuItem.id, cartItem.quantity, cartItem.menuItem.price]
        );
      }

      await client.query('COMMIT');
      return orderId.toString();
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Получение заказа по ID
  async getOrderById(orderId: string): Promise<Order | null> {
    const client = await this.getClient();
    try {
      const orderResult = await client.query(
        `
        SELECT o.*, u.first_name as user_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = $1
      `,
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        return null;
      }

      const orderRow = orderResult.rows[0];

      // Получаем элементы заказа
      const itemsResult = await client.query(
        `
        SELECT oi.*, mi.name, mi.description, c.name as category
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        JOIN categories c ON mi.category_id = c.id
        WHERE oi.order_id = $1
      `,
        [orderId]
      );

      const items: CartItem[] = itemsResult.rows.map(row => ({
        menuItem: {
          id: row.menu_item_id.toString(),
          name: row.name,
          description: row.description,
          price: parseFloat(row.price),
          category: row.category === 'shawarma' ? 'shawarma' : 'drinks',
        },
        quantity: row.quantity,
      }));

      return {
        id: orderRow.id.toString(),
        userId: orderRow.user_id,
        userName: orderRow.user_name || 'Пользователь',
        items,
        totalPrice: parseFloat(orderRow.total_price),
        status: orderRow.status,
        createdAt: orderRow.created_at,
      };
    } finally {
      client.release();
    }
  }

  // Получение заказов пользователя (оптимизированный запрос без N+1)
  async getUserOrders(userId: number, limit: number = 10): Promise<Order[]> {
    const client = await this.getClient();
    try {
      // Получаем все заказы и их элементы одним запросом
      const result = await client.query(
        `
        SELECT
          o.id as order_id,
          o.user_id,
          o.total_price,
          o.status,
          o.created_at,
          u.first_name as user_name,
          oi.menu_item_id,
          oi.quantity,
          oi.price as item_price,
          mi.name as item_name,
          mi.description as item_description,
          c.name as category
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
        LEFT JOIN categories c ON mi.category_id = c.id
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC, oi.id
        LIMIT $2 * 20
      `,
        [userId, limit]
      );

      // Группируем результаты по заказам
      const ordersMap = new Map<string, Order>();

      for (const row of result.rows) {
        const orderId = row.order_id.toString();

        if (!ordersMap.has(orderId)) {
          ordersMap.set(orderId, {
            id: orderId,
            userId: row.user_id,
            userName: row.user_name || 'Пользователь',
            items: [],
            totalPrice: parseFloat(row.total_price),
            status: row.status,
            createdAt: row.created_at,
          });
        }

        // Добавляем элемент заказа, если он существует
        if (row.menu_item_id) {
          const order = ordersMap.get(orderId);
          if (order) {
            order.items.push({
              menuItem: {
                id: row.menu_item_id.toString(),
                name: row.item_name,
                description: row.item_description,
                price: parseFloat(row.item_price),
                category: row.category === 'shawarma' ? 'shawarma' : 'drinks',
              },
              quantity: row.quantity,
            });
          }
        }
      }

      // Возвращаем только нужное количество заказов
      return Array.from(ordersMap.values()).slice(0, limit);
    } finally {
      client.release();
    }
  }

  // Обновление статуса заказа
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const client = await this.getClient();
    try {
      await client.query(
        `
        UPDATE orders
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
        [status, orderId]
      );
    } finally {
      client.release();
    }
  }

  // Получение статистики заказов
  async getOrdersStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
  }> {
    const client = await this.getClient();
    try {
      const result = await client.query(`
        SELECT
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COALESCE(SUM(total_price), 0) as total_revenue
        FROM orders
      `);

      const row = result.rows[0];
      return {
        totalOrders: parseInt(row.total_orders),
        pendingOrders: parseInt(row.pending_orders),
        totalRevenue: parseFloat(row.total_revenue),
      };
    } finally {
      client.release();
    }
  }

  // Проверка подключения к БД
  async testConnection(): Promise<boolean> {
    const client = await this.getClient();
    try {
      await client.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.error('Database connection test failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    } finally {
      client.release();
    }
  }

  // ===== МЕТОДЫ ДЛЯ ЭТАПА 3: ПРОДВИНУТЫЕ УЛУЧШЕНИЯ =====

  // ===== ПЕРСОНАЛЬНЫЕ РЕКОМЕНДАЦИИ =====

  // Получение часто заказываемых товаров пользователя
  async getUserPopularItems(userId: number, limit: number = 5): Promise<any[]> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `
        SELECT
          ua.menu_item_id,
          mi.name,
          mi.description,
          mi.price,
          c.name as category,
          mi.image_url,
          ua.order_count,
          ua.total_spent,
          ua.last_ordered,
          ua.order_count::float / GREATEST(1, EXTRACT(days FROM CURRENT_TIMESTAMP - ua.last_ordered)) as frequency_score
        FROM user_analytics ua
        JOIN menu_items mi ON ua.menu_item_id = mi.id
        JOIN categories c ON mi.category_id = c.id
        WHERE ua.user_id = $1 AND mi.is_available = true AND ua.order_count >= 2
        ORDER BY ua.order_count DESC, ua.last_ordered DESC
        LIMIT $2
      `,
        [userId, limit]
      );

      return result.rows.map(row => ({
        type: 'frequent',
        menuItem: {
          id: row.menu_item_id.toString(),
          name: row.name,
          description: row.description,
          price: parseFloat(row.price),
          category: row.category === 'shawarma' ? 'shawarma' : 'drinks',
          photo: row.image_url,
        },
        reason: `Вы заказывали ${row.order_count} раз`,
        priority: row.order_count,
      }));
    } finally {
      client.release();
    }
  }

  // Получение популярных товаров по времени суток
  async getTimeBasedRecommendations(userId: number, limit: number = 3): Promise<any[]> {
    const client = await this.getClient();
    try {
      const currentHour = new Date().getHours();
      let categoryPreference = 'shawarma';
      let timeMessage = '';

      if (currentHour >= 7 && currentHour <= 11) {
        categoryPreference = 'drinks';
        timeMessage = 'Доброе утро! Как насчет напитка?';
      } else if (currentHour >= 12 && currentHour <= 16) {
        categoryPreference = 'shawarma';
        timeMessage = 'Время обеда! Попробуйте нашу шаурму';
      } else if (currentHour >= 17 && currentHour <= 22) {
        categoryPreference = 'shawarma';
        timeMessage = 'Вечерний перекус? У нас есть отличные варианты';
      } else {
        categoryPreference = 'drinks';
        timeMessage = 'Поздний перекус? Возьмите напиток';
      }

      const result = await client.query(
        `
        SELECT
          mi.id as menu_item_id,
          mi.name,
          mi.description,
          mi.price,
          c.name as category,
          mi.image_url,
          COUNT(oi.id) as popularity
        FROM menu_items mi
        JOIN categories c ON mi.category_id = c.id
        LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE c.name = $1 AND mi.is_available = true
          AND (o.created_at IS NULL OR EXTRACT(hour FROM o.created_at) BETWEEN $2 AND $3)
        GROUP BY mi.id, mi.name, mi.description, mi.price, c.name, mi.image_url
        ORDER BY popularity DESC, mi.price ASC
        LIMIT $4
      `,
        [categoryPreference, Math.max(0, currentHour - 2), Math.min(23, currentHour + 2), limit]
      );

      return result.rows.map(row => ({
        type: 'time_based',
        menuItem: {
          id: row.menu_item_id.toString(),
          name: row.name,
          description: row.description,
          price: parseFloat(row.price),
          category: row.category === 'shawarma' ? 'shawarma' : 'drinks',
          photo: row.image_url,
        },
        reason: timeMessage,
        priority: parseInt(row.popularity) || 0,
      }));
    } finally {
      client.release();
    }
  }

  // Получение общих рекомендаций для пользователя
  async getUserRecommendations(userId: number): Promise<any[]> {
    const recommendations: any[] = [];

    try {
      // Добавляем часто заказываемые товары
      const popularItems = await this.getUserPopularItems(userId, 3);
      recommendations.push(...popularItems);

      // Добавляем рекомендации по времени
      const timeBasedItems = await this.getTimeBasedRecommendations(userId, 2);
      recommendations.push(...timeBasedItems);

      // Сортируем по приоритету
      return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 5);
    } catch (error) {
      this.logger.error('Error getting user recommendations', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  // ===== АНАЛИТИКА =====

  // Получение статистики пользователя
  async getUserStats(userId: number): Promise<{
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
  }> {
    const client = await this.getClient();
    try {
      const result = await client.query(
        `
        SELECT
          COUNT(DISTINCT o.id) as total_orders,
          COALESCE(SUM(o.total_price), 0) as total_spent,
          COALESCE(AVG(o.total_price), 0) as avg_order_value
        FROM orders o
        WHERE o.user_id = $1
      `,
        [userId]
      );

      const stats = result.rows[0];

      return {
        totalOrders: parseInt(stats.total_orders),
        totalSpent: parseFloat(stats.total_spent),
        avgOrderValue: parseFloat(stats.avg_order_value),
      };
    } finally {
      client.release();
    }
  }
}

// Экспортируем singleton instance
export const databaseService = new DatabaseService();
export default databaseService;
