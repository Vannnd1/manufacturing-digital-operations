import { z } from "zod";

// HS Code validation: 6-digit minimum (WCO standard), up to 10 digits for national extensions.
// Accepts digits and optional dots (e.g. "8471.30", "847130"). Null/empty = unassigned.
const hsCodeSchema = z
  .string()
  .max(20)
  .regex(/^[\d.]+$/, "HS Code must contain only digits and dots")
  .optional()
  .nullable();

export const createMaterialSchema = z.object({
  body: z.object({
    sku: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
    unit: z.string().min(1).max(50),
    min_stock_threshold: z.number().min(0).default(0),
    is_active: z.boolean().default(true),
    hs_code: hsCodeSchema,
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
    hs_code: hsCodeSchema,
  }),
});

export const materialIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
