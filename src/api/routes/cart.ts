import { FastifyPluginAsync } from 'fastify';

import {
  CartAddSchema,
  CartUpdateSchema,
  CartParamsSchema,
  CartRemoveParamsSchema,
  CartResponseSchema,
  CartTotalResponseSchema,
} from '../schemas/cart';
import { CartApiService } from '../services/cartApiService';

const cartRoutes: FastifyPluginAsync = async fastify => {
  const cartApiService = new CartApiService();

  // GET /api/cart/:userId - получение корзины пользователя
  fastify.get(
    '/cart/:userId',
    {
      schema: {
        description: 'Получение корзины пользователя',
        tags: ['Cart'],
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
        response: {
          200: CartResponseSchema,
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'object' },
              timestamp: { type: 'string' },
            },
          },
          500: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'object' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const parseResult = CartParamsSchema.safeParse(request.params);
        if (!parseResult.success) {
          reply.code(400);
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid userId parameter',
            },
            timestamp: new Date().toISOString(),
          };
        }

        const { items, total, itemsCount } = await cartApiService.getCart(parseResult.data.userId);

        return {
          success: true,
          data: items,
          meta: {
            total,
            itemsCount,
            userId: parseResult.data.userId,
          },
        };
      } catch (error) {
        request.log.error('Failed to get cart:', error);

        reply.code(500);
        return {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch cart',
          },
          timestamp: new Date().toISOString(),
        };
      }
    }
  );

  // POST /api/cart/add - добавление товара в корзину
  fastify.post(
    '/cart/add',
    {
      schema: {
        description: 'Добавление товара в корзину',
        tags: ['Cart'],
        body: {
          type: 'object',
          properties: {
            userId: { type: 'number' },
            itemId: { type: 'string' },
            quantity: { type: 'number', default: 1, minimum: 1, maximum: 99 },
          },
          required: ['userId', 'itemId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'object' },
              timestamp: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'object' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const parseResult = CartAddSchema.safeParse(request.body);
        if (!parseResult.success) {
          reply.code(400);
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request body',
            },
            timestamp: new Date().toISOString(),
          };
        }

        await cartApiService.addToCart(parseResult.data);

        return {
          success: true,
          message: 'Item added to cart successfully',
        };
      } catch (error) {
        request.log.error('Failed to add item to cart:', error);

        if (error instanceof Error && error.message.includes('not found')) {
          reply.code(404);
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
            timestamp: new Date().toISOString(),
          };
        }

        reply.code(500);
        return {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to add item to cart',
          },
          timestamp: new Date().toISOString(),
        };
      }
    }
  );

  // PUT /api/cart/update - обновление количества товара
  fastify.put(
    '/cart/update',
    {
      schema: {
        description: 'Обновление количества товара в корзине',
        tags: ['Cart'],
        body: {
          type: 'object',
          properties: {
            userId: { type: 'number' },
            itemId: { type: 'string' },
            quantity: { type: 'number', minimum: 1, maximum: 99 },
          },
          required: ['userId', 'itemId', 'quantity'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'object' },
              timestamp: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'object' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const parseResult = CartUpdateSchema.safeParse(request.body);
        if (!parseResult.success) {
          reply.code(400);
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request body',
            },
            timestamp: new Date().toISOString(),
          };
        }

        await cartApiService.updateQuantity(parseResult.data);

        return {
          success: true,
          message: 'Cart item quantity updated successfully',
        };
      } catch (error) {
        request.log.error('Failed to update cart item:', error);

        if (error instanceof Error && error.message.includes('not found')) {
          reply.code(404);
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
            timestamp: new Date().toISOString(),
          };
        }

        reply.code(500);
        return {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update cart item',
          },
          timestamp: new Date().toISOString(),
        };
      }
    }
  );

  // DELETE /api/cart/remove/:userId/:itemId - удаление товара из корзины
  fastify.delete(
    '/cart/remove/:userId/:itemId',
    {
      schema: {
        description: 'Удаление товара из корзины',
        tags: ['Cart'],
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            itemId: { type: 'string' },
          },
          required: ['userId', 'itemId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'object' },
              timestamp: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'object' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const parseResult = CartRemoveParamsSchema.safeParse(request.params);
        if (!parseResult.success) {
          reply.code(400);
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid parameters',
            },
            timestamp: new Date().toISOString(),
          };
        }

        await cartApiService.removeFromCart(parseResult.data.userId, parseResult.data.itemId);

        return {
          success: true,
          message: 'Item removed from cart successfully',
        };
      } catch (error) {
        request.log.error('Failed to remove item from cart:', error);

        if (error instanceof Error && error.message.includes('not found')) {
          reply.code(404);
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
            timestamp: new Date().toISOString(),
          };
        }

        reply.code(500);
        return {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to remove item from cart',
          },
          timestamp: new Date().toISOString(),
        };
      }
    }
  );

  // DELETE /api/cart/clear/:userId - очистка корзины
  fastify.delete(
    '/cart/clear/:userId',
    {
      schema: {
        description: 'Очистка корзины пользователя',
        tags: ['Cart'],
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'object' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const parseResult = CartParamsSchema.safeParse(request.params);
        if (!parseResult.success) {
          reply.code(400);
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid userId parameter',
            },
            timestamp: new Date().toISOString(),
          };
        }

        await cartApiService.clearCart(parseResult.data.userId);

        return {
          success: true,
          message: 'Cart cleared successfully',
        };
      } catch (error) {
        request.log.error('Failed to clear cart:', error);

        reply.code(500);
        return {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to clear cart',
          },
          timestamp: new Date().toISOString(),
        };
      }
    }
  );

  // GET /api/cart/:userId/total - получение суммы корзины
  fastify.get(
    '/cart/:userId/total',
    {
      schema: {
        description: 'Получение общей суммы корзины пользователя',
        tags: ['Cart'],
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
        response: {
          200: CartTotalResponseSchema,
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'object' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const parseResult = CartParamsSchema.safeParse(request.params);
        if (!parseResult.success) {
          reply.code(400);
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid userId parameter',
            },
            timestamp: new Date().toISOString(),
          };
        }

        const { total, itemsCount } = await cartApiService.getCartTotal(parseResult.data.userId);

        return {
          success: true,
          data: {
            total,
            itemsCount,
            userId: parseResult.data.userId,
          },
        };
      } catch (error) {
        request.log.error('Failed to get cart total:', error);

        reply.code(500);
        return {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch cart total',
          },
          timestamp: new Date().toISOString(),
        };
      }
    }
  );

  await Promise.resolve();
};

export default cartRoutes;
