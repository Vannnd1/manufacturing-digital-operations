import { z } from "zod";

export const createInspectionSchema = z.object({
  body: z.object({
    production_record_id: z.string().uuid(),
    pass_quantity: z.number().min(0),
    fail_quantity: z.number().min(0),
    defects: z.array(z.object({
      defect_reason: z.string().min(1),
      quantity: z.number().positive(),
    })).optional(),
  }),
});

export const inspectionIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
