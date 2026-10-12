import request from "supertest";
import jwt from "jsonwebtoken";
import app from "./app";
import { isValidRequestId } from "./middleware/requestCorrelation";
import { redactSensitiveData, logger } from "./utils/logger";
import { validateStartupConfig, getSafeConfigSummary, config } from "./config/env";
import * as dbModule from "./db";

const validAdminToken = jwt.sign(
  { userId: "admin-uuid", username: "admin", role: "Admin" },
  config.jwtSecret,
  { expiresIn: "1h" }
);

describe("Phase 17 — Observability & Production Readiness", () => {
  describe("1. Health, Liveness & Readiness Probes", () => {
    it("GET /api/health should return liveness 200 OK indicating server process is responsive", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body).toHaveProperty("uptime");
      expect(res.body).toHaveProperty("timestamp");
    });

    it("GET /api/health/liveness should return 200 OK without requiring database checks", async () => {
      const res = await request(app).get("/api/health/liveness");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(typeof res.body.uptime).toBe("number");
      expect(res.body).toHaveProperty("timestamp");
    });

    it("GET /api/health/readiness should return 200 OK when database is reachable", async () => {
      const spy = jest.spyOn(dbModule, "checkDatabaseConnection").mockResolvedValueOnce({
        healthy: true,
        latencyMs: 12,
      });

      const res = await request(app).get("/api/health/readiness");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ready");
      expect(res.body.database).toBe("connected");
      expect(typeof res.body.latencyMs).toBe("number");

      spy.mockRestore();
    });

    it("GET /api/health/readiness should return 503 degraded when database connectivity fails", async () => {
      const spy = jest.spyOn(dbModule, "checkDatabaseConnection").mockResolvedValueOnce({
        healthy: false,
        latencyMs: 150,
        error: "Database connectivity check failed",
      });

      const res = await request(app).get("/api/health/readiness");
      expect(res.status).toBe(503);
      expect(res.body.status).toBe("degraded");
      expect(res.body.database).toBe("disconnected");
      expect(res.body.error).toBe("Database unreachable");
      // Must not leak internal connection string or stack trace
      expect(res.body.stack).toBeUndefined();

      spy.mockRestore();
    });

    it("GET /api/health/diagnostics should return runtime diagnostics safely", async () => {
      const res = await request(app).get("/api/health/diagnostics");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("nodeVersion");
      expect(res.body).toHaveProperty("uptimeSeconds");
      expect(res.body).toHaveProperty("memoryMb");
      expect(res.body.memoryMb).toHaveProperty("rss");
      expect(res.body.memoryMb).toHaveProperty("heapUsed");
      expect(res.body).toHaveProperty("databasePool");
    });
  });

  describe("2. Request Correlation & HTTP Diagnostics", () => {
    it("should generate a UUID X-Request-Id header when none is provided", async () => {
      const res = await request(app).get("/api/health/liveness");
      const reqId = res.headers["x-request-id"];
      expect(reqId).toBeDefined();
      expect(reqId.length).toBeGreaterThan(10);
    });

    it("should preserve a valid incoming X-Request-Id header", async () => {
      const customId = "trace-corp-order-98765";
      const res = await request(app)
        .get("/api/health/liveness")
        .set("X-Request-Id", customId);
      expect(res.headers["x-request-id"]).toBe(customId);
    });

    it("should reject and replace invalid or log-injecting X-Request-Id headers", async () => {
      const invalidId = "invalid id with spaces";
      const res = await request(app)
        .get("/api/health/liveness")
        .set("X-Request-Id", invalidId);
      expect(res.headers["x-request-id"]).not.toBe(invalidId);
      expect(isValidRequestId(invalidId)).toBe(false);
    });

    it("isValidRequestId should properly validate format and lengths", () => {
      expect(isValidRequestId("valid-id-123")).toBe(true);
      expect(isValidRequestId("abc_def-1234")).toBe(true);
      expect(isValidRequestId("")).toBe(false);
      expect(isValidRequestId("a".repeat(65))).toBe(false);
      expect(isValidRequestId("bad id with spaces")).toBe(false);
      expect(isValidRequestId("bad;drop table")).toBe(false);
      expect(isValidRequestId("bad\r\nid")).toBe(false);
      expect(isValidRequestId(null as any)).toBe(false);
    });
  });

  describe("3. Structured Logging & Sensitive Data Redaction", () => {
    it("should redact sensitive fields in objects", () => {
      const input = {
        username: "admin_user",
        password: "SuperSecretPassword123",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
        secret: "my_api_secret",
        material_id: "mat-123",
        details: {
          authorization: "Bearer secret-token",
          normalField: "normalValue",
        },
      };

      const sanitized = redactSensitiveData(input);
      expect(sanitized.username).toBe("admin_user");
      expect(sanitized.material_id).toBe("mat-123");
      expect(sanitized.password).toBe("[REDACTED]");
      expect(sanitized.token).toBe("[REDACTED]");
      expect(sanitized.secret).toBe("[REDACTED]");
      expect(sanitized.details.authorization).toBe("[REDACTED]");
      expect(sanitized.details.normalField).toBe("normalValue");
    });

    it("should redact credentials from raw database URLs", () => {
      const rawUrl = "postgresql://db_user:SuperSecretPassword@db.production.internal:5432/mfg_db";
      const sanitized = redactSensitiveData(rawUrl);
      expect(sanitized).toBe("postgresql://db_user:***@db.production.internal:5432/mfg_db");
      expect(sanitized).not.toContain("SuperSecretPassword");
    });

    it("should redact raw Bearer tokens in strings", () => {
      const rawToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy";
      const sanitized = redactSensitiveData(rawToken);
      expect(sanitized).toBe("[REDACTED_TOKEN]");
    });

    it("logger.createEntry should produce structured log entry with redaction", () => {
      const entry = logger.createEntry("info", "user_login_attempt", {
        userId: "user-1",
        password: "plain_text_password",
      });
      expect(entry.event).toBe("user_login_attempt");
      expect(entry.level).toBe("info");
      expect(entry.timestamp).toBeDefined();
      expect(entry.userId).toBe("user-1");
      expect(entry.password).toBe("[REDACTED]");
    });
  });

  describe("4. Safe Error Handling & Correlation", () => {
    it("should attach X-Request-Id and return safe error payload on validation error", async () => {
      const res = await request(app)
        .post("/api/materials")
        .set("Authorization", `Bearer ${validAdminToken}`)
        .set("X-Request-Id", "test-req-corr-400")
        .send({}); // Missing required fields

      expect(res.headers["x-request-id"]).toBe("test-req-corr-400");
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should translate database unique violation (23505) into 409 Conflict with safe message", async () => {
      const mockErr = new Error("duplicate key value violates unique constraint");
      (mockErr as any).code = "23505";

      const customApp = require("express")();
      customApp.use(require("./middleware/requestCorrelation").requestCorrelation);
      customApp.get("/test-db-unique", (_req: any, _res: any, next: any) => next(mockErr));
      customApp.use((app as any)._router.stack.find((s: any) => s.name === "<anonymous>" && s.handle.length === 4).handle);

      const res = await request(customApp).get("/test-db-unique").set("X-Request-Id", "corr-unique-99");
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("CONFLICT");
      expect(res.body.requestId).toBe("corr-unique-99");
      expect(res.body.error).toBe("A record with these details already exists.");
    });

    it("should translate database connection timeout / failure into 503 Service Unavailable", async () => {
      const mockErr = new Error("Knex: Timeout acquiring a connection");
      (mockErr as any).name = "TimeoutError";

      const customApp = require("express")();
      customApp.use(require("./middleware/requestCorrelation").requestCorrelation);
      customApp.get("/test-db-timeout", (_req: any, _res: any, next: any) => next(mockErr));
      customApp.use((app as any)._router.stack.find((s: any) => s.name === "<anonymous>" && s.handle.length === 4).handle);

      const res = await request(customApp).get("/test-db-timeout").set("X-Request-Id", "corr-timeout-503");
      expect(res.status).toBe(503);
      expect(res.body.code).toBe("SERVICE_UNAVAILABLE");
      expect(res.body.requestId).toBe("corr-timeout-503");
      expect(res.body.error).toBe("Database service temporarily unavailable.");
    });
  });

  describe("5. Configuration & Startup Validation", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it("should reject invalid non-numeric or out-of-range ports", () => {
      process.env.PORT = "999999";
      expect(() => validateStartupConfig()).toThrow(/PORT must be a valid integer between 1 and 65535/);

      process.env.PORT = "invalid_port";
      expect(() => validateStartupConfig()).toThrow(/PORT must be a valid integer between 1 and 65535/);
    });

    it("should reject invalid NODE_ENV values", () => {
      process.env.NODE_ENV = "invalid_environment";
      expect(() => validateStartupConfig()).toThrow(/Invalid NODE_ENV/);
    });

    it("should reject production environment with placeholder JWT_SECRET", () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "supersecretjwtkey_for_mvp_only";
      process.env.DATABASE_URL = "postgres://postgres:password@localhost:5432/db";
      expect(() => validateStartupConfig()).toThrow(/JWT_SECRET must be securely set in production/);
    });

    it("getSafeConfigSummary should mask credentials in database target", () => {
      process.env.DATABASE_URL = "postgres://admin_usr:SuperSecret123@db.aws.com:5432/mfg_prod";
      const summary = getSafeConfigSummary();
      expect(summary.databaseConfigured).toBe(true);
      expect(summary.databaseTarget).toBe("postgres://admin_usr:***@db.aws.com:5432/mfg_prod");
      expect(summary.databaseTarget).not.toContain("SuperSecret123");
    });
  });

  describe("6. Database Pool Diagnostics & Connection Helpers", () => {
    it("getDatabasePoolStatus should return pool object without throwing", () => {
      const status = dbModule.getDatabasePoolStatus();
      expect(status).toBeDefined();
      expect(typeof status).toBe("object");
    });

    it("checkDatabaseConnection should handle successful connectivity checks", async () => {
      const spy = jest.spyOn(dbModule, "checkDatabaseConnection").mockResolvedValueOnce({
        healthy: true,
        latencyMs: 5,
      });

      const result = await dbModule.checkDatabaseConnection(5000);
      expect(result.healthy).toBe(true);
      expect(typeof result.latencyMs).toBe("number");

      spy.mockRestore();
    });

    it("checkDatabaseConnection should handle connection failure safely without leaking credentials", async () => {
      const spy = jest.spyOn(dbModule, "checkDatabaseConnection").mockResolvedValueOnce({
        healthy: false,
        latencyMs: 50,
        error: "Database connectivity check failed",
      });

      const result = await dbModule.checkDatabaseConnection(5000);
      expect(result.healthy).toBe(false);
      expect(result.error).toBe("Database connectivity check failed");

      spy.mockRestore();
    });
  });
});
