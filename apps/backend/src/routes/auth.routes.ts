import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validate";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { z } from "zod";

const router = Router();

const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email()
      .max(255)
      .transform((val) => val.trim().toLowerCase()),
    password: z.string().min(1).max(255),
  }),
});

router.post("/login", validateRequest(loginSchema), AuthController.login);

// Restricted to authenticated Admin users only in development/test environments
router.get(
  "/seed-demo-users",
  requireAuth,
  requireRole(["Admin"]),
  AuthController.seedDemoUsers
);

export default router;

