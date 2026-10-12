/**
 * Environment configuration and startup validation.
 * Enforces production security standards and safe fallbacks in development/test.
 */

export interface AppConfig {
  port: number;
  jwtSecret: string;
  nodeEnv: string;
  frontendUrl: string;
}

export function validateStartupConfig(): void {
  const nodeEnv = process.env.NODE_ENV || "development";

  // Validate Port
  if (process.env.PORT) {
    const portNum = Number(process.env.PORT);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      throw new Error(`FATAL CONFIG ERROR: PORT must be a valid integer between 1 and 65535. Received: ${process.env.PORT}`);
    }
  }

  // Validate Allowed NODE_ENV values
  const allowedEnvs = ["development", "test", "production", "staging"];
  if (!allowedEnvs.includes(nodeEnv)) {
    throw new Error(`FATAL CONFIG ERROR: Invalid NODE_ENV "${nodeEnv}". Must be one of: ${allowedEnvs.join(", ")}`);
  }

  if (nodeEnv === "production") {
    const insecureSecrets = [
      "supersecretjwtkey_for_mvp_only",
      "<your-secure-jwt-secret>",
      "secret",
      "changeme",
      "password",
      "testsecret",
    ];

    const secret = process.env.JWT_SECRET?.trim();
    if (!secret || insecureSecrets.includes(secret) || secret.length < 16) {
      throw new Error(
        "FATAL CONFIG ERROR: JWT_SECRET must be securely set in production (minimum 16 characters) and cannot use default placeholders."
      );
    }

    if (!process.env.DATABASE_URL) {
      throw new Error("FATAL CONFIG ERROR: DATABASE_URL must be configured in production.");
    }
  }
}

/**
 * Returns safe diagnostic summary of configuration without leaking sensitive secrets.
 */
export function getSafeConfigSummary(): Record<string, string | number | boolean> {
  const nodeEnv = process.env.NODE_ENV || "development";
  const port = Number(process.env.PORT) || 3001;
  const dbUrl = process.env.DATABASE_URL;

  let safeDbUrl = "[NOT SET]";
  if (dbUrl) {
    // Mask password and host info if provided
    safeDbUrl = dbUrl.replace(/postgres(ql)?:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)/i, "postgres://$2:***@$4/$5");
  }

  return {
    nodeEnv,
    port,
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    databaseTarget: safeDbUrl,
    jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
  };
}

export const config: AppConfig = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production" ? "" : "supersecretjwtkey_for_mvp_only"),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};
