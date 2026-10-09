import { Router } from "express";
import { SupplierController } from "../controllers/supplier.controller";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validate";
import { createSupplierSchema, updateSupplierSchema, supplierIdParamSchema } from "../schemas/supplier.schema";

const router = Router();

router.get("/", requireAuth, SupplierController.list);
router.get("/:id", requireAuth, validateRequest(supplierIdParamSchema), SupplierController.get);

const canEditSuppliers = requireRole(["Admin", "Manager", "Purchasing"]);

router.post("/", requireAuth, canEditSuppliers, validateRequest(createSupplierSchema), SupplierController.create);
router.patch("/:id", requireAuth, canEditSuppliers, validateRequest(updateSupplierSchema), SupplierController.update);

export default router;
