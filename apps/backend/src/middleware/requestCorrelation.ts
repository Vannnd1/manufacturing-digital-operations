import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logger } from "../utils/logger";

declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: bigint;
    }
  }
}

/**
 * Validates externally supplied Request ID to prevent log injection or HTTP response splitting.
 * Accepts alphanumeric, hyphens, and underscores between 1 and 64 characters.
 */
export function isValidRequestId(id: string): boolean {
  if (typeof id !== "string") return false;
  const trimmed = id.trim();
  if (trimmed.length === 0 || trimmed.length > 64) return false;
  return /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

/**
 * Request correlation and HTTP diagnostics middleware.
 * Attaches a unique X-Request-Id to every request and logs completion diagnostics.
 */
export function requestCorrelation(req: Request, res: Response, next: NextFunction): void {
  const incomingId = (req.headers["x-request-id"] || req.headers["x-correlation-id"]) as string | undefined;

  let requestId: string;
  if (incomingId && isValidRequestId(incomingId)) {
    requestId = incomingId.trim();
  } else {
    requestId = crypto.randomUUID();
  }

  req.id = requestId;
  req.startTime = process.hrtime.bigint();
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    let durationMs = 0;
    if (req.startTime) {
      const elapsedNs = process.hrtime.bigint() - req.startTime;
      durationMs = Number(elapsedNs / 1_000_000n);
    }

    const statusCode = res.statusCode;
    const isHealthProbe = req.path === "/api/health" || req.path.startsWith("/api/health/");

    const meta = {
      requestId,
      method: req.method,
      path: req.baseUrl ? `${req.baseUrl}${req.path}` : req.path,
      statusCode,
      durationMs,
      ip: req.ip || req.socket.remoteAddress || "unknown",
    };

    // Health probes are logged at debug level on success to prevent log flooding
    if (isHealthProbe && statusCode === 200) {
      logger.debug("http_request_health", meta);
      return;
    }

    if (statusCode >= 500) {
      logger.error("http_server_error", meta);
    } else if (statusCode >= 400) {
      logger.warn("http_client_error", meta);
    } else {
      logger.info("http_request", meta);
    }
  });

  next();
}
