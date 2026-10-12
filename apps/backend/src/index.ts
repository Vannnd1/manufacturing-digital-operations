import dotenv from "dotenv";
dotenv.config();

import { validateStartupConfig, getSafeConfigSummary } from "./config/env";
import { logger } from "./utils/logger";
import { closeDatabaseConnection } from "./db";
import app from "./app";

// 1. Validate environment configuration before booting
try {
  validateStartupConfig();
  logger.info("startup_config_validated", getSafeConfigSummary());
} catch (err: any) {
  logger.error("startup_config_validation_failed", { errorMessage: err.message });
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 3001;

// 2. Start HTTP server
const server = app.listen(PORT, () => {
  logger.info("server_started", {
    port: PORT,
    url: `http://localhost:${PORT}`,
    nodeEnv: process.env.NODE_ENV || "development",
  });
});

// 3. Graceful shutdown orchestration
let isShuttingDown = false;

export async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn("shutdown_already_in_progress", { signal });
    return;
  }
  isShuttingDown = true;
  logger.info("graceful_shutdown_initiated", { signal });

  // Forceful exit timer in case in-flight requests or sockets hang indefinitely
  const forceExitTimeout = setTimeout(() => {
    logger.error("graceful_shutdown_timeout", {
      message: "Forced process exit after shutdown timeout limit exceeded (10s)",
    });
    process.exit(1);
  }, 10000);
  forceExitTimeout.unref();

  try {
    // Stop accepting new HTTP requests
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    logger.info("http_server_closed");

    // Close database connection pool
    await closeDatabaseConnection();

    logger.info("graceful_shutdown_complete");
    process.exit(0);
  } catch (err: any) {
    logger.error("graceful_shutdown_failed", { errorMessage: err.message });
    process.exit(1);
  }
}

// 4. Register process signal listeners
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason: any) => {
  logger.error("unhandled_promise_rejection", {
    errorMessage: reason?.message || String(reason),
    stack: process.env.NODE_ENV !== "production" ? reason?.stack : undefined,
  });
});

process.on("uncaughtException", (err: Error) => {
  logger.error("uncaught_exception", {
    errorMessage: err.message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
  });
  gracefulShutdown("uncaughtException");
});

export { server };
