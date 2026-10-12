import { z } from "zod";

export const auditLogsQuerySchema = z.object({
  query: z
    .object({
      entity_name: z.string().max(100).optional(),
      entity_id: z.string().max(100).optional(),
      action_type: z.string().max(100).optional(),
      user_id: z.string().max(100).optional(),
      limit: z.coerce.number().int().min(1).max(500).optional(),
      offset: z.coerce.number().int().min(0).optional(),
    })
    .optional(),
});
