import { Request, Response } from "express";
import { checkDatabaseConnection, getDatabasePoolStatus } from "../db";

/**
 * Liveness Probe: Verifies the Node.js event loop and HTTP server are responsive.
 * Does NOT check external resources (database) to avoid cascading orchestrator restarts during transient blips.
 */
export function getLiveness(_req: Request, res: Response): void {
  res.status(200).json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Standard Health Check: Backwards-compatible liveness endpoint.
 * Returns 200 OK indicating the API service is active.
 */
export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Readiness Probe: Verifies the process is ready to accept production traffic.
 * Checks database connectivity with a strict bounded timeout.
 */
export async function getReadiness(_req: Request, res: Response): Promise<void> {
  const dbCheck = await checkDatabaseConnection(3000);

  if (!dbCheck.healthy) {
    res.status(503).json({
      status: "degraded",
      database: "disconnected",
      error: "Database unreachable",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(200).json({
    status: "ready",
    database: "connected",
    latencyMs: dbCheck.latencyMs,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Safe Operational Diagnostics: Returns runtime metrics without leaking credentials.
 */
export function getDiagnostics(_req: Request, res: Response): void {
  const memory = process.memoryUsage();
  res.status(200).json({
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memoryMb: {
      rss: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
      heapUsed: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
    },
    databasePool: getDatabasePoolStatus(),
  });
}
