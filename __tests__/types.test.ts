import { MenuItem, CartItem, Order, Config } from '../src/types';

describe('Types Module', () => {
  describe('MenuItem interface', () => {
    test('должен соответствовать интерфейсу MenuItem', () => {
      const menuItem: MenuItem = {
        id: '1',
        name: 'Тестовая шаурма',
        description: 'Тестовое описание',
        price: 250,
        category: 'shawarma',
      };

      expect(menuItem.id).toBe('1');
      expect(menuItem.name).toBe('Тестовая шаурма');
      expect(menuItem.description).toBe('Тестовое описание');
      expect(menuItem.price).toBe(250);
      expect(menuItem.category).toBe('shawarma');
    });

    test('должен принимать только валидные категории', () => {
      const shawarmaItem: MenuItem = {
        id: '1',
        name: 'Шаурма',
        description: 'Описание',
        price: 250,
        category: 'shawarma',
      };

      const drinkItem: MenuItem = {
        id: '2',
        name: 'Напиток',
        description: 'Описание',
        price: 100,
        category: 'drinks',
      };

      expect(shawarmaItem.category).toBe('shawarma');
      expect(drinkItem.category).toBe('drinks');
    });
  });

  describe('CartItem interface', () => {
    test('должен соответствовать интерфейсу CartItem', () => {
      const menuItem: MenuItem = {
        id: '1',
        name: 'Тестовая шаурма',
        description: 'Тестовое описание',
        price: 250,
        category: 'shawarma',
      };

      const cartItem: CartItem = {
        menuItem,
        quantity: 2,
      };

      expect(cartItem.menuItem).toEqual(menuItem);
      expect(cartItem.quantity).toBe(2);
    });
  });

  describe('Order interface', () => {
    test('должен соответствовать интерфейсу Order', () => {
      const menuItem: MenuItem = {
        id: '1',
        name: 'Тестовая шаурма',
        description: 'Тестовое описание',
        price: 250,
        category: 'shawarma',
      };

      const cartItem: CartItem = {
        menuItem,
        quantity: 2,
      };

      const order: Order = {
        id: 'order_123',
        userId: 789,
        userName: 'TestUser',
        items: [cartItem],
        totalPrice: 500,
        status: 'pending',
        createdAt: new Date(),
      };

      expect(order.id).toBe('order_123');
      expect(order.userId).toBe(789);
      expect(order.userName).toBe('TestUser');
      expect(order.items).toHaveLength(1);
      expect(order.totalPrice).toBe(500);
      expect(order.status).toBe('pending');
      expect(order.createdAt).toBeInstanceOf(Date);
    });

    test('должен принимать только валидные статусы', () => {
      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];

      validStatuses.forEach(status => {
        const order: Partial<Order> = {
          status: status as Order['status'],
        };

        expect(validStatuses).toContain(order.status);
      });
    });
  });

  describe('Config interface', () => {
    test('должен соответствовать интерфейсу Config', () => {
      const config: Config = {
        BOT_TOKEN: 'test_token',
        NODE_ENV: 'test',
        REDIS_URL: 'redis://localhost:6379',
        DATABASE_URL: 'postgresql://localhost:5432/test',
        ASSETS_BASE_URL: 'https://example.com/assets',

        // API Configuration
        API_PORT: 3000,
        API_HOST: 'localhost',
        API_PREFIX: '/api',

        // Security
        API_KEYS: ['test-key'],
        CORS_ORIGINS: ['http://localhost:3000'],

        // Rate Limiting
        RATE_LIMIT_PUBLIC: 100,
        RATE_LIMIT_ADMIN: 1000,

        // Cache
        REDIS_CACHE_TTL: 300,
        ENABLE_CACHE: true,
      };

      expect(config.BOT_TOKEN).toBe('test_token');
      expect(config.NODE_ENV).toBe('test');
      expect(config.REDIS_URL).toBe('redis://localhost:6379');
      expect(config.DATABASE_URL).toBe('postgresql://localhost:5432/test');
      expect(config.ASSETS_BASE_URL).toBe('https://example.com/assets');
      expect(config.API_PORT).toBe(3000);
      expect(config.API_HOST).toBe('localhost');
      expect(config.API_PREFIX).toBe('/api');
      expect(config.API_KEYS).toEqual(['test-key']);
      expect(config.CORS_ORIGINS).toEqual(['http://localhost:3000']);
      expect(config.RATE_LIMIT_PUBLIC).toBe(100);
      expect(config.RATE_LIMIT_ADMIN).toBe(1000);
      expect(config.REDIS_CACHE_TTL).toBe(300);
      expect(config.ENABLE_CACHE).toBe(true);

      // Проверяем типы
      expect(typeof config.BOT_TOKEN).toBe('string');
      expect(typeof config.NODE_ENV).toBe('string');
      expect(typeof config.REDIS_URL).toBe('string');
      expect(typeof config.DATABASE_URL).toBe('string');
      expect(typeof config.ASSETS_BASE_URL).toBe('string');
      expect(typeof config.API_PORT).toBe('number');
      expect(typeof config.API_HOST).toBe('string');
      expect(typeof config.API_PREFIX).toBe('string');
      expect(Array.isArray(config.API_KEYS)).toBe(true);
      expect(Array.isArray(config.CORS_ORIGINS)).toBe(true);
      expect(typeof config.RATE_LIMIT_PUBLIC).toBe('number');
      expect(typeof config.RATE_LIMIT_ADMIN).toBe('number');
      expect(typeof config.REDIS_CACHE_TTL).toBe('number');
      expect(typeof config.ENABLE_CACHE).toBe('boolean');
    });
  });
});
