import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
    unit: z.string().min(1).max(50).default("pcs"),
  }),
});
