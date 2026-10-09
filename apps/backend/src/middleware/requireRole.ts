import { Response, NextFunction } from "express";
import { AuthRequest } from "./requireAuth";

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: "Not authenticated", code: "UNAUTHORIZED" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions", code: "FORBIDDEN" });
    }

    next();
  };
};
