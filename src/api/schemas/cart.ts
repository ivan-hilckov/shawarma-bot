import { z } from 'zod';

// Схема для добавления товара в корзину
export const CartAddSchema = z.object({
  userId: z.number().int().positive(),
  itemId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).default(1),
});

// Схема для обновления количества товара
export const CartUpdateSchema = z.object({
  userId: z.number().int().positive(),
  itemId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

// Схема для параметров пути
export const CartParamsSchema = z.object({
  userId: z.string().pipe(z.coerce.number().int().positive()),
});

// Схема для параметров удаления товара
export const CartRemoveParamsSchema = z.object({
  userId: z.string().pipe(z.coerce.number().int().positive()),
  itemId: z.string().min(1),
});

// Типы для TypeScript
export type CartAddRequest = z.infer<typeof CartAddSchema>;
export type CartUpdateRequest = z.infer<typeof CartUpdateSchema>;
export type CartParams = z.infer<typeof CartParamsSchema>;
export type CartRemoveParams = z.infer<typeof CartRemoveParamsSchema>;

// Схемы ответов для Swagger
export const CartItemResponseSchema = {
  type: 'object',
  properties: {
    menuItem: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        category: { type: 'string', enum: ['shawarma', 'drinks'] },
        photo: { type: 'string' },
      },
      required: ['id', 'name', 'description', 'price', 'category'],
    },
    quantity: { type: 'number' },
  },
  required: ['menuItem', 'quantity'],
};

export const CartResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: CartItemResponseSchema,
    },
    meta: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        itemsCount: { type: 'number' },
        userId: { type: 'number' },
      },
    },
  },
  required: ['success', 'data'],
};

export const CartTotalResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        itemsCount: { type: 'number' },
        userId: { type: 'number' },
      },
    },
  },
  required: ['success', 'data'],
};
