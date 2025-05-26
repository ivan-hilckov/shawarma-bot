import { z } from 'zod';

// Базовые схемы ответов
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  timestamp: z.string().datetime().optional(),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
  timestamp: z.string().datetime(),
});

// Схема пагинации
export const PaginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const PaginationMetaSchema = z.object({
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
  has_more: z.boolean(),
});

// Query параметры для фильтрации
export const DateRangeSchema = z.object({
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
});

// Схема для health check
export const HealthStatusSchema = z.enum(['healthy', 'degraded', 'unhealthy']);

export const ServiceStatusSchema = z.object({
  status: z.enum(['up', 'down']),
  response_time: z.number(),
});

// Типы для TypeScript
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type HealthStatus = z.infer<typeof HealthStatusSchema>;
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;
