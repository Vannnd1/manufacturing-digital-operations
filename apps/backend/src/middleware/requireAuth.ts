import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token", code: "UNAUTHORIZED" });
  }

  const token = authHeader.split(" ")[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: "Missing or invalid token", code: "UNAUTHORIZED" });
  }

  const jwtSecret =
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production" ? "" : "supersecretjwtkey_for_mvp_only");

  if (!jwtSecret) {
    return res
      .status(500)
      .json({ error: "Authentication configuration error", code: "CONFIG_ERROR" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    if (
      !decoded ||
      typeof decoded !== "object" ||
      typeof decoded.userId !== "string" ||
      typeof decoded.role !== "string"
    ) {
      return res.status(401).json({ error: "Invalid token claims", code: "UNAUTHORIZED" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token", code: "UNAUTHORIZED" });
  }
};

