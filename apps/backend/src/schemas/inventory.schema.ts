import { z } from "zod";

export const inventoryTransactionSchema = z.object({
  body: z.object({
    material_id: z.string().uuid(),
    quantity_change: z.number().positive(),
    reference_id: z.string().optional(),
    type: z.enum(["Receipt", "Adjustment"]), // We only support manual Receipt or Adjustment directly in MVP without ProdO/PO flow right now
  }),
});
