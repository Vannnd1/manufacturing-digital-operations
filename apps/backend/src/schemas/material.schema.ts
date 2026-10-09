import { z } from "zod";

export const createMaterialSchema = z.object({
  body: z.object({
    sku: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
    unit: z.string().min(1).max(50),
    min_stock_threshold: z.number().min(0).default(0),
    is_active: z.boolean().default(true),
  }),
});

export const updateMaterialSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    unit: z.string().min(1).max(50).optional(),
    min_stock_threshold: z.number().min(0).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const materialIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
