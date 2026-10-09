import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validate";
import { createProductSchema } from "../schemas/product.schema";

const router = Router();

router.get("/", requireAuth, ProductController.list);

const canEditProducts = requireRole(["Admin", "Manager", "Production"]);
router.post("/", requireAuth, canEditProducts, validateRequest(createProductSchema), ProductController.create);

export default router;
