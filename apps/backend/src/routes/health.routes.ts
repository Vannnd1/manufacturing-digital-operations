import { Router } from "express";
import {
  getHealth,
  getLiveness,
  getReadiness,
  getDiagnostics,
  syncCatalog,
} from "../controllers/health.controller";

const router = Router();

router.get("/", getHealth);
router.get("/liveness", getLiveness);
router.get("/readiness", getReadiness);
router.get("/diagnostics", getDiagnostics);
router.get("/sync-catalog", syncCatalog);
router.post("/sync-catalog", syncCatalog);

export default router;
