import { z } from "zod";

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    contact_info: z.string().max(255).optional(),
    is_active: z.boolean().default(true),
  }),
});

export const updateSupplierSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    contact_info: z.string().max(255).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const supplierIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
