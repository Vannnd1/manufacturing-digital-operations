import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.json(result);
    } catch (error: any) {
      if (error.message === "INVALID_CREDENTIALS") {
        res.status(401).json({ error: "Invalid email or password", code: "UNAUTHORIZED" });
      } else {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
      }
    }
  }
}
