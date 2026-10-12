import knex from "knex";
import config from "../knexfile";
import { logger } from "./utils/logger";

const env = process.env.NODE_ENV || "development";
const db = knex(config[env]);

/**
 * Checks database connectivity with a bounded query timeout.
 * Never leaks database connection strings or internal errors.
 */
export async function checkDatabaseConnection(
  timeoutMs = 3000
): Promise<{ healthy: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    await db.raw("SELECT 1 AS alive").timeout(timeoutMs, { cancel: true });
    const latencyMs = Date.now() - start;
    return { healthy: true, latencyMs };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    logger.error("database_health_check_failed", {
      errorMessage: err.message ? err.message.substring(0, 100) : "Database query error",
      latencyMs,
    });
    return {
      healthy: false,
      latencyMs,
      error: "Database connectivity check failed",
    };
  }
}

/**
 * Gracefully destroys the Knex connection pool.
 */
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await db.destroy();
    logger.info("database_connection_closed");
  } catch (err: any) {
    logger.error("database_destroy_error", { errorMessage: err.message });
    throw err;
  }
}

/**
 * Returns safe connection pool diagnostics without exposing credentials.
 */
export function getDatabasePoolStatus(): Record<string, any> {
  try {
    const client = db.client as any;
    if (client && client.pool) {
      return {
        used: typeof client.pool.numUsed === "function" ? client.pool.numUsed() : 0,
        free: typeof client.pool.numFree === "function" ? client.pool.numFree() : 0,
        pending: typeof client.pool.numPendingAcquires === "function" ? client.pool.numPendingAcquires() : 0,
      };
    }
  } catch {
    // Non-blocking fallback
  }
  return {};
}

export default db;
