import axios, { AxiosInstance } from 'axios';

import config from './config';
import { createLogger } from './logger';
import { CartItem, MenuItem, Order } from './types';

const logger = createLogger('BotApiClient');

export class BotApiClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.API_BASE_URL || `http://localhost:${config.API_PORT}/api`;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: parseInt(process.env.API_TIMEOUT || '5000'),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Добавляем логирование запросов
    this.client.interceptors.request.use(
      (config: any) => {
        logger.debug('API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
        });
        return config;
      },
      (error: any) => {
        logger.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Добавляем логирование ответов
    this.client.interceptors.response.use(
      (response: any) => {
        logger.debug('API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      (error: any) => {
        logger.error('API Response Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  // ===== CART API =====

  async getCart(userId: number): Promise<CartItem[]> {
    try {
      const response = await this.client.get(`/cart/${userId}`);
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to get cart:', { userId, error });
      throw new Error('Failed to fetch cart');
    }
  }

  async addToCart(userId: number, itemId: string, quantity: number = 1): Promise<void> {
    try {
      await this.client.post('/cart/add', {
        userId,
        itemId,
        quantity,
      });
    } catch (error) {
      logger.error('Failed to add to cart:', { userId, itemId, quantity, error });
      throw new Error('Failed to add item to cart');
    }
  }

  async updateCartQuantity(userId: number, itemId: string, quantity: number): Promise<void> {
    try {
      await this.client.put('/cart/update', {
        userId,
        itemId,
        quantity,
      });
    } catch (error) {
      logger.error('Failed to update cart quantity:', { userId, itemId, quantity, error });
      throw new Error('Failed to update cart item quantity');
    }
  }

  async removeFromCart(userId: number, itemId: string): Promise<void> {
    try {
      await this.client.delete(`/cart/remove/${userId}/${itemId}`);
    } catch (error) {
      logger.error('Failed to remove from cart:', { userId, itemId, error });
      throw new Error('Failed to remove item from cart');
    }
  }

  async clearCart(userId: number): Promise<void> {
    try {
      await this.client.delete(`/cart/clear/${userId}`);
    } catch (error) {
      logger.error('Failed to clear cart:', { userId, error });
      throw new Error('Failed to clear cart');
    }
  }

  async getCartTotal(userId: number): Promise<{ total: number; itemsCount: number }> {
    try {
      const response = await this.client.get(`/cart/${userId}/total`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get cart total:', { userId, error });
      throw new Error('Failed to fetch cart total');
    }
  }

  // ===== MENU API =====

  async getMenuByCategory(category?: string): Promise<MenuItem[]> {
    try {
      const params = category ? { category_id: this.getCategoryId(category) } : {};
      const response = await this.client.get('/menu/items', { params });
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to get menu:', { category, error });
      throw new Error('Failed to fetch menu');
    }
  }

  async getMenuItemById(itemId: string): Promise<MenuItem | null> {
    try {
      const response = await this.client.get(`/menu/items/${itemId}`);
      return response.data.data || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.error('Failed to get menu item:', { itemId, error });
      throw new Error('Failed to fetch menu item');
    }
  }

  // ===== USERS API (будет реализовано позже) =====

  async upsertUser(
    userId: number,
    username?: string,
    firstName?: string,
    lastName?: string
  ): Promise<void> {
    try {
      // Пока используем прямой вызов к базе, позже заменим на API
      const databaseService = await import('./database');
      await databaseService.default.upsertUser(userId, username, firstName, lastName);
    } catch (error) {
      logger.error('Failed to upsert user:', { userId, username, firstName, error });
      throw new Error('Failed to create or update user');
    }
  }

  // ===== ORDERS API =====

  async createOrder(userId: number, cartItems: CartItem[], totalPrice: number): Promise<string> {
    try {
      // Пока используем прямой вызов к базе, позже заменим на API
      const databaseService = await import('./database');
      return await databaseService.default.createOrder(userId, cartItems, totalPrice);
    } catch (error) {
      logger.error('Failed to create order:', { userId, totalPrice, error });
      throw new Error('Failed to create order');
    }
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      // Пока используем прямой вызов к базе, позже заменим на API
      const databaseService = await import('./database');
      return await databaseService.default.getOrderById(orderId);
    } catch (error) {
      logger.error('Failed to get order:', { orderId, error });
      throw new Error('Failed to fetch order');
    }
  }

  async getUserOrders(userId: number, limit: number = 10): Promise<Order[]> {
    try {
      // Пока используем прямой вызов к базе, позже заменим на API
      const databaseService = await import('./database');
      return await databaseService.default.getUserOrders(userId, limit);
    } catch (error) {
      logger.error('Failed to get user orders:', { userId, limit, error });
      throw new Error('Failed to fetch user orders');
    }
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    try {
      // Пока используем прямой вызов к базе, позже заменим на API
      const databaseService = await import('./database');
      await databaseService.default.updateOrderStatus(orderId, status);
    } catch (error) {
      logger.error('Failed to update order status:', { orderId, status, error });
      throw new Error('Failed to update order status');
    }
  }

  // ===== HELPER METHODS =====

  private getCategoryId(category: string): number {
    // Маппинг категорий на ID (пока хардкод, позже получим из API)
    const categoryMap: { [key: string]: number } = {
      shawarma: 1,
      drinks: 2,
    };
    return categoryMap[category] || 1;
  }

  // Проверка доступности API
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch (error: any) {
      logger.error('API health check failed:', error);
      return false;
    }
  }
}

// Экспортируем singleton instance
export const botApiClient = new BotApiClient();
export default botApiClient;
