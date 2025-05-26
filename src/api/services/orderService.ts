import { Pool } from 'pg';

import { createLogger } from '../../logger';
import { Order, OrderDetail, OrdersQuery, OrderStats } from '../schemas/orders';

const logger = createLogger('OrderService');

export class OrderService {
  constructor(private db: Pool) {}

  async getOrders(filters: OrdersQuery): Promise<{ orders: Order[]; total: number }> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Фильтр по статусу
      if (filters.status) {
        conditions.push(`o.status = $${paramIndex}`);
        params.push(filters.status);
        paramIndex++;
      }

      // Фильтр по пользователю
      if (filters.user_id) {
        conditions.push(`o.user_id = $${paramIndex}`);
        params.push(filters.user_id);
        paramIndex++;
      }

      // Фильтр по дате от
      if (filters.date_from) {
        conditions.push(`o.created_at >= $${paramIndex}`);
        params.push(filters.date_from);
        paramIndex++;
      }

      // Фильтр по дате до
      if (filters.date_to) {
        conditions.push(`o.created_at <= $${paramIndex}`);
        params.push(filters.date_to);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Запрос для подсчета общего количества
      const countQuery = `
        SELECT COUNT(*) as total
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ${whereClause}
      `;

      // Запрос для получения данных с пагинацией
      const dataQuery = `
        SELECT
          o.id,
          o.status,
          o.total_price,
          o.created_at,
          o.updated_at,
          u.id as user_id,
          u.first_name,
          u.last_name,
          u.username,
          COUNT(oi.id) as items_count
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        ${whereClause}
        GROUP BY o.id, o.status, o.total_price, o.created_at, o.updated_at,
                 u.id, u.first_name, u.last_name, u.username
        ORDER BY o.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(filters.limit, filters.offset);

      const [countResult, dataResult] = await Promise.all([
        this.db.query(countQuery, params.slice(0, -2)),
        this.db.query(dataQuery, params),
      ]);

      const total = parseInt(countResult.rows[0].total);
      const orders = dataResult.rows.map(row => ({
        id: row.id,
        user: {
          id: row.user_id,
          first_name: row.first_name,
          last_name: row.last_name || undefined,
          username: row.username || undefined,
        },
        status: row.status,
        total_price: parseFloat(row.total_price),
        items_count: parseInt(row.items_count),
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      }));

      return { orders, total };
    } catch (error) {
      logger.error('Failed to get orders:', {
        error: error instanceof Error ? error.message : error,
      });
      throw new Error('Failed to fetch orders');
    }
  }

  async getOrderById(id: number): Promise<OrderDetail | null> {
    try {
      // Получаем основную информацию о заказе
      const orderQuery = `
        SELECT
          o.id,
          o.status,
          o.total_price,
          o.created_at,
          o.updated_at,
          u.id as user_id,
          u.first_name,
          u.last_name,
          u.username
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = $1
      `;

      // Получаем товары заказа
      const itemsQuery = `
        SELECT
          oi.id,
          oi.quantity,
          oi.price,
          oi.quantity * oi.price as subtotal,
          mi.id as menu_item_id,
          mi.name as menu_item_name,
          mi.price as current_price
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = $1
        ORDER BY oi.id
      `;

      const [orderResult, itemsResult] = await Promise.all([
        this.db.query(orderQuery, [id]),
        this.db.query(itemsQuery, [id]),
      ]);

      if (orderResult.rows.length === 0) {
        return null;
      }

      const orderRow = orderResult.rows[0];
      const items = itemsResult.rows.map(row => ({
        id: row.id,
        menu_item: {
          id: row.menu_item_id,
          name: row.menu_item_name,
          price: parseFloat(row.current_price),
        },
        quantity: row.quantity,
        price: parseFloat(row.price),
        subtotal: parseFloat(row.subtotal),
      }));

      return {
        id: orderRow.id,
        user: {
          id: orderRow.user_id,
          first_name: orderRow.first_name,
          last_name: orderRow.last_name || undefined,
          username: orderRow.username || undefined,
        },
        status: orderRow.status,
        total_price: parseFloat(orderRow.total_price),
        items_count: items.length,
        items,
        created_at: orderRow.created_at.toISOString(),
        updated_at: orderRow.updated_at.toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get order by id:', {
        error: error instanceof Error ? error.message : error,
      });
      throw new Error('Failed to fetch order');
    }
  }

  async getOrderStats(): Promise<OrderStats> {
    try {
      // Статистика по статусам заказов
      const statusStatsQuery = `
        SELECT
          status,
          COUNT(*) as count,
          COALESCE(SUM(total_price), 0) as revenue
        FROM orders
        GROUP BY status
      `;

      // Общая статистика
      const overallStatsQuery = `
        SELECT
          COUNT(*) as total_orders,
          COALESCE(SUM(total_price), 0) as total_revenue,
          COALESCE(AVG(total_price), 0) as avg_order_value
        FROM orders
      `;

      // Статистика за сегодня
      const todayStatsQuery = `
        SELECT
          COUNT(*) as orders_today,
          COALESCE(SUM(total_price), 0) as revenue_today
        FROM orders
        WHERE DATE(created_at) = CURRENT_DATE
      `;

      // Популярные товары
      const popularItemsQuery = `
        SELECT
          mi.id as item_id,
          mi.name,
          SUM(oi.quantity) as total_ordered,
          SUM(oi.quantity * oi.price) as revenue
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        GROUP BY mi.id, mi.name
        ORDER BY total_ordered DESC
        LIMIT 10
      `;

      const [statusResult, overallResult, todayResult, popularResult] = await Promise.all([
        this.db.query(statusStatsQuery),
        this.db.query(overallStatsQuery),
        this.db.query(todayStatsQuery),
        this.db.query(popularItemsQuery),
      ]);

      // Инициализируем счетчики статусов
      const statusCounts = {
        pending: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        delivered: 0,
      };

      // Заполняем статистику по статусам
      statusResult.rows.forEach(row => {
        if (row.status in statusCounts) {
          statusCounts[row.status as keyof typeof statusCounts] = parseInt(row.count);
        }
      });

      const overallStats = overallResult.rows[0];
      const todayStats = todayResult.rows[0];

      const popularItems = popularResult.rows.map(row => ({
        item_id: row.item_id,
        name: row.name,
        total_ordered: parseInt(row.total_ordered),
        revenue: parseFloat(row.revenue),
      }));

      return {
        total_orders: parseInt(overallStats.total_orders),
        pending_orders: statusCounts.pending,
        confirmed_orders: statusCounts.confirmed,
        preparing_orders: statusCounts.preparing,
        ready_orders: statusCounts.ready,
        delivered_orders: statusCounts.delivered,
        total_revenue: parseFloat(overallStats.total_revenue),
        avg_order_value: parseFloat(overallStats.avg_order_value),
        orders_today: parseInt(todayStats.orders_today),
        revenue_today: parseFloat(todayStats.revenue_today),
        popular_items: popularItems,
      };
    } catch (error) {
      logger.error('Failed to get order stats:', {
        error: error instanceof Error ? error.message : error,
      });
      throw new Error('Failed to fetch order statistics');
    }
  }
}
