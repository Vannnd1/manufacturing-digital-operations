import { Router } from "express";
import { AuditController } from "../controllers/audit.controller";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validate";
import { prodoIdParamSchema } from "../schemas/production.schema";
import { materialIdParamSchema } from "../schemas/material.schema";
import { auditLogsQuerySchema } from "../schemas/audit.schema";

const router = Router();

// Audit inspection is restricted to Admin and Manager roles per enterprise security policy
const canViewAudit = requireRole(["Admin", "Manager"]);

// Query audit logs with pagination validation
router.get("/logs", requireAuth, canViewAudit, validateRequest(auditLogsQuerySchema), AuditController.listLogs);

// Query end-to-end production order genealogy
router.get("/traceability/prodo/:id", requireAuth, canViewAudit, validateRequest(prodoIdParamSchema), AuditController.productionOrderTrace);

// Query material stock lineage
router.get("/traceability/material/:id", requireAuth, canViewAudit, validateRequest(materialIdParamSchema), AuditController.materialTrace);

export default router;

