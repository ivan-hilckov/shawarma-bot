import { Pool, PoolClient } from "pg";
import { CartItem, Order } from "./types";
import config from "./config";

class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.DATABASE_URL,
      ssl: config.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });

    this.pool.on("error", (err) => {
      console.error("PostgreSQL Pool Error:", err);
    });

    this.pool.on("connect", () => {
      console.log("Connected to PostgreSQL");
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
      await client.query("BEGIN");

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

      await client.query("COMMIT");
      return orderId.toString();
    } catch (error) {
      await client.query("ROLLBACK");
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

      const items: CartItem[] = itemsResult.rows.map((row) => ({
        menuItem: {
          id: row.menu_item_id.toString(),
          name: row.name,
          description: row.description,
          price: parseFloat(row.price),
          category: row.category === "shawarma" ? "shawarma" : "drinks",
        },
        quantity: row.quantity,
      }));

      return {
        id: orderRow.id.toString(),
        userId: orderRow.user_id,
        userName: orderRow.user_name || "Пользователь",
        items,
        totalPrice: parseFloat(orderRow.total_price),
        status: orderRow.status,
        createdAt: orderRow.created_at,
      };
    } finally {
      client.release();
    }
  }

  // Получение заказов пользователя
  async getUserOrders(userId: number, limit: number = 10): Promise<Order[]> {
    const client = await this.getClient();
    try {
      const ordersResult = await client.query(
        `
        SELECT o.*, u.first_name as user_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC
        LIMIT $2
      `,
        [userId, limit]
      );

      const orders: Order[] = [];

      for (const orderRow of ordersResult.rows) {
        // Получаем элементы для каждого заказа
        const itemsResult = await client.query(
          `
          SELECT oi.*, mi.name, mi.description, c.name as category
          FROM order_items oi
          JOIN menu_items mi ON oi.menu_item_id = mi.id
          JOIN categories c ON mi.category_id = c.id
          WHERE oi.order_id = $1
        `,
          [orderRow.id]
        );

        const items: CartItem[] = itemsResult.rows.map((row) => ({
          menuItem: {
            id: row.menu_item_id.toString(),
            name: row.name,
            description: row.description,
            price: parseFloat(row.price),
            category: row.category === "shawarma" ? "shawarma" : "drinks",
          },
          quantity: row.quantity,
        }));

        orders.push({
          id: orderRow.id.toString(),
          userId: orderRow.user_id,
          userName: orderRow.user_name || "Пользователь",
          items,
          totalPrice: parseFloat(orderRow.total_price),
          status: orderRow.status,
          createdAt: orderRow.created_at,
        });
      }

      return orders;
    } finally {
      client.release();
    }
  }

  // Обновление статуса заказа
  async updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
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
      await client.query("SELECT 1");
      return true;
    } catch (error) {
      console.error("Database connection test failed:", error);
      return false;
    } finally {
      client.release();
    }
  }
}

// Экспортируем класс и singleton instance
export { DatabaseService };
export const databaseService = new DatabaseService();
export default databaseService;
