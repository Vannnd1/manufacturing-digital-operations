import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// Everyone authenticated can view dashboard summary.
// Frontend components will be hidden based on user role using useAuthStore.
router.get("/summary", requireAuth, DashboardController.getSummary);

export default router;
