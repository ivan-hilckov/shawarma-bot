import {
  CategorySchema,
  MenuItemSchema,
  MenuItemDetailSchema,
  MenuItemsQuerySchema,
  CategoriesResponseSchema,
  MenuItemsResponseSchema,
  MenuItemDetailResponseSchema,
} from '../../src/api/schemas/menu';

describe('Menu Schemas', () => {
  describe('CategorySchema', () => {
    it('should validate category', () => {
      const validData = {
        id: 1,
        name: 'Shawarma',
        description: 'Delicious shawarma varieties',
        emoji: '🌯',
        items_count: 5,
        created_at: '2023-12-07T12:00:00.000Z',
      };
      expect(() => CategorySchema.parse(validData)).not.toThrow();
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        id: 1,
        name: 'Shawarma',
        // missing description, emoji, items_count, created_at
      };
      expect(() => CategorySchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid id type', () => {
      const invalidData = {
        id: 'invalid',
        name: 'Shawarma',
        description: 'Delicious shawarma varieties',
        emoji: '🌯',
        items_count: 5,
        created_at: '2023-12-07T12:00:00.000Z',
      };
      expect(() => CategorySchema.parse(invalidData)).toThrow();
    });
  });

  describe('MenuItemSchema', () => {
    it('should validate menu item', () => {
      const validData = {
        id: 1,
        name: 'Chicken Shawarma',
        description: 'Juicy chicken with fresh vegetables',
        price: 250,
        category: {
          id: 1,
          name: 'Shawarma',
          emoji: '🌯',
        },
        image_url: 'https://example.com/image.jpg',
        is_available: true,
        created_at: '2023-12-07T12:00:00.000Z',
        updated_at: '2023-12-07T12:00:00.000Z',
      };
      expect(() => MenuItemSchema.parse(validData)).not.toThrow();
    });

    it('should validate menu item without image_url', () => {
      const validData = {
        id: 1,
        name: 'Chicken Shawarma',
        description: 'Juicy chicken with fresh vegetables',
        price: 250,
        category: {
          id: 1,
          name: 'Shawarma',
          emoji: '🌯',
        },
        is_available: true,
        created_at: '2023-12-07T12:00:00.000Z',
        updated_at: '2023-12-07T12:00:00.000Z',
      };
      expect(() => MenuItemSchema.parse(validData)).not.toThrow();
    });

    it('should reject negative price', () => {
      const invalidData = {
        id: 1,
        name: 'Chicken Shawarma',
        description: 'Juicy chicken with fresh vegetables',
        price: -10,
        category: {
          id: 1,
          name: 'Shawarma',
          emoji: '🌯',
        },
        is_available: true,
        created_at: '2023-12-07T12:00:00.000Z',
        updated_at: '2023-12-07T12:00:00.000Z',
      };
      expect(() => MenuItemSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid image_url', () => {
      const invalidData = {
        id: 1,
        name: 'Chicken Shawarma',
        description: 'Juicy chicken with fresh vegetables',
        price: 250,
        category: {
          id: 1,
          name: 'Shawarma',
          emoji: '🌯',
        },
        image_url: 'not-a-url',
        is_available: true,
        created_at: '2023-12-07T12:00:00.000Z',
        updated_at: '2023-12-07T12:00:00.000Z',
      };
      expect(() => MenuItemSchema.parse(invalidData)).toThrow();
    });
  });

  describe('MenuItemDetailSchema', () => {
    it('should validate detailed menu item with stats', () => {
      const validData = {
        id: 1,
        name: 'Chicken Shawarma',
        description: 'Juicy chicken with fresh vegetables',
        price: 250,
        category: {
          id: 1,
          name: 'Shawarma',
          emoji: '🌯',
        },
        is_available: true,
        created_at: '2023-12-07T12:00:00.000Z',
        updated_at: '2023-12-07T12:00:00.000Z',
        stats: {
          total_ordered: 150,
          orders_count: 75,
          avg_rating: 4.5,
        },
      };
      expect(() => MenuItemDetailSchema.parse(validData)).not.toThrow();
    });

    it('should validate stats without rating', () => {
      const validData = {
        id: 1,
        name: 'Chicken Shawarma',
        description: 'Juicy chicken with fresh vegetables',
        price: 250,
        category: {
          id: 1,
          name: 'Shawarma',
          emoji: '🌯',
        },
        is_available: true,
        created_at: '2023-12-07T12:00:00.000Z',
        updated_at: '2023-12-07T12:00:00.000Z',
        stats: {
          total_ordered: 150,
          orders_count: 75,
        },
      };
      expect(() => MenuItemDetailSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid rating', () => {
      const invalidData = {
        id: 1,
        name: 'Chicken Shawarma',
        description: 'Juicy chicken with fresh vegetables',
        price: 250,
        category: {
          id: 1,
          name: 'Shawarma',
          emoji: '🌯',
        },
        is_available: true,
        created_at: '2023-12-07T12:00:00.000Z',
        updated_at: '2023-12-07T12:00:00.000Z',
        stats: {
          total_ordered: 150,
          orders_count: 75,
          avg_rating: 6, // Invalid: over 5
        },
      };
      expect(() => MenuItemDetailSchema.parse(invalidData)).toThrow();
    });
  });

  describe('MenuItemsQuerySchema', () => {
    it('should validate query with defaults', () => {
      const result = MenuItemsQuerySchema.parse({});
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it('should validate query with all filters', () => {
      const validData = {
        category_id: 1,
        available: true,
        min_price: 100,
        max_price: 500,
        limit: 25,
        offset: 50,
      };
      expect(() => MenuItemsQuerySchema.parse(validData)).not.toThrow();
    });

    it('should reject negative prices', () => {
      expect(() => MenuItemsQuerySchema.parse({ min_price: -10 })).toThrow();
      expect(() => MenuItemsQuerySchema.parse({ max_price: -5 })).toThrow();
    });
  });

  describe('Response Schemas', () => {
    describe('CategoriesResponseSchema', () => {
      it('should validate categories response', () => {
        const validData = {
          success: true,
          data: [
            {
              id: 1,
              name: 'Shawarma',
              description: 'Delicious shawarma varieties',
              emoji: '🌯',
              items_count: 5,
              created_at: '2023-12-07T12:00:00.000Z',
            },
          ],
          meta: {
            total: 1,
            timestamp: '2023-12-07T12:00:00.000Z',
          },
        };
        expect(() => CategoriesResponseSchema.parse(validData)).not.toThrow();
      });
    });

    describe('MenuItemsResponseSchema', () => {
      it('should validate menu items response', () => {
        const validData = {
          success: true,
          data: [
            {
              id: 1,
              name: 'Chicken Shawarma',
              description: 'Juicy chicken with fresh vegetables',
              price: 250,
              category: {
                id: 1,
                name: 'Shawarma',
                emoji: '🌯',
              },
              is_available: true,
              created_at: '2023-12-07T12:00:00.000Z',
              updated_at: '2023-12-07T12:00:00.000Z',
            },
          ],
          meta: {
            total: 1,
            limit: 50,
            offset: 0,
            has_more: false,
          },
        };
        expect(() => MenuItemsResponseSchema.parse(validData)).not.toThrow();
      });
    });

    describe('MenuItemDetailResponseSchema', () => {
      it('should validate menu item detail response', () => {
        const validData = {
          success: true,
          data: {
            id: 1,
            name: 'Chicken Shawarma',
            description: 'Juicy chicken with fresh vegetables',
            price: 250,
            category: {
              id: 1,
              name: 'Shawarma',
              emoji: '🌯',
            },
            is_available: true,
            created_at: '2023-12-07T12:00:00.000Z',
            updated_at: '2023-12-07T12:00:00.000Z',
            stats: {
              total_ordered: 150,
              orders_count: 75,
              avg_rating: 4.5,
            },
          },
        };
        expect(() => MenuItemDetailResponseSchema.parse(validData)).not.toThrow();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values appropriately', () => {
      const validData = {
        id: 1,
        name: 'Free Sample',
        description: 'Free tasting sample',
        price: 0.01, // Minimum positive price
        category: {
          id: 1,
          name: 'Samples',
          emoji: '🆓',
        },
        is_available: true,
        created_at: '2023-12-07T12:00:00.000Z',
        updated_at: '2023-12-07T12:00:00.000Z',
      };
      expect(() => MenuItemSchema.parse(validData)).not.toThrow();
    });

    it('should handle boundary rating values', () => {
      const validMinRating = {
        total_ordered: 1,
        orders_count: 1,
        avg_rating: 0,
      };

      const validMaxRating = {
        total_ordered: 1,
        orders_count: 1,
        avg_rating: 5,
      };

      const menuItemBase = {
        id: 1,
        name: 'Test Item',
        description: 'Test description',
        price: 100,
        category: {
          id: 1,
          name: 'Test',
          emoji: '🧪',
        },
        is_available: true,
        created_at: '2023-12-07T12:00:00.000Z',
        updated_at: '2023-12-07T12:00:00.000Z',
      };

      expect(() =>
        MenuItemDetailSchema.parse({
          ...menuItemBase,
          stats: validMinRating,
        })
      ).not.toThrow();

      expect(() =>
        MenuItemDetailSchema.parse({
          ...menuItemBase,
          stats: validMaxRating,
        })
      ).not.toThrow();
    });
  });
});
