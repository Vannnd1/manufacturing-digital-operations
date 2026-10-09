import { z } from "zod";

export const createPRSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      material_id: z.string().uuid(),
      quantity: z.number().positive(),
    })).min(1),
  }),
});

export const approvePRSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(["Approved", "Rejected"]),
  }),
});

export const createPOSchema = z.object({
  body: z.object({
    pr_id: z.string().uuid(),
    supplier_id: z.string().uuid(),
    items: z.array(z.object({
      material_id: z.string().uuid(),
      quantity: z.number().positive(),
      unit_price: z.number().positive(),
    })).min(1),
  }),
});

export const createGRSchema = z.object({
  body: z.object({
    po_id: z.string().uuid(),
    items: z.array(z.object({
      po_item_id: z.string().uuid(),
      received_quantity: z.number().positive(),
    })).min(1),
  }),
});
