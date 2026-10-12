import { Router } from "express";
import { ReportsController } from "../controllers/reports.controller";
import { requireAuth } from "../middleware/requireAuth";
import { validateRequest } from "../middleware/validate";
import { reportQuerySchema, reportExportQuerySchema } from "../schemas/reports.schema";

const router = Router();

// Operational Reporting Endpoints
router.get("/summary", requireAuth, validateRequest(reportQuerySchema), ReportsController.getSummary);
router.get("/inventory-movements", requireAuth, validateRequest(reportQuerySchema), ReportsController.getInventoryReport);
router.get("/procurement-spend", requireAuth, validateRequest(reportQuerySchema), ReportsController.getProcurementReport);
router.get("/production-yield", requireAuth, validateRequest(reportQuerySchema), ReportsController.getProductionReport);
router.get("/quality-defects", requireAuth, validateRequest(reportQuerySchema), ReportsController.getQualityReport);
router.get("/export", requireAuth, validateRequest(reportExportQuerySchema), ReportsController.exportReport);

export default router;
