import { z } from 'zod';

import { SuccessResponseSchema, PaginationSchema, PaginationMetaSchema } from './common';

// Схема категории меню
export const CategorySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string(),
  emoji: z.string(),
  items_count: z.number().int(),
  created_at: z.string().datetime(),
});

// Схема товара меню
export const MenuItemSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string(),
  price: z.number().positive(),
  category: z.object({
    id: z.number().int(),
    name: z.string(),
    emoji: z.string(),
  }),
  image_url: z.string().url().optional(),
  is_available: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Схема детального товара с статистикой
export const MenuItemDetailSchema = MenuItemSchema.extend({
  stats: z.object({
    total_ordered: z.number().int(),
    orders_count: z.number().int(),
    avg_rating: z.number().min(0).max(5).optional(),
  }),
});

// Query параметры для фильтрации товаров
export const MenuItemsQuerySchema = PaginationSchema.extend({
  category_id: z.number().int().optional(),
  available: z.boolean().optional(),
  min_price: z.number().positive().optional(),
  max_price: z.number().positive().optional(),
});

// Схемы ответов
export const CategoriesResponseSchema = SuccessResponseSchema.extend({
  data: z.array(CategorySchema),
  meta: z.object({
    total: z.number().int(),
    timestamp: z.string().datetime(),
  }),
});

export const MenuItemsResponseSchema = SuccessResponseSchema.extend({
  data: z.array(MenuItemSchema),
  meta: PaginationMetaSchema,
});

export const MenuItemDetailResponseSchema = SuccessResponseSchema.extend({
  data: MenuItemDetailSchema,
});

// Типы для TypeScript
export type Category = z.infer<typeof CategorySchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type MenuItemDetail = z.infer<typeof MenuItemDetailSchema>;
export type MenuItemsQuery = z.infer<typeof MenuItemsQuerySchema>;
export type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>;
export type MenuItemsResponse = z.infer<typeof MenuItemsResponseSchema>;
export type MenuItemDetailResponse = z.infer<typeof MenuItemDetailResponseSchema>;
