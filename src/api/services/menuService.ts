import { Pool } from 'pg';
import { createLogger } from '../../logger';
import { Category, MenuItem, MenuItemDetail, MenuItemsQuery } from '../schemas/menu';

const logger = createLogger('MenuService');

export class MenuService {
  constructor(private db: Pool) {}

  async getCategories(): Promise<Category[]> {
    try {
      const query = `
        SELECT
          c.id,
          c.name,
          c.description,
          c.emoji,
          COUNT(mi.id) as items_count,
          c.created_at
        FROM categories c
        LEFT JOIN menu_items mi ON c.id = mi.category_id AND mi.is_available = true
        GROUP BY c.id, c.name, c.description, c.emoji, c.created_at
        ORDER BY c.id
      `;

      const result = await this.db.query(query);

      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        emoji: row.emoji,
        items_count: parseInt(row.items_count),
        created_at: row.created_at.toISOString(),
      }));
    } catch (error) {
      logger.error('Failed to get categories:', {
        error: error instanceof Error ? error.message : error,
      });
      throw new Error('Failed to fetch categories');
    }
  }

  async getMenuItems(filters: MenuItemsQuery): Promise<{ items: MenuItem[]; total: number }> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Фильтр по категории
      if (filters.category_id) {
        conditions.push(`mi.category_id = $${paramIndex}`);
        params.push(filters.category_id);
        paramIndex++;
      }

      // Фильтр по доступности
      if (filters.available !== undefined) {
        conditions.push(`mi.is_available = $${paramIndex}`);
        params.push(filters.available);
        paramIndex++;
      }

      // Фильтр по минимальной цене
      if (filters.min_price) {
        conditions.push(`mi.price >= $${paramIndex}`);
        params.push(filters.min_price);
        paramIndex++;
      }

      // Фильтр по максимальной цене
      if (filters.max_price) {
        conditions.push(`mi.price <= $${paramIndex}`);
        params.push(filters.max_price);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Запрос для подсчета общего количества
      const countQuery = `
        SELECT COUNT(*) as total
        FROM menu_items mi
        JOIN categories c ON mi.category_id = c.id
        ${whereClause}
      `;

      // Запрос для получения данных с пагинацией
      const dataQuery = `
        SELECT
          mi.id,
          mi.name,
          mi.description,
          mi.price,
          mi.image_url,
          mi.is_available,
          mi.created_at,
          mi.updated_at,
          c.id as category_id,
          c.name as category_name,
          c.emoji as category_emoji
        FROM menu_items mi
        JOIN categories c ON mi.category_id = c.id
        ${whereClause}
        ORDER BY mi.id
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(filters.limit, filters.offset);

      const [countResult, dataResult] = await Promise.all([
        this.db.query(countQuery, params.slice(0, -2)),
        this.db.query(dataQuery, params),
      ]);

      const total = parseInt(countResult.rows[0].total);
      const items = dataResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        price: parseFloat(row.price),
        category: {
          id: row.category_id,
          name: row.category_name,
          emoji: row.category_emoji,
        },
        image_url: row.image_url || undefined,
        is_available: row.is_available,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      }));

      return { items, total };
    } catch (error) {
      logger.error('Failed to get menu items:', {
        error: error instanceof Error ? error.message : error,
      });
      throw new Error('Failed to fetch menu items');
    }
  }

  async getMenuItemById(id: number): Promise<MenuItemDetail | null> {
    try {
      const query = `
        SELECT
          mi.id,
          mi.name,
          mi.description,
          mi.price,
          mi.image_url,
          mi.is_available,
          mi.created_at,
          mi.updated_at,
          c.id as category_id,
          c.name as category_name,
          c.emoji as category_emoji,
          COALESCE(SUM(oi.quantity), 0) as total_ordered,
          COUNT(DISTINCT oi.order_id) as orders_count
        FROM menu_items mi
        JOIN categories c ON mi.category_id = c.id
        LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
        WHERE mi.id = $1
        GROUP BY mi.id, mi.name, mi.description, mi.price, mi.image_url,
                 mi.is_available, mi.created_at, mi.updated_at,
                 c.id, c.name, c.emoji
      `;

      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        price: parseFloat(row.price),
        category: {
          id: row.category_id,
          name: row.category_name,
          emoji: row.category_emoji,
        },
        image_url: row.image_url || undefined,
        is_available: row.is_available,
        stats: {
          total_ordered: parseInt(row.total_ordered),
          orders_count: parseInt(row.orders_count),
          avg_rating: undefined, // TODO: добавить рейтинги в будущем
        },
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get menu item by id:', {
        error: error instanceof Error ? error.message : error,
      });
      throw new Error('Failed to fetch menu item');
    }
  }
}
