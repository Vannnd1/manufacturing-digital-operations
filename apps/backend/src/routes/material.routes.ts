import { Router } from "express";
import { MaterialController } from "../controllers/material.controller";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validate";
import { createMaterialSchema, updateMaterialSchema, materialIdParamSchema } from "../schemas/material.schema";

const router = Router();

// Everyone logged in can view materials
router.get("/", requireAuth, MaterialController.list);
router.get("/:id", requireAuth, validateRequest(materialIdParamSchema), MaterialController.get);

// Only Admin, Manager, Warehouse, or Purchasing can create/update materials (based on realistic MVP access)
const canEditMaterials = requireRole(["Admin", "Manager", "Warehouse", "Purchasing"]);

router.post("/", requireAuth, canEditMaterials, validateRequest(createMaterialSchema), MaterialController.create);
router.patch("/:id", requireAuth, canEditMaterials, validateRequest(updateMaterialSchema), MaterialController.update);

export default router;
