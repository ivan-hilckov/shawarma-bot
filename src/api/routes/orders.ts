import { FastifyPluginAsync } from 'fastify';

import config from '../../config';
import { OrderService } from '../services/orderService';

// Middleware для проверки API ключа
const authenticateAdmin = (request: any, reply: any) => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!config.API_KEYS.includes(token)) {
    reply.code(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid API key',
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }
};

const orderRoutes: FastifyPluginAsync = async fastify => {
  const orderService = new OrderService(fastify.db);

  // GET /api/orders - получение заказов с фильтрацией (только для админов)
  fastify.get(
    '/orders',
    {
      preHandler: authenticateAdmin,
      schema: {
        description: 'Получение заказов с фильтрацией (только для админов)',
        tags: ['Orders'],
        security: [{ apiKey: [] }],
        querystring: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered'],
            },
            user_id: { type: 'number' },
            date_from: { type: 'string', format: 'date-time' },
            date_to: { type: 'string', format: 'date-time' },
            limit: { type: 'number', default: 20, minimum: 1, maximum: 100 },
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
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        first_name: { type: 'string' },
                        last_name: { type: 'string' },
                        username: { type: 'string' },
                      },
                    },
                    status: { type: 'string' },
                    total_price: { type: 'number' },
                    items_count: { type: 'number' },
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
                  filters: { type: 'object' },
                },
              },
            },
          },
          401: {
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
        const query = request.query as any;
        const filters = {
          status: query.status,
          user_id: query.user_id,
          date_from: query.date_from,
          date_to: query.date_to,
          limit: query.limit || 20,
          offset: query.offset || 0,
        };

        const { orders, total } = await orderService.getOrders(filters);

        return {
          success: true,
          data: orders,
          meta: {
            total,
            limit: filters.limit,
            offset: filters.offset,
            has_more: filters.offset + filters.limit < total,
            filters: {
              ...(filters.status && { status: filters.status }),
              ...(filters.user_id && { user_id: filters.user_id }),
              ...(filters.date_from && { date_from: filters.date_from }),
              ...(filters.date_to && { date_to: filters.date_to }),
            },
          },
        };
      } catch (error) {
        request.log.error('Failed to get orders:', error);
        reply.code(500);
        return {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch orders',
          },
          timestamp: new Date().toISOString(),
        };
      }
    }
  );

  // GET /api/orders/:id - получение детальной информации о заказе
  fastify.get(
    '/orders/:id',
    {
      preHandler: authenticateAdmin,
      schema: {
        description: 'Получение детальной информации о заказе',
        tags: ['Orders'],
        security: [{ apiKey: [] }],
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
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      first_name: { type: 'string' },
                      last_name: { type: 'string' },
                      username: { type: 'string' },
                    },
                  },
                  status: { type: 'string' },
                  total_price: { type: 'number' },
                  items_count: { type: 'number' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        menu_item: {
                          type: 'object',
                          properties: {
                            id: { type: 'number' },
                            name: { type: 'string' },
                            price: { type: 'number' },
                          },
                        },
                        quantity: { type: 'number' },
                        price: { type: 'number' },
                        subtotal: { type: 'number' },
                      },
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
              error: { type: 'object' },
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
              message: 'Invalid order ID',
            },
            timestamp: new Date().toISOString(),
          };
        }

        const order = await orderService.getOrderById(id);

        if (!order) {
          reply.code(404);
          return {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: `Order with id ${id} not found`,
            },
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          data: order,
        };
      } catch (error) {
        request.log.error('Failed to get order:', error);
        reply.code(500);
        return {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch order',
          },
          timestamp: new Date().toISOString(),
        };
      }
    }
  );

  // GET /api/orders/stats - статистика заказов
  fastify.get(
    '/orders/stats',
    {
      preHandler: authenticateAdmin,
      schema: {
        description: 'Получение статистики заказов',
        tags: ['Orders'],
        security: [{ apiKey: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  total_orders: { type: 'number' },
                  pending_orders: { type: 'number' },
                  confirmed_orders: { type: 'number' },
                  preparing_orders: { type: 'number' },
                  ready_orders: { type: 'number' },
                  delivered_orders: { type: 'number' },
                  total_revenue: { type: 'number' },
                  avg_order_value: { type: 'number' },
                  orders_today: { type: 'number' },
                  revenue_today: { type: 'number' },
                  popular_items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        item_id: { type: 'number' },
                        name: { type: 'string' },
                        total_ordered: { type: 'number' },
                        revenue: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const stats = await orderService.getOrderStats();

        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        request.log.error('Failed to get order stats:', error);
        reply.code(500);
        return {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch order statistics',
          },
          timestamp: new Date().toISOString(),
        };
      }
    }
  );

  await Promise.resolve();
};

export default orderRoutes;
