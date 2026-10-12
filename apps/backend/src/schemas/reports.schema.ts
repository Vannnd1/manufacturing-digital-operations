import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const reportQuerySchema = z.object({
  query: z
    .object({
      range: z.enum(["7d", "30d", "all", "custom"]).default("30d"),
      startDate: z
        .string()
        .regex(isoDateRegex, "startDate must be in YYYY-MM-DD format")
        .optional(),
      endDate: z
        .string()
        .regex(isoDateRegex, "endDate must be in YYYY-MM-DD format")
        .optional(),
      materialId: z.string().uuid().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.range === "custom") {
        if (!data.startDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "startDate is required when range is 'custom'",
            path: ["startDate"],
          });
        }
        if (!data.endDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "endDate is required when range is 'custom'",
            path: ["endDate"],
          });
        }
      }

      if (data.startDate && data.endDate) {
        if (new Date(data.startDate) > new Date(data.endDate)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "startDate must be before or equal to endDate",
            path: ["startDate"],
          });
        }
      }
    }),
});

export const reportExportQuerySchema = z.object({
  query: z
    .object({
      type: z.enum(["inventory", "procurement", "production", "quality"]),
      range: z.enum(["7d", "30d", "all", "custom"]).default("30d"),
      startDate: z
        .string()
        .regex(isoDateRegex, "startDate must be in YYYY-MM-DD format")
        .optional(),
      endDate: z
        .string()
        .regex(isoDateRegex, "endDate must be in YYYY-MM-DD format")
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (data.range === "custom") {
        if (!data.startDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "startDate is required when range is 'custom'",
            path: ["startDate"],
          });
        }
        if (!data.endDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "endDate is required when range is 'custom'",
            path: ["endDate"],
          });
        }
      }

      if (data.startDate && data.endDate) {
        if (new Date(data.startDate) > new Date(data.endDate)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "startDate must be before or equal to endDate",
            path: ["startDate"],
          });
        }
      }
    }),
});

export type ReportQueryParams = z.infer<typeof reportQuerySchema>["query"];
export type ReportExportParams = z.infer<typeof reportExportQuerySchema>["query"];
