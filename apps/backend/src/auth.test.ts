import request from "supertest";
import app from "./app";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Mock the db module
jest.mock("./db", () => {
  const mockDb = jest.fn((table: string) => {
    if (table === "users") {
      return {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockImplementation(() => {
          // Fake user
          return Promise.resolve({
            id: "user-123",
            role_id: "role-123",
            name: "Test User",
            email: "test@example.com",
            password_hash: bcrypt.hashSync("password123", 10),
            is_active: true,
          });
        }),
      };
    }
    if (table === "roles") {
      return {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: "role-123", name: "Admin" }),
      };
    }
    if (table === "audit_logs") {
      return { insert: jest.fn().mockResolvedValue([1]) };
    }
    return {};
  });
  return mockDb;
});

describe("Auth & RBAC Flow", () => {
  let token = "";

  it("should fail login with invalid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHORIZED");
  });

  it("should succeed login with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.role).toBe("Admin");
    token = res.body.token;
  });

  it("should fail protected route without token", async () => {
    const res = await request(app).get("/api/protected");
    expect(res.status).toBe(401);
  });

  it("should access protected route with token", async () => {
    const res = await request(app)
      .get("/api/protected")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("You are authenticated");
  });

  it("should allow admin to access admin-only route", async () => {
    const res = await request(app)
      .get("/api/admin-only")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("should block non-admin from admin-only route", async () => {
    const nonAdminToken = jwt.sign(
      { userId: "user-123", role: "Warehouse" },
      process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only"
    );
    const res = await request(app)
      .get("/api/admin-only")
      .set("Authorization", `Bearer ${nonAdminToken}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });
});
