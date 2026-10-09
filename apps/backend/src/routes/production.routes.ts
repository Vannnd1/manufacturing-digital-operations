import { Router } from "express";
import { ProductionController } from "../controllers/production.controller";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validate";
import { createProdoSchema, prodoIdParamSchema, recordProductionSchema } from "../schemas/production.schema";

const router = Router();

const canManageProduction = requireRole(["Admin", "Manager", "Production"]);

router.get("/", requireAuth, ProductionController.list);
router.get("/:id", requireAuth, validateRequest(prodoIdParamSchema), ProductionController.get);
router.post("/", requireAuth, canManageProduction, validateRequest(createProdoSchema), ProductionController.create);

router.get("/:id/availability", requireAuth, validateRequest(prodoIdParamSchema), ProductionController.checkAvailability);
router.post("/:id/reserve", requireAuth, canManageProduction, validateRequest(prodoIdParamSchema), ProductionController.reserve);
router.post("/:id/record", requireAuth, canManageProduction, validateRequest(recordProductionSchema), ProductionController.record);

export default router;
