import { FastifyPluginAsync } from 'fastify';

import { MenuService } from '../services/menuService';

const menuRoutes: FastifyPluginAsync = async fastify => {
  const menuService = new MenuService(fastify.db);

  // GET /api/menu/categories - получение всех категорий меню
  fastify.get(
    '/menu/categories',
    {
      schema: {
        description: 'Получение всех категорий меню',
        tags: ['Menu'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    emoji: { type: 'string' },
                    items_count: { type: 'number' },
                    created_at: { type: 'string' },
                  },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const categories = await menuService.getCategories();

        return {
          success: true,
          data: categories,
          meta: {
            total: categories.length,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        request.log.error('Failed to get categories:', error);
        reply.code(500);
        return {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch categories',
          },
          timestamp: new Date().toISOString(),
        };
      }
    }
  );

  // GET /api/menu/items - получение товаров с фильтрацией
  fastify.get(
    '/menu/items',
    {
      schema: {
        description: 'Получение товаров меню с фильтрацией и пагинацией',
        tags: ['Menu'],
        querystring: {
          type: 'object',
          properties: {
            category_id: { type: 'number' },
            available: { type: 'boolean' },
            min_price: { type: 'number' },
            max_price: { type: 'number' },
            limit: { type: 'number', default: 50, minimum: 1, maximum: 100 },
            offset: { type: 'number', default: 0, minimum: 0 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    price: { type: 'number' },
                    category: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                        emoji: { type: 'string' },
                      },
                    },
                    image_url: { type: 'string' },
                    is_available: { type: 'boolean' },
                    created_at: { type: 'string' },
                    updated_at: { type: 'string' },
                  },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  limit: { type: 'number' },
                  offset: { type: 'number' },
                  has_more: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const query = request.query as any;
        const filters = {
          category_id: query.category_id,
          available: query.available,
          min_price: query.min_price,
          max_price: query.max_price,
          limit: query.limit || 50,
          offset: query.offset || 0,
        };

        const { items, total } = await menuService.getMenuItems(filters);

        return {
          success: true,
          data: items,
          meta: {
            total,
            limit: filters.limit,
            offset: filters.offset,
            has_more: filters.offset + filters.limit < total,
          },
        };
      } catch (error) {
        request.log.error('Failed to get menu items:', error);
        reply.code(500);
        return {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch menu items',
          },
          timestamp: new Date().toISOString(),
        };
      }
    }
  );

  // GET /api/menu/items/:id - получение конкретного товара
  fastify.get(
    '/menu/items/:id',
    {
      schema: {
        description: 'Получение детальной информации о товаре',
        tags: ['Menu'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'number' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  price: { type: 'number' },
                  category: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      name: { type: 'string' },
                      emoji: { type: 'string' },
                    },
                  },
                  image_url: { type: 'string' },
                  is_available: { type: 'boolean' },
                  stats: {
                    type: 'object',
                    properties: {
                      total_ordered: { type: 'number' },
                      orders_count: { type: 'number' },
                      avg_rating: { type: 'number' },
                    },
                  },
                  created_at: { type: 'string' },
                  updated_at: { type: 'string' },
                },
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const params = request.params as any;
        const id = parseInt(params.id);

        if (isNaN(id) || id <= 0) {
          reply.code(400);
          return {
            success: false,
            error: {
              code: 'INVALID_PARAMETER',
              message: 'Invalid item ID',
            },
            timestamp: new Date().toISOString(),
          };
        }

        const menuItem = await menuService.getMenuItemById(id);

        if (!menuItem) {
          reply.code(404);
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: `Menu item with id ${id} not found`,
            },
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          data: menuItem,
        };
      } catch (error) {
        request.log.error('Failed to get menu item:', error);
        reply.code(500);
        return {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch menu item',
          },
          timestamp: new Date().toISOString(),
        };
      }
    }
  );

  await Promise.resolve();
};

export default menuRoutes;
