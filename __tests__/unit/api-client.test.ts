import axios from 'axios';

// Отключаем глобальный мок из setupJest.ts
jest.unmock('../../src/api-client');

// Мокируем только нужные зависимости
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../../src/config', () => ({
  API_PORT: 3000,
}));

jest.mock('../../src/logger', () => ({
  createLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
  })),
}));

// Мокируем database service для legacy методов
const mockDatabaseService = {
  upsertUser: jest.fn(),
  createOrder: jest.fn(),
  getOrderById: jest.fn(),
  getUserOrders: jest.fn(),
  updateOrderStatus: jest.fn(),
};

jest.mock('../../src/database', () => ({
  __esModule: true,
  default: mockDatabaseService,
}));

jest.mock('../../src/types', () => ({}));

describe('BotApiClient', () => {
  let client: any;
  let mockAxiosInstance: jest.Mocked<any>;
  let BotApiClient: any;

  beforeAll(() => {
    // Создаем mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
    };

    // Мокируем axios.create
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    // Очищаем кеш модуля и импортируем заново
    delete require.cache[require.resolve('../../src/api-client')];

    const module = await import('../../src/api-client');
    BotApiClient = module.BotApiClient;

    expect(BotApiClient).toBeDefined();
    expect(typeof BotApiClient).toBe('function');

    // Создаем клиент
    client = new BotApiClient();
  });

  afterEach(() => {
    delete process.env.API_BASE_URL;
    delete process.env.API_TIMEOUT;
  });

  describe('Initialization', () => {
    it('should create axios instance with default config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3000/api',
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should use custom API_BASE_URL when provided', async () => {
      process.env.API_BASE_URL = 'https://custom-api.com/api';

      // Пересоздаем клиент с новой переменной
      const module = await import('../../src/api-client');
      new module.BotApiClient();

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://custom-api.com/api',
        })
      );
    });

    it('should use custom API_TIMEOUT when provided', async () => {
      process.env.API_TIMEOUT = '10000';

      // Пересоздаем клиент с новой переменной
      const module = await import('../../src/api-client');
      new module.BotApiClient();

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 10000,
        })
      );
    });

    it('should setup request and response interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('Cart API', () => {
    describe('getCart', () => {
      it('should return cart items successfully', async () => {
        const mockCartData = [
          {
            menuItem: {
              id: '1',
              name: 'Шаурма',
              description: 'Вкусная шаурма',
              price: 300,
              category: 'shawarma' as const,
            },
            quantity: 2,
          },
        ];
        mockAxiosInstance.get.mockResolvedValue({
          data: { data: mockCartData },
        });

        const result = await client.getCart(123);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/cart/123');
        expect(result).toEqual(mockCartData);
      });

      it('should return empty array when no data', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: {} });

        const result = await client.getCart(123);

        expect(result).toEqual([]);
      });

      it('should handle errors and throw descriptive message', async () => {
        mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

        await expect(client.getCart(123)).rejects.toThrow('Failed to fetch cart');
      });
    });

    describe('addToCart', () => {
      it('should add item to cart successfully', async () => {
        mockAxiosInstance.post.mockResolvedValue({ data: { success: true } });

        await client.addToCart(123, 'item1', 2);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/cart/add', {
          userId: 123,
          itemId: 'item1',
          quantity: 2,
        });
      });

      it('should use default quantity of 1', async () => {
        mockAxiosInstance.post.mockResolvedValue({ data: { success: true } });

        await client.addToCart(123, 'item1');

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/cart/add', {
          userId: 123,
          itemId: 'item1',
          quantity: 1,
        });
      });

      it('should handle errors', async () => {
        mockAxiosInstance.post.mockRejectedValue(new Error('Server error'));

        await expect(client.addToCart(123, 'item1')).rejects.toThrow('Failed to add item to cart');
      });
    });

    describe('updateCartQuantity', () => {
      it('should update cart quantity successfully', async () => {
        mockAxiosInstance.put.mockResolvedValue({ data: { success: true } });

        await client.updateCartQuantity(123, 'item1', 3);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/cart/update', {
          userId: 123,
          itemId: 'item1',
          quantity: 3,
        });
      });

      it('should handle errors', async () => {
        mockAxiosInstance.put.mockRejectedValue(new Error('Server error'));

        await expect(client.updateCartQuantity(123, 'item1', 3)).rejects.toThrow(
          'Failed to update cart item quantity'
        );
      });
    });

    describe('removeFromCart', () => {
      it('should remove item from cart successfully', async () => {
        mockAxiosInstance.delete.mockResolvedValue({ data: { success: true } });

        await client.removeFromCart(123, 'item1');

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/cart/remove/123/item1');
      });

      it('should handle errors', async () => {
        mockAxiosInstance.delete.mockRejectedValue(new Error('Server error'));

        await expect(client.removeFromCart(123, 'item1')).rejects.toThrow(
          'Failed to remove item from cart'
        );
      });
    });

    describe('clearCart', () => {
      it('should clear cart successfully', async () => {
        mockAxiosInstance.delete.mockResolvedValue({ data: { success: true } });

        await client.clearCart(123);

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/cart/clear/123');
      });

      it('should handle errors', async () => {
        mockAxiosInstance.delete.mockRejectedValue(new Error('Server error'));

        await expect(client.clearCart(123)).rejects.toThrow('Failed to clear cart');
      });
    });

    describe('getCartTotal', () => {
      it('should return cart total successfully', async () => {
        const mockTotal = { total: 600, itemsCount: 3 };
        mockAxiosInstance.get.mockResolvedValue({
          data: { data: mockTotal },
        });

        const result = await client.getCartTotal(123);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/cart/123/total');
        expect(result).toEqual(mockTotal);
      });

      it('should handle errors', async () => {
        mockAxiosInstance.get.mockRejectedValue(new Error('Server error'));

        await expect(client.getCartTotal(123)).rejects.toThrow('Failed to fetch cart total');
      });
    });
  });

  describe('Menu API', () => {
    describe('getMenuByCategory', () => {
      it('should get menu without category filter', async () => {
        const mockMenuData = [
          {
            id: '1',
            name: 'Шаурма',
            description: 'Вкусная шаурма',
            price: 300,
            category: 'shawarma' as const,
          },
        ];
        mockAxiosInstance.get.mockResolvedValue({
          data: { data: mockMenuData },
        });

        const result = await client.getMenuByCategory();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/menu/items', { params: {} });
        expect(result).toEqual(mockMenuData);
      });

      it('should get menu with category filter', async () => {
        const mockMenuData = [
          {
            id: '1',
            name: 'Шаурма',
            description: 'Вкусная шаурма',
            price: 300,
            category: 'shawarma' as const,
          },
        ];
        mockAxiosInstance.get.mockResolvedValue({
          data: { data: mockMenuData },
        });

        const result = await client.getMenuByCategory('shawarma');

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/menu/items', {
          params: { category_id: 1 },
        });
        expect(result).toEqual(mockMenuData);
      });

      it('should return empty array when no data', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: {} });

        const result = await client.getMenuByCategory();

        expect(result).toEqual([]);
      });

      it('should handle errors', async () => {
        mockAxiosInstance.get.mockRejectedValue(new Error('Server error'));

        await expect(client.getMenuByCategory()).rejects.toThrow('Failed to fetch menu');
      });
    });

    describe('getMenuItemById', () => {
      it('should return menu item when found', async () => {
        const mockItem = {
          id: '1',
          name: 'Шаурма',
          description: 'Вкусная шаурма',
          price: 300,
          category: 'shawarma' as const,
        };
        mockAxiosInstance.get.mockResolvedValue({
          data: { data: mockItem },
        });

        const result = await client.getMenuItemById('1');

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/menu/items/1');
        expect(result).toEqual(mockItem);
      });

      it('should return null when item not found (404)', async () => {
        mockAxiosInstance.get.mockRejectedValue({
          response: { status: 404 },
        });

        const result = await client.getMenuItemById('999');

        expect(result).toBeNull();
      });

      it('should return null when no data', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: {} });

        const result = await client.getMenuItemById('1');

        expect(result).toBeNull();
      });

      it('should handle non-404 errors', async () => {
        mockAxiosInstance.get.mockRejectedValue(new Error('Server error'));

        await expect(client.getMenuItemById('1')).rejects.toThrow('Failed to fetch menu item');
      });
    });
  });

  describe('Helper Methods', () => {
    describe('getCategoryId', () => {
      it('should return correct category ID for shawarma', () => {
        const result = (client as any).getCategoryId('shawarma');
        expect(result).toBe(1);
      });

      it('should return correct category ID for drinks', () => {
        const result = (client as any).getCategoryId('drinks');
        expect(result).toBe(2);
      });

      it('should return default category ID for unknown category', () => {
        const result = (client as any).getCategoryId('unknown');
        expect(result).toBe(1);
      });
    });

    describe('healthCheck', () => {
      it('should return true when API is healthy', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: { status: 'ok' } });

        const result = await client.healthCheck();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
        expect(result).toBe(true);
      });

      it('should return false when API is unhealthy', async () => {
        mockAxiosInstance.get.mockRejectedValue(new Error('API down'));

        const result = await client.healthCheck();

        expect(result).toBe(false);
      });
    });
  });

  describe('Legacy Methods (Database Integration)', () => {
    describe('upsertUser', () => {
      it('should call database service for user upsert', async () => {
        mockDatabaseService.upsertUser.mockResolvedValue(undefined);

        await client.upsertUser(123, 'john', 'John', 'Doe');

        expect(mockDatabaseService.upsertUser).toHaveBeenCalledWith(123, 'john', 'John', 'Doe');
      });

      it('should handle database errors', async () => {
        mockDatabaseService.upsertUser.mockRejectedValue(new Error('DB error'));

        await expect(client.upsertUser(123, 'john', 'John')).rejects.toThrow(
          'Failed to create or update user'
        );
      });
    });

    describe('createOrder', () => {
      it('should call database service for order creation', async () => {
        const mockCartItems = [
          {
            menuItem: {
              id: '1',
              name: 'Шаурма',
              description: 'Вкусная шаурма',
              price: 300,
              category: 'shawarma' as const,
            },
            quantity: 2,
          },
        ];
        mockDatabaseService.createOrder.mockResolvedValue('order123');

        const result = await client.createOrder(123, mockCartItems, 600);

        expect(mockDatabaseService.createOrder).toHaveBeenCalledWith(123, mockCartItems, 600);
        expect(result).toBe('order123');
      });

      it('should handle database errors', async () => {
        mockDatabaseService.createOrder.mockRejectedValue(new Error('DB error'));

        await expect(client.createOrder(123, [], 0)).rejects.toThrow('Failed to create order');
      });
    });

    describe('getOrderById', () => {
      it('should call database service for order retrieval', async () => {
        const mockOrder = { id: 'order123', userId: 123, status: 'pending' };
        mockDatabaseService.getOrderById.mockResolvedValue(mockOrder);

        const result = await client.getOrderById('order123');

        expect(mockDatabaseService.getOrderById).toHaveBeenCalledWith('order123');
        expect(result).toEqual(mockOrder);
      });

      it('should handle database errors', async () => {
        mockDatabaseService.getOrderById.mockRejectedValue(new Error('DB error'));

        await expect(client.getOrderById('order123')).rejects.toThrow('Failed to fetch order');
      });
    });

    describe('getUserOrders', () => {
      it('should call database service for user orders with default limit', async () => {
        const mockOrders = [{ id: 'order123', status: 'pending' }];
        mockDatabaseService.getUserOrders.mockResolvedValue(mockOrders);

        const result = await client.getUserOrders(123);

        expect(mockDatabaseService.getUserOrders).toHaveBeenCalledWith(123, 10);
        expect(result).toEqual(mockOrders);
      });

      it('should call database service with custom limit', async () => {
        const mockOrders = [{ id: 'order123', status: 'pending' }];
        mockDatabaseService.getUserOrders.mockResolvedValue(mockOrders);

        const result = await client.getUserOrders(123, 5);

        expect(mockDatabaseService.getUserOrders).toHaveBeenCalledWith(123, 5);
        expect(result).toEqual(mockOrders);
      });

      it('should handle database errors', async () => {
        mockDatabaseService.getUserOrders.mockRejectedValue(new Error('DB error'));

        await expect(client.getUserOrders(123)).rejects.toThrow('Failed to fetch user orders');
      });
    });

    describe('updateOrderStatus', () => {
      it('should call database service for order status update', async () => {
        mockDatabaseService.updateOrderStatus.mockResolvedValue(undefined);

        await client.updateOrderStatus('order123', 'confirmed');

        expect(mockDatabaseService.updateOrderStatus).toHaveBeenCalledWith('order123', 'confirmed');
      });

      it('should handle database errors', async () => {
        mockDatabaseService.updateOrderStatus.mockRejectedValue(new Error('DB error'));

        await expect(client.updateOrderStatus('order123', 'confirmed')).rejects.toThrow(
          'Failed to update order status'
        );
      });
    });
  });
});
