import request from "supertest";
import app, { isAllowedOrigin } from "./app";

describe("Health Check API", () => {
  it("should return 200 OK from /api/health", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("timestamp");
  });
});

describe("CORS Policy & Preflight Handling", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("isAllowedOrigin helper", () => {
    it("allows localhost and 127.0.0.1 development origins with any port", () => {
      expect(isAllowedOrigin("http://localhost:5173")).toBe(true);
      expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
      expect(isAllowedOrigin("http://127.0.0.1:5173")).toBe(true);
      expect(isAllowedOrigin("http://127.0.0.1:4173/")).toBe(true);
    });

    it("allows all Vercel production and preview deployment URLs (*.vercel.app)", () => {
      expect(isAllowedOrigin("https://manufacturing-digital-operations.vercel.app")).toBe(true);
      expect(isAllowedOrigin("https://manufacturing-digital-operations-git-main-vannnd1s-projects.vercel.app")).toBe(true);
      expect(isAllowedOrigin("https://preview-1234.vercel.app/")).toBe(true);
    });

    it("allows Render cloud deployment URLs (*.onrender.com)", () => {
      expect(isAllowedOrigin("https://manufacturing-digital-operations.onrender.com")).toBe(true);
    });

    it("allows explicitly configured FRONTEND_URL origins", () => {
      process.env.FRONTEND_URL = "https://custom-domain.com, https://portal.company.com/";
      expect(isAllowedOrigin("https://custom-domain.com")).toBe(true);
      expect(isAllowedOrigin("https://portal.company.com")).toBe(true);
    });

    it("rejects unauthorized external origins", () => {
      delete process.env.FRONTEND_URL;
      expect(isAllowedOrigin("https://malicious-site.com")).toBe(false);
      expect(isAllowedOrigin("https://attacker-vercel.com")).toBe(false);
    });
  });

  describe("HTTP OPTIONS Preflight requests", () => {
    it("responds 200 OK with correct CORS headers for Vercel origins", async () => {
      const origin = "https://manufacturing-digital-operations.vercel.app";
      const res = await request(app)
        .options("/api/auth/login")
        .set("Origin", origin)
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "Content-Type,Authorization");

      expect(res.status).toBe(200);
      expect(res.headers["access-control-allow-origin"]).toBe(origin);
      expect(res.headers["access-control-allow-credentials"]).toBe("true");
      expect(res.headers["access-control-allow-methods"]).toMatch(/POST/);
    });

    it("responds 200 OK with correct CORS headers for localhost origins", async () => {
      const origin = "http://localhost:5173";
      const res = await request(app)
        .options("/api/auth/login")
        .set("Origin", origin)
        .set("Access-Control-Request-Method", "POST");

      expect(res.status).toBe(200);
      expect(res.headers["access-control-allow-origin"]).toBe(origin);
    });

    it("rejects disallowed origins with 403 in production environment", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.FRONTEND_URL;

      const res = await request(app)
        .options("/api/auth/login")
        .set("Origin", "https://unauthorized-attacker.xyz")
        .set("Access-Control-Request-Method", "POST");

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.error).toBe("Origin not allowed by CORS policy");
    });
  });
});

