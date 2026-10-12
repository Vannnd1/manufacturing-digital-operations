import { Router } from "express";
import {
  getHealth,
  getLiveness,
  getReadiness,
  getDiagnostics,
} from "../controllers/health.controller";

const router = Router();

router.get("/", getHealth);
router.get("/liveness", getLiveness);
router.get("/readiness", getReadiness);
router.get("/diagnostics", getDiagnostics);

export default router;
