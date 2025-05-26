import { buildServer } from '../../src/api/server';

describe('Menu API', () => {
  let server: any;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /api/menu/categories', () => {
    it('should return all menu categories', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/menu/categories',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(Array.isArray(body.data)).toBe(true);

      // Проверяем структуру категории
      if (body.data.length > 0) {
        const category = body.data[0];
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('emoji');
        expect(category).toHaveProperty('items_count');
        expect(category).toHaveProperty('created_at');
        expect(typeof category.items_count).toBe('number');
      }

      expect(body.meta).toHaveProperty('total');
      expect(body.meta).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/menu/items', () => {
    it('should return menu items with default pagination', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/menu/items',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(Array.isArray(body.data)).toBe(true);

      // Проверяем структуру товара
      if (body.data.length > 0) {
        const item = body.data[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('price');
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('is_available');
        expect(item).toHaveProperty('created_at');
        expect(item).toHaveProperty('updated_at');

        expect(item.category).toHaveProperty('id');
        expect(item.category).toHaveProperty('name');
        expect(item.category).toHaveProperty('emoji');
        expect(typeof item.price).toBe('number');
        expect(typeof item.is_available).toBe('boolean');
      }

      expect(body.meta).toHaveProperty('total');
      expect(body.meta).toHaveProperty('limit');
      expect(body.meta).toHaveProperty('offset');
      expect(body.meta).toHaveProperty('has_more');
    });

    it('should filter items by category', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/menu/items?category_id=1',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // Все товары должны принадлежать категории 1
      body.data.forEach((item: any) => {
        expect(item.category.id).toBe(1);
      });
    });

    it('should filter items by availability', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/menu/items?available=true',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // Все товары должны быть доступными
      body.data.forEach((item: any) => {
        expect(item.is_available).toBe(true);
      });
    });

    it('should filter items by price range', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/menu/items?min_price=200&max_price=300',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // Все товары должны быть в диапазоне цен
      body.data.forEach((item: any) => {
        expect(item.price).toBeGreaterThanOrEqual(200);
        expect(item.price).toBeLessThanOrEqual(300);
      });
    });

    it('should handle pagination correctly', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/menu/items?limit=5&offset=0',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.length).toBeLessThanOrEqual(5);
      expect(body.meta.limit).toBe(5);
      expect(body.meta.offset).toBe(0);
    });

    it('should validate query parameters', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/menu/items?limit=invalid',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/menu/items/:id', () => {
    it('should return menu item details', async () => {
      // Сначала получаем список товаров, чтобы взять существующий ID
      const listResponse = await server.inject({
        method: 'GET',
        url: '/api/menu/items?limit=1',
      });

      const listBody = JSON.parse(listResponse.body);
      if (listBody.data.length === 0) {
        // Если нет товаров, пропускаем тест
        return;
      }

      const itemId = listBody.data[0].id;

      const response = await server.inject({
        method: 'GET',
        url: `/api/menu/items/${itemId}`,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');

      const item = body.data;
      expect(item).toHaveProperty('id', itemId);
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('price');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('is_available');
      expect(item).toHaveProperty('stats');
      expect(item).toHaveProperty('created_at');
      expect(item).toHaveProperty('updated_at');

      // Проверяем структуру статистики
      expect(item.stats).toHaveProperty('total_ordered');
      expect(item.stats).toHaveProperty('orders_count');
      expect(typeof item.stats.total_ordered).toBe('number');
      expect(typeof item.stats.orders_count).toBe('number');
    });

    it('should return 404 for non-existent item', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/menu/items/99999',
      });

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should validate item ID parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/menu/items/invalid',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle negative item ID', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/menu/items/-1',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Мокаем ошибку базы данных
      const originalQuery = server.db.query;
      server.db.query = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await server.inject({
        method: 'GET',
        url: '/api/menu/categories',
      });

      expect(response.statusCode).toBe(500);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');

      // Восстанавливаем оригинальный метод
      server.db.query = originalQuery;
    });
  });
});
