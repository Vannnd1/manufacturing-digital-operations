import { z } from "zod";

export const createProdoSchema = z.object({
  body: z.object({
    product_id: z.string().uuid(),
    planned_quantity: z.number().positive(),
    materials: z.array(z.object({
      material_id: z.string().uuid(),
      required_quantity: z.number().positive(),
    })).min(1),
  }),
});

export const prodoIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const recordProductionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    actual_quantity_produced: z.number().positive(),
  }),
});
