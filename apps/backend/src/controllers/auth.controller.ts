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

  static async seedDemoUsers(req: Request, res: Response) {
    try {
      const db = (await import("../db.js")).default;
      const bcrypt = (await import("bcrypt")).default;
      const crypto = (await import("crypto")).default;
      
      const roles = await db("roles").select("id", "name");
      const passwordHash = await bcrypt.hash("demo123", 10);
      const newUsers = [];
      
      for (const role of roles) {
        if (role.name === "Admin") continue;
        
        const email = `${role.name.toLowerCase()}@mfg.com`;
        const existing = await db("users").where({ email }).first();
        if (!existing) {
          newUsers.push({
            id: crypto.randomUUID(),
            role_id: role.id,
            name: `${role.name} User`,
            email: email,
            password_hash: passwordHash,
            is_active: true
          });
        }
      }
      
      if (newUsers.length > 0) {
        await db("users").insert(newUsers);
        res.json({ message: `Successfully created ${newUsers.length} demo users.`, users: newUsers.map(u => u.email) });
      } else {
        res.json({ message: "Demo users already exist." });
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to seed demo users" });
    }
  }
}
