import { z } from 'zod';

// Схема для создания/обновления пользователя
export const UserUpsertSchema = z.object({
  id: z.number().int().positive(),
  username: z.string().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
});

// Схема для параметров пути
export const UserParamsSchema = z.object({
  id: z.string().transform(val => parseInt(val, 10)),
});

// Схема для запроса заказов пользователя
export const UserOrdersQuerySchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
  offset: z.number().int().min(0).default(0),
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered']).optional(),
});

// Типы для TypeScript
export type UserUpsertRequest = z.infer<typeof UserUpsertSchema>;
export type UserParams = z.infer<typeof UserParamsSchema>;
export type UserOrdersQuery = z.infer<typeof UserOrdersQuerySchema>;

// Схемы ответов для Swagger
export const UserResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    username: { type: 'string' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    ordersCount: { type: 'number' },
    totalSpent: { type: 'number' },
    lastOrderDate: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'firstName', 'ordersCount', 'totalSpent', 'createdAt', 'updatedAt'],
};

export const UsersListResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: UserResponseSchema,
    },
    meta: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' },
        hasMore: { type: 'boolean' },
      },
    },
  },
  required: ['success', 'data', 'meta'],
};

export const UserDetailResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: UserResponseSchema,
  },
  required: ['success', 'data'],
};

export const UserStatsResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number' },
        activeUsers: { type: 'number' },
        newUsersToday: { type: 'number' },
        newUsersThisWeek: { type: 'number' },
        newUsersThisMonth: { type: 'number' },
        avgOrdersPerUser: { type: 'number' },
        avgSpentPerUser: { type: 'number' },
        topSpenders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              firstName: { type: 'string' },
              username: { type: 'string' },
              totalSpent: { type: 'number' },
              ordersCount: { type: 'number' },
            },
          },
        },
      },
    },
  },
  required: ['success', 'data'],
};
