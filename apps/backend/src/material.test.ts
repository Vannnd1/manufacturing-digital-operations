import request from "supertest";
import app from "./app";
import jwt from "jsonwebtoken";

jest.mock("./db", () => {
  const mDb: any = jest.fn((table: string) => {
    if (table === "materials") {
      return {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: "mat-1", sku: "SKU-01", name: "Steel", unit: "kg", min_stock_threshold: 100, is_active: true }]),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb([{ id: "mat-1", sku: "SKU-01", name: "Steel", unit: "kg", min_stock_threshold: 100, is_active: true }])),
      };
    }
    if (table === "inventory") {
      return {
        insert: jest.fn().mockResolvedValue([1]),
      };
    }
    if (table === "audit_logs") {
      return { insert: jest.fn().mockResolvedValue([1]) };
    }
    return {};
  });
  return mDb;
});

describe("Material API", () => {
  const token = jwt.sign({ userId: "user-1", role: "Admin" }, process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only");

  it("should create material successfully", async () => {
    const res = await request(app)
      .post("/api/materials")
      .set("Authorization", `Bearer ${token}`)
      .send({ sku: "SKU-01", name: "Steel", unit: "kg", min_stock_threshold: 100 });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id", "mat-1");
  });

  it("should block unauthorized creation", async () => {
    const prodToken = jwt.sign({ userId: "user-2", role: "QC" }, process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only");
    const res = await request(app)
      .post("/api/materials")
      .set("Authorization", `Bearer ${prodToken}`)
      .send({ sku: "SKU-02", name: "Wood", unit: "kg", min_stock_threshold: 50 });
    expect(res.status).toBe(403);
  });

  it("should retrieve materials list", async () => {
    const res = await request(app).get("/api/materials").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });
});
