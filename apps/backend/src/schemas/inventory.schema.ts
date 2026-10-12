import { z } from "zod";

export const inventoryTransactionSchema = z.object({
  body: z.object({
    material_id: z.string().uuid(),
    quantity_change: z.number().refine((val) => val !== 0, {
      message: "Quantity change cannot be zero",
    }),
    reference_id: z.string().optional(),
    type: z.enum(["Receipt", "Adjustment"]),
  }).superRefine((data, ctx) => {
    if (data.type === "Receipt" && data.quantity_change <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Receipt quantity must be positive",
        path: ["quantity_change"],
      });
    }
  }),
});

