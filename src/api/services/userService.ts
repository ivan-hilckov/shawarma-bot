import { Pool } from 'pg';

import { createLogger } from '../../logger';
import { UserUpsertRequest, UserOrdersQuery } from '../schemas/users';

const logger = createLogger('UserService');

export interface User {
  id: number;
  username?: string;
  firstName: string;
  lastName?: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  avgOrdersPerUser: number;
  avgSpentPerUser: number;
  topSpenders: Array<{
    id: number;
    firstName: string;
    username?: string;
    totalSpent: number;
    ordersCount: number;
  }>;
}

export class UserService {
  constructor(private db: Pool) {}

  async upsertUser(userData: UserUpsertRequest): Promise<User> {
    try {
      const { id, username, firstName, lastName } = userData;

      const result = await this.db.query(
        `
        INSERT INTO users (id, username, first_name, last_name)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
        `,
        [id, username, firstName, lastName]
      );

      const user = result.rows[0];

      // Получаем статистику заказов пользователя
      const statsResult = await this.db.query(
        `
        SELECT
          COUNT(o.id) as orders_count,
          COALESCE(SUM(o.total_price), 0) as total_spent,
          MAX(o.created_at) as last_order_date
        FROM orders o
        WHERE o.user_id = $1
        `,
        [id]
      );

      const stats = statsResult.rows[0];

      return {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        ordersCount: parseInt(stats.orders_count),
        totalSpent: parseFloat(stats.total_spent),
        lastOrderDate: stats.last_order_date,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };
    } catch (error) {
      logger.error('Failed to upsert user:', {
        error: error instanceof Error ? error.message : error,
        userData,
      });
      throw new Error('Failed to create or update user');
    }
  }

  async getUserById(id: number): Promise<User | null> {
    try {
      const userResult = await this.db.query(
        `
        SELECT * FROM users WHERE id = $1
        `,
        [id]
      );

      if (userResult.rows.length === 0) {
        return null;
      }

      const user = userResult.rows[0];

      // Получаем статистику заказов пользователя
      const statsResult = await this.db.query(
        `
        SELECT
          COUNT(o.id) as orders_count,
          COALESCE(SUM(o.total_price), 0) as total_spent,
          MAX(o.created_at) as last_order_date
        FROM orders o
        WHERE o.user_id = $1
        `,
        [id]
      );

      const stats = statsResult.rows[0];

      return {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        ordersCount: parseInt(stats.orders_count),
        totalSpent: parseFloat(stats.total_spent),
        lastOrderDate: stats.last_order_date,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };
    } catch (error) {
      logger.error('Failed to get user by id:', {
        error: error instanceof Error ? error.message : error,
        id,
      });
      throw new Error('Failed to fetch user');
    }
  }

  async getUserOrders(userId: number, query: UserOrdersQuery) {
    try {
      const conditions: string[] = ['o.user_id = $1'];
      const params: any[] = [userId];
      let paramIndex = 2;

      // Фильтр по статусу
      if (query.status) {
        conditions.push(`o.status = $${paramIndex}`);
        params.push(query.status);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      // Запрос для подсчета общего количества
      const countQuery = `
        SELECT COUNT(*) as total
        FROM orders o
        WHERE ${whereClause}
      `;

      // Запрос для получения данных с пагинацией
      const dataQuery = `
        SELECT
          o.id,
          o.status,
          o.total_price,
          o.created_at,
          o.updated_at,
          COUNT(oi.id) as items_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE ${whereClause}
        GROUP BY o.id, o.status, o.total_price, o.created_at, o.updated_at
        ORDER BY o.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(query.limit, query.offset);

      const [countResult, dataResult] = await Promise.all([
        this.db.query(countQuery, params.slice(0, -2)),
        this.db.query(dataQuery, params),
      ]);

      const total = parseInt(countResult.rows[0].total);
      const orders = dataResult.rows.map(row => ({
        id: row.id,
        status: row.status,
        totalPrice: parseFloat(row.total_price),
        itemsCount: parseInt(row.items_count),
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      }));

      return { orders, total };
    } catch (error) {
      logger.error('Failed to get user orders:', {
        error: error instanceof Error ? error.message : error,
        userId,
        query,
      });
      throw new Error('Failed to fetch user orders');
    }
  }

  async getUsers(filters: {
    limit: number;
    offset: number;
  }): Promise<{ users: User[]; total: number }> {
    try {
      // Запрос для подсчета общего количества
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users
      `;

      // Запрос для получения пользователей с статистикой
      const dataQuery = `
        SELECT
          u.*,
          COUNT(o.id) as orders_count,
          COALESCE(SUM(o.total_price), 0) as total_spent,
          MAX(o.created_at) as last_order_date
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        GROUP BY u.id, u.username, u.first_name, u.last_name, u.created_at, u.updated_at
        ORDER BY u.created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const [countResult, dataResult] = await Promise.all([
        this.db.query(countQuery),
        this.db.query(dataQuery, [filters.limit, filters.offset]),
      ]);

      const total = parseInt(countResult.rows[0].total);
      const users = dataResult.rows.map(row => ({
        id: row.id,
        username: row.username,
        firstName: row.first_name,
        lastName: row.last_name,
        ordersCount: parseInt(row.orders_count),
        totalSpent: parseFloat(row.total_spent),
        lastOrderDate: row.last_order_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return { users, total };
    } catch (error) {
      logger.error('Failed to get users:', {
        error: error instanceof Error ? error.message : error,
        filters,
      });
      throw new Error('Failed to fetch users');
    }
  }

  async getUserStats(): Promise<UserStats> {
    try {
      // Общая статистика пользователей
      const overallStatsQuery = `
        SELECT
          COUNT(*) as total_users,
          COUNT(CASE WHEN last_order.last_order_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as active_users
        FROM users u
        LEFT JOIN (
          SELECT user_id, MAX(created_at) as last_order_date
          FROM orders
          GROUP BY user_id
        ) last_order ON u.id = last_order.user_id
      `;

      // Новые пользователи
      const newUsersQuery = `
        SELECT
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as new_users_today,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_users_this_week,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_this_month
        FROM users
      `;

      // Средние показатели
      const avgStatsQuery = `
        SELECT
          COALESCE(AVG(user_stats.orders_count), 0) as avg_orders_per_user,
          COALESCE(AVG(user_stats.total_spent), 0) as avg_spent_per_user
        FROM (
          SELECT
            u.id,
            COUNT(o.id) as orders_count,
            COALESCE(SUM(o.total_price), 0) as total_spent
          FROM users u
          LEFT JOIN orders o ON u.id = o.user_id
          GROUP BY u.id
        ) user_stats
      `;

      // Топ покупатели
      const topSpendersQuery = `
        SELECT
          u.id,
          u.first_name,
          u.username,
          COUNT(o.id) as orders_count,
          COALESCE(SUM(o.total_price), 0) as total_spent
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        GROUP BY u.id, u.first_name, u.username
        HAVING COUNT(o.id) > 0
        ORDER BY total_spent DESC
        LIMIT 10
      `;

      const [overallResult, newUsersResult, avgStatsResult, topSpendersResult] = await Promise.all([
        this.db.query(overallStatsQuery),
        this.db.query(newUsersQuery),
        this.db.query(avgStatsQuery),
        this.db.query(topSpendersQuery),
      ]);

      const overallStats = overallResult.rows[0];
      const newUsersStats = newUsersResult.rows[0];
      const avgStats = avgStatsResult.rows[0];

      const topSpenders = topSpendersResult.rows.map(row => ({
        id: row.id,
        firstName: row.first_name,
        username: row.username,
        totalSpent: parseFloat(row.total_spent),
        ordersCount: parseInt(row.orders_count),
      }));

      return {
        totalUsers: parseInt(overallStats.total_users),
        activeUsers: parseInt(overallStats.active_users),
        newUsersToday: parseInt(newUsersStats.new_users_today),
        newUsersThisWeek: parseInt(newUsersStats.new_users_this_week),
        newUsersThisMonth: parseInt(newUsersStats.new_users_this_month),
        avgOrdersPerUser: parseFloat(avgStats.avg_orders_per_user),
        avgSpentPerUser: parseFloat(avgStats.avg_spent_per_user),
        topSpenders,
      };
    } catch (error) {
      logger.error('Failed to get user stats:', {
        error: error instanceof Error ? error.message : error,
      });
      throw new Error('Failed to fetch user statistics');
    }
  }
}
