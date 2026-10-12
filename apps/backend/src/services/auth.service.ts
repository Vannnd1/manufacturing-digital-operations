import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db";

export class AuthService {
  static async login(email: string, passwordPlain: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    const user = await db("users").where({ email: normalizedEmail, is_active: true }).first();
    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const isValid = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const role = await db("roles").where({ id: user.role_id }).first();

    const jwtSecret =
      process.env.JWT_SECRET ||
      (process.env.NODE_ENV === "production" ? "" : "supersecretjwtkey_for_mvp_only");

    if (!jwtSecret) {
      throw new Error("CONFIG_ERROR");
    }

    const token = jwt.sign(
      { userId: user.id, role: role?.name },
      jwtSecret,
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
