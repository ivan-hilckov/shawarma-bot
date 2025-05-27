import { CartService } from '../../cart';
import { createLogger } from '../../logger';
import { getItemById } from '../../menu';
import { CartItem } from '../../types';
import { CartAddRequest, CartUpdateRequest } from '../schemas/cart';

const logger = createLogger('CartApiService');

export class CartApiService {
  private cartService: CartService;

  constructor() {
    this.cartService = new CartService();
  }

  async getCart(userId: number): Promise<{ items: CartItem[]; total: number; itemsCount: number }> {
    try {
      const items = await this.cartService.getCart(userId);
      const total = await this.cartService.getCartTotal(userId);
      const itemsCount = await this.cartService.getCartItemsCount(userId);

      return { items, total, itemsCount };
    } catch (error) {
      logger.error('Failed to get cart:', {
        error: error instanceof Error ? error.message : error,
        userId,
      });
      throw new Error('Failed to fetch cart');
    }
  }

  async addToCart(request: CartAddRequest): Promise<void> {
    try {
      const { userId, itemId, quantity } = request;

      // Проверяем существование товара
      const menuItem = getItemById(itemId);
      if (!menuItem) {
        throw new Error(`Menu item with id ${itemId} not found`);
      }

      await this.cartService.addToCart(userId, menuItem, quantity);

      logger.info('Item added to cart:', {
        userId,
        itemId,
        quantity,
        itemName: menuItem.name,
      });
    } catch (error) {
      logger.error('Failed to add item to cart:', {
        error: error instanceof Error ? error.message : error,
        request,
      });
      throw error;
    }
  }

  async updateQuantity(request: CartUpdateRequest): Promise<void> {
    try {
      const { userId, itemId, quantity } = request;

      // Проверяем что товар есть в корзине
      const cart = await this.cartService.getCart(userId);
      const existingItem = cart.find(item => item.menuItem.id === itemId);

      if (!existingItem) {
        throw new Error(`Item with id ${itemId} not found in cart`);
      }

      await this.cartService.updateQuantity(userId, itemId, quantity);

      logger.info('Cart item quantity updated:', {
        userId,
        itemId,
        oldQuantity: existingItem.quantity,
        newQuantity: quantity,
      });
    } catch (error) {
      logger.error('Failed to update cart item quantity:', {
        error: error instanceof Error ? error.message : error,
        request,
      });
      throw error;
    }
  }

  async removeFromCart(userId: number, itemId: string): Promise<void> {
    try {
      // Проверяем что товар есть в корзине
      const cart = await this.cartService.getCart(userId);
      const existingItem = cart.find(item => item.menuItem.id === itemId);

      if (!existingItem) {
        throw new Error(`Item with id ${itemId} not found in cart`);
      }

      await this.cartService.removeFromCart(userId, itemId);

      logger.info('Item removed from cart:', {
        userId,
        itemId,
        itemName: existingItem.menuItem.name,
      });
    } catch (error) {
      logger.error('Failed to remove item from cart:', {
        error: error instanceof Error ? error.message : error,
        userId,
        itemId,
      });
      throw error;
    }
  }

  async clearCart(userId: number): Promise<void> {
    try {
      const cart = await this.cartService.getCart(userId);
      const itemsCount = cart.length;

      await this.cartService.clearCart(userId);

      logger.info('Cart cleared:', {
        userId,
        removedItemsCount: itemsCount,
      });
    } catch (error) {
      logger.error('Failed to clear cart:', {
        error: error instanceof Error ? error.message : error,
        userId,
      });
      throw error;
    }
  }

  async getCartTotal(userId: number): Promise<{ total: number; itemsCount: number }> {
    try {
      const total = await this.cartService.getCartTotal(userId);
      const itemsCount = await this.cartService.getCartItemsCount(userId);

      return { total, itemsCount };
    } catch (error) {
      logger.error('Failed to get cart total:', {
        error: error instanceof Error ? error.message : error,
        userId,
      });
      throw new Error('Failed to fetch cart total');
    }
  }
}
