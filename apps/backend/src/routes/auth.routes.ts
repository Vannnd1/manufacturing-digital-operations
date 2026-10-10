import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validate";
import { z } from "zod";

const router = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  })
});

router.post("/login", validateRequest(loginSchema), AuthController.login);
router.get("/seed-demo-users", AuthController.seedDemoUsers);

export default router;
