import express from "express";
import cors from "cors";

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, "http://localhost:5173"] : "*",
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

import authRoutes from "./routes/auth.routes";
import materialRoutes from "./routes/material.routes";
import inventoryRoutes from "./routes/inventory.routes";
import supplierRoutes from "./routes/supplier.routes";
import procurementRoutes from "./routes/procurement.routes";
import productRoutes from "./routes/product.routes";
import productionRoutes from "./routes/production.routes";
import qualityRoutes from "./routes/quality.routes";
import dashboardRoutes from "./routes/dashboard.routes";
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

// Protected route example for testing
app.get("/api/protected", requireAuth, (req, res) => {
  res.json({ message: "You are authenticated", user: (req as any).user });
});

app.get("/api/admin-only", requireAuth, requireRole(["Admin"]), (req, res) => {
  res.json({ message: "Admin access granted" });
});

// Centralized Error Handling (Basic)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
});

export default app;
