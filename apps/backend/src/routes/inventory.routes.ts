import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { validateRequest } from "../middleware/validate";
import { inventoryTransactionSchema } from "../schemas/inventory.schema";

const router = Router();

// View inventory (All authenticated users)
router.get("/", requireAuth, InventoryController.list);

// Adjust inventory (Warehouse, Manager, Admin)
const canAdjustInventory = requireRole(["Admin", "Manager", "Warehouse"]);
router.post("/transaction", requireAuth, canAdjustInventory, validateRequest(inventoryTransactionSchema), InventoryController.adjust);

export default router;
