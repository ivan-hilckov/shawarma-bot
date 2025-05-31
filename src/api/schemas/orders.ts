import { z } from 'zod';

import { SuccessResponseSchema, PaginationSchema, PaginationMetaSchema } from './common';

// Схема пользователя в заказе
export const OrderUserSchema = z.object({
  id: z.number().int(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
});

// Схема товара в заказе
export const OrderItemSchema = z.object({
  id: z.number().int(),
  menu_item: z.object({
    id: z.number().int(),
    name: z.string(),
    price: z.number().positive(),
  }),
  quantity: z.number().int().positive(),
  price: z.number().positive(), // цена на момент заказа
  subtotal: z.number().positive(),
});

// Схема заказа (краткая для списка)
export const OrderSchema = z.object({
  id: z.number().int(),
  user: OrderUserSchema,
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered']),
  total_price: z.number().positive(),
  items_count: z.number().int(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Схема детального заказа
export const OrderDetailSchema = OrderSchema.extend({
  items: z.array(OrderItemSchema),
});

// Query параметры для фильтрации заказов
export const OrdersQuerySchema = PaginationSchema.extend({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered']).optional(),
  user_id: z.number().int().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
});

// Схема статистики заказов
export const OrderStatsSchema = z.object({
  total_orders: z.number().int(),
  pending_orders: z.number().int(),
  confirmed_orders: z.number().int(),
  preparing_orders: z.number().int(),
  ready_orders: z.number().int(),
  delivered_orders: z.number().int(),
  total_revenue: z.number(),
  avg_order_value: z.number(),
  orders_today: z.number().int(),
  revenue_today: z.number(),
  popular_items: z.array(
    z.object({
      item_id: z.number().int(),
      name: z.string(),
      total_ordered: z.number().int(),
      revenue: z.number(),
    })
  ),
});

// Схемы ответов
export const OrdersResponseSchema = SuccessResponseSchema.extend({
  data: z.array(OrderSchema),
  meta: PaginationMetaSchema.extend({
    filters: z
      .object({
        status: z.string().optional(),
        user_id: z.number().optional(),
        date_from: z.string().optional(),
        date_to: z.string().optional(),
      })
      .optional(),
  }),
});

export const OrderDetailResponseSchema = SuccessResponseSchema.extend({
  data: OrderDetailSchema,
});

export const OrderStatsResponseSchema = SuccessResponseSchema.extend({
  data: OrderStatsSchema,
});

// Типы для TypeScript
export type OrderUser = z.infer<typeof OrderUserSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type OrderDetail = z.infer<typeof OrderDetailSchema>;
export type OrdersQuery = z.infer<typeof OrdersQuerySchema>;
export type OrderStats = z.infer<typeof OrderStatsSchema>;
export type OrdersResponse = z.infer<typeof OrdersResponseSchema>;
export type OrderDetailResponse = z.infer<typeof OrderDetailResponseSchema>;
export type OrderStatsResponse = z.infer<typeof OrderStatsResponseSchema>;
