import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db";

export class AuthService {
  static async login(email: string, passwordPlain: string) {
    const user = await db("users").where({ email, is_active: true }).first();
    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const isValid = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const role = await db("roles").where({ id: user.role_id }).first();

    const token = jwt.sign(
      { userId: user.id, role: role?.name },
      process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only",
      { expiresIn: "8h" }
    );

    // Audit log
    await db("audit_logs").insert({
      user_id: user.id,
      action_type: "USER_LOGIN",
      entity_name: "USER",
      entity_id: user.id,
      description: "User logged in successfully",
    });

    return { token, user: { id: user.id, name: user.name, email: user.email, role: role?.name } };
  }
}
