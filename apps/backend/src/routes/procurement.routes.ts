import { Router } from "express";
import { ProcurementController } from "../controllers/procurement.controller";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validate";
import { createPRSchema, approvePRSchema, createPOSchema, createGRSchema } from "../schemas/procurement.schema";

const router = Router();

// PR
router.post("/pr", requireAuth, validateRequest(createPRSchema), ProcurementController.createPR);
router.get("/pr", requireAuth, ProcurementController.listPRs);

// Approve PR (Managers or Admins only)
const canApprove = requireRole(["Admin", "Manager"]);
router.patch("/pr/:id/approve", requireAuth, canApprove, validateRequest(approvePRSchema), ProcurementController.approvePR);

// PO
const canManagePO = requireRole(["Admin", "Manager", "Purchasing"]);
router.post("/po", requireAuth, canManagePO, validateRequest(createPOSchema), ProcurementController.createPO);
router.get("/po", requireAuth, ProcurementController.listPOs);

// GR
const canReceiveGoods = requireRole(["Admin", "Manager", "Warehouse"]);
router.post("/gr", requireAuth, canReceiveGoods, validateRequest(createGRSchema), ProcurementController.createGR);

export default router;
