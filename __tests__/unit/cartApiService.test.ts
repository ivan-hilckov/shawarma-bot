import { CartApiService } from '../../src/api/services/cartApiService';
import { CartService } from '../../src/cart';
import { CartAddRequest, CartUpdateRequest } from '../../src/api/schemas/cart';
import { CartItem, MenuItem } from '../../src/types';

// Mock dependencies
jest.mock('../../src/cart');
jest.mock('../../src/menu', () => ({
  getItemById: jest.fn(),
}));
jest.mock('../../src/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

const { getItemById } = require('../../src/menu');

describe('CartApiService', () => {
  let cartApiService: CartApiService;
  let mockCartService: jest.Mocked<CartService>;

  beforeEach(() => {
    // Create mock cart service
    mockCartService = {
      getCart: jest.fn(),
      addToCart: jest.fn(),
      updateQuantity: jest.fn(),
      removeFromCart: jest.fn(),
      clearCart: jest.fn(),
      getCartTotal: jest.fn(),
      getCartItemsCount: jest.fn(),
    } as any;

    // Mock the CartService constructor
    (CartService as jest.Mock).mockImplementation(() => mockCartService);

    cartApiService = new CartApiService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should get cart with items, total and count', async () => {
      const mockCartItems: CartItem[] = [
        {
          quantity: 2,
          menuItem: {
            id: 'item1',
            name: 'Test Item',
            price: 100,
            description: 'Test description',
            category: 'shawarma',
          },
        },
      ];

      mockCartService.getCart.mockResolvedValue(mockCartItems);
      mockCartService.getCartTotal.mockResolvedValue(200);
      mockCartService.getCartItemsCount.mockResolvedValue(2);

      const result = await cartApiService.getCart(123);

      expect(mockCartService.getCart).toHaveBeenCalledWith(123);
      expect(mockCartService.getCartTotal).toHaveBeenCalledWith(123);
      expect(mockCartService.getCartItemsCount).toHaveBeenCalledWith(123);

      expect(result).toEqual({
        items: mockCartItems,
        total: 200,
        itemsCount: 2,
      });
    });

    it('should throw error when cart service fails', async () => {
      mockCartService.getCart.mockRejectedValue(new Error('Service error'));

      await expect(cartApiService.getCart(123)).rejects.toThrow('Failed to fetch cart');
    });
  });

  describe('addToCart', () => {
    const mockMenuItem: MenuItem = {
      id: 'item1',
      name: 'Test Item',
      price: 100,
      description: 'Test description',
      category: 'shawarma',
    };

    const mockRequest: CartAddRequest = {
      userId: 123,
      itemId: 'item1',
      quantity: 2,
    };

    it('should add item to cart successfully', async () => {
      getItemById.mockReturnValue(mockMenuItem);
      mockCartService.addToCart.mockResolvedValue(undefined);

      await cartApiService.addToCart(mockRequest);

      expect(getItemById).toHaveBeenCalledWith('item1');
      expect(mockCartService.addToCart).toHaveBeenCalledWith(123, mockMenuItem, 2);
    });

    it('should throw error when menu item not found', async () => {
      getItemById.mockReturnValue(null);

      await expect(cartApiService.addToCart(mockRequest)).rejects.toThrow(
        'Menu item with id item1 not found'
      );

      expect(mockCartService.addToCart).not.toHaveBeenCalled();
    });

    it('should throw error when cart service fails', async () => {
      getItemById.mockReturnValue(mockMenuItem);
      mockCartService.addToCart.mockRejectedValue(new Error('Service error'));

      await expect(cartApiService.addToCart(mockRequest)).rejects.toThrow('Service error');
    });
  });

  describe('updateQuantity', () => {
    const mockRequest: CartUpdateRequest = {
      userId: 123,
      itemId: 'item1',
      quantity: 3,
    };

    const mockCartItems: CartItem[] = [
      {
        quantity: 2,
        menuItem: {
          id: 'item1',
          name: 'Test Item',
          price: 100,
          description: 'Test description',
          category: 'shawarma',
        },
      },
    ];

    it('should update quantity successfully', async () => {
      mockCartService.getCart.mockResolvedValue(mockCartItems);
      mockCartService.updateQuantity.mockResolvedValue(undefined);

      await cartApiService.updateQuantity(mockRequest);

      expect(mockCartService.getCart).toHaveBeenCalledWith(123);
      expect(mockCartService.updateQuantity).toHaveBeenCalledWith(123, 'item1', 3);
    });

    it('should throw error when item not in cart', async () => {
      mockCartService.getCart.mockResolvedValue([]);

      await expect(cartApiService.updateQuantity(mockRequest)).rejects.toThrow(
        'Item with id item1 not found in cart'
      );

      expect(mockCartService.updateQuantity).not.toHaveBeenCalled();
    });

    it('should throw error when cart service fails', async () => {
      mockCartService.getCart.mockRejectedValue(new Error('Service error'));

      await expect(cartApiService.updateQuantity(mockRequest)).rejects.toThrow('Service error');
    });
  });

  describe('removeFromCart', () => {
    const mockCartItems: CartItem[] = [
      {
        quantity: 2,
        menuItem: {
          id: 'item1',
          name: 'Test Item',
          price: 100,
          description: 'Test description',
          category: 'shawarma',
        },
      },
    ];

    it('should remove item from cart successfully', async () => {
      mockCartService.getCart.mockResolvedValue(mockCartItems);
      mockCartService.removeFromCart.mockResolvedValue(undefined);

      await cartApiService.removeFromCart(123, 'item1');

      expect(mockCartService.getCart).toHaveBeenCalledWith(123);
      expect(mockCartService.removeFromCart).toHaveBeenCalledWith(123, 'item1');
    });

    it('should throw error when item not in cart', async () => {
      mockCartService.getCart.mockResolvedValue([]);

      await expect(cartApiService.removeFromCart(123, 'item1')).rejects.toThrow(
        'Item with id item1 not found in cart'
      );

      expect(mockCartService.removeFromCart).not.toHaveBeenCalled();
    });

    it('should throw error when cart service fails', async () => {
      mockCartService.getCart.mockRejectedValue(new Error('Service error'));

      await expect(cartApiService.removeFromCart(123, 'item1')).rejects.toThrow('Service error');
    });
  });

  describe('clearCart', () => {
    it('should clear cart successfully', async () => {
      const mockCartItems: CartItem[] = [
        {
          quantity: 2,
          menuItem: {
            id: 'item1',
            name: 'Test Item',
            price: 100,
            description: 'Test description',
            category: 'shawarma',
          },
        },
      ];

      mockCartService.getCart.mockResolvedValue(mockCartItems);
      mockCartService.clearCart.mockResolvedValue(undefined);

      await cartApiService.clearCart(123);

      expect(mockCartService.getCart).toHaveBeenCalledWith(123);
      expect(mockCartService.clearCart).toHaveBeenCalledWith(123);
    });

    it('should handle empty cart clearing', async () => {
      mockCartService.getCart.mockResolvedValue([]);
      mockCartService.clearCart.mockResolvedValue(undefined);

      await cartApiService.clearCart(123);

      expect(mockCartService.clearCart).toHaveBeenCalledWith(123);
    });

    it('should throw error when cart service fails', async () => {
      mockCartService.getCart.mockRejectedValue(new Error('Service error'));

      await expect(cartApiService.clearCart(123)).rejects.toThrow('Service error');
    });
  });

  describe('getCartTotal', () => {
    it('should get cart total and items count', async () => {
      mockCartService.getCartTotal.mockResolvedValue(500);
      mockCartService.getCartItemsCount.mockResolvedValue(3);

      const result = await cartApiService.getCartTotal(123);

      expect(mockCartService.getCartTotal).toHaveBeenCalledWith(123);
      expect(mockCartService.getCartItemsCount).toHaveBeenCalledWith(123);

      expect(result).toEqual({
        total: 500,
        itemsCount: 3,
      });
    });

    it('should throw error when cart service fails', async () => {
      mockCartService.getCartTotal.mockRejectedValue(new Error('Service error'));

      await expect(cartApiService.getCartTotal(123)).rejects.toThrow('Failed to fetch cart total');
    });
  });
});
