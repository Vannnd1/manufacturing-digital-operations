import { Router } from "express";
import { QualityController } from "../controllers/quality.controller";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validate";
import { createInspectionSchema, inspectionIdParamSchema } from "../schemas/quality.schema";

const router = Router();

const canManageQuality = requireRole(["Admin", "Manager", "QC"]);

router.get("/", requireAuth, QualityController.list);
router.get("/pending", requireAuth, QualityController.listPending);
router.get("/:id", requireAuth, validateRequest(inspectionIdParamSchema), QualityController.get);
router.post("/", requireAuth, canManageQuality, validateRequest(createInspectionSchema), QualityController.create);

export default router;
