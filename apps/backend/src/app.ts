import express from "express";
import cors from "cors";
import { requestCorrelation } from "./middleware/requestCorrelation";
import { logger } from "./utils/logger";
import healthRoutes from "./routes/health.routes";

const app = express();

// Request Correlation & HTTP Diagnostics (attaches X-Request-Id and tracks duration)
app.use(requestCorrelation);

// Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

// CORS Configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"]
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
  })
);

// Payload size limit to prevent Denial of Service (DoS)
app.use(express.json({ limit: "1mb" }));

// Health, Liveness, Readiness, and Diagnostics Endpoints
app.use("/api/health", healthRoutes);

import authRoutes from "./routes/auth.routes";
import materialRoutes from "./routes/material.routes";
import inventoryRoutes from "./routes/inventory.routes";
import supplierRoutes from "./routes/supplier.routes";
import procurementRoutes from "./routes/procurement.routes";
import productRoutes from "./routes/product.routes";
import productionRoutes from "./routes/production.routes";
import qualityRoutes from "./routes/quality.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import auditRoutes from "./routes/audit.routes";
import reportsRoutes from "./routes/reports.routes";
import { requireAuth } from "./middleware/requireAuth";
import { requireRole } from "./middleware/requireRole";

app.use("/api/auth", authRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/procurement", procurementRoutes);
app.use("/api/products", productRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/quality", qualityRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/reports", reportsRoutes);

// Protected route example for testing
app.get("/api/protected", requireAuth, (req, res) => {
  res.json({ message: "You are authenticated", user: (req as any).user });
});

app.get("/api/admin-only", requireAuth, requireRole(["Admin"]), (req, res) => {
  res.json({ message: "Admin access granted" });
});

// Centralized Error Handling with Safe Responses & Correlation ID
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const requestId = req.id;

  if (err.message === "CORS policy violation") {
    return res.status(403).json({
      error: "Origin not allowed by CORS policy",
      code: "FORBIDDEN",
      requestId,
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      error: "Payload too large. Maximum allowed request size is 1MB.",
      code: "PAYLOAD_TOO_LARGE",
      requestId,
    });
  }

  // Database error translations
  if (err.code === "23505") {
    return res.status(409).json({
      error: "A record with these details already exists.",
      code: "CONFLICT",
      requestId,
    });
  }

  if (err.code === "23503") {
    return res.status(400).json({
      error: "Referenced entity does not exist or cannot be modified.",
      code: "INVALID_REFERENCE",
      requestId,
    });
  }

  if (err.name === "TimeoutError" || err.code === "ECONNREFUSED") {
    return res.status(503).json({
      error: "Database service temporarily unavailable.",
      code: "SERVICE_UNAVAILABLE",
      requestId,
    });
  }

  logger.error("unhandled_error", {
    requestId,
    method: req.method,
    path: req.path,
    errorCode: err.code || err.name,
    errorMessage: err.message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
  });

  res.status(500).json({
    error: "Internal Server Error",
    code: "INTERNAL_ERROR",
    requestId,
  });
});

export default app;
