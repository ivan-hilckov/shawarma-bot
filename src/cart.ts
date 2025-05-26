import { createClient, RedisClientType } from "redis";
import { CartItem, MenuItem } from "./types";
import config from "./config";
import { createLogger } from "./logger";

export class CartService {
  private client: RedisClientType;
  private isConnected: boolean = false;
  private logger = createLogger("CartService");

  constructor() {
    this.client = createClient({
      url: config.REDIS_URL,
    });

    this.client.on("error", (err) => {
      this.logger.error("Redis Client Error", { error: err.message });
    });

    this.client.on("connect", () => {
      this.logger.info("Connected to Redis");
      this.isConnected = true;
    });

    this.client.on("disconnect", () => {
      this.logger.info("Disconnected from Redis");
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  private getCartKey(userId: number): string {
    return `cart:${userId}`;
  }

  async addToCart(userId: number, menuItem: MenuItem, quantity: number = 1): Promise<void> {
    await this.connect();

    const cartKey = this.getCartKey(userId);
    const existingCart = await this.getCart(userId);

    // Проверяем, есть ли уже этот товар в корзине
    const existingItemIndex = existingCart.findIndex((item) => item.menuItem.id === menuItem.id);

    if (existingItemIndex >= 0) {
      // Увеличиваем количество существующего товара
      existingCart[existingItemIndex]!.quantity += quantity;
    } else {
      // Добавляем новый товар
      existingCart.push({ menuItem, quantity });
    }

    await this.client.setEx(cartKey, 3600, JSON.stringify(existingCart)); // TTL 1 час
  }

  async removeFromCart(userId: number, itemId: string): Promise<void> {
    await this.connect();

    const cartKey = this.getCartKey(userId);
    const existingCart = await this.getCart(userId);

    const updatedCart = existingCart.filter((item) => item.menuItem.id !== itemId);

    if (updatedCart.length === 0) {
      await this.client.del(cartKey);
    } else {
      await this.client.setEx(cartKey, 3600, JSON.stringify(updatedCart));
    }
  }

  async updateQuantity(userId: number, itemId: string, quantity: number): Promise<void> {
    await this.connect();

    if (quantity <= 0) {
      await this.removeFromCart(userId, itemId);
      return;
    }

    const cartKey = this.getCartKey(userId);
    const existingCart = await this.getCart(userId);

    const itemIndex = existingCart.findIndex((item) => item.menuItem.id === itemId);

    if (itemIndex >= 0) {
      existingCart[itemIndex]!.quantity = quantity;
      await this.client.setEx(cartKey, 3600, JSON.stringify(existingCart));
    }
  }

  async getCart(userId: number): Promise<CartItem[]> {
    await this.connect();

    const cartKey = this.getCartKey(userId);
    const cartData = await this.client.get(cartKey);

    if (!cartData) {
      return [];
    }

    try {
      return JSON.parse(cartData) as CartItem[];
    } catch (error) {
      this.logger.error("Error parsing cart data", {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return [];
    }
  }

  async clearCart(userId: number): Promise<void> {
    await this.connect();

    const cartKey = this.getCartKey(userId);
    await this.client.del(cartKey);
  }

  async getCartTotal(userId: number): Promise<number> {
    const cart = await this.getCart(userId);
    return cart.reduce((total, item) => total + item.menuItem.price * item.quantity, 0);
  }

  async getCartItemsCount(userId: number): Promise<number> {
    const cart = await this.getCart(userId);
    return cart.reduce((total, item) => total + item.quantity, 0);
  }

  // Метод для получения статистики корзин (для админки)
  async getActiveCartsCount(): Promise<number> {
    await this.connect();

    const keys = await this.client.keys("cart:*");
    return keys.length;
  }
}

// Экспортируем singleton instance
export const cartService = new CartService();
export default cartService;
