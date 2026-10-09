import request from "supertest";
import app from "./app";
import jwt from "jsonwebtoken";
import db from "./db";

jest.mock("./db", () => {
  const mDb: any = jest.fn((table: string) => {
    if (table === "inventory") {
      return {
        join: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([
          { material_id: "mat-1", sku: "SKU-01", name: "Steel", unit: "kg", min_stock_threshold: 100, available_stock: 50, reserved_stock: 0 }
        ]),
      };
    }
    return {};
  });
  
  mDb.transaction = jest.fn(async (cb) => {
    const trx = jest.fn((table: string) => {
      if (table === "materials") return { where: jest.fn().mockReturnThis(), first: jest.fn().mockResolvedValue({ id: "mat-1", is_active: true }) };
      if (table === "inventory") return { 
        where: jest.fn().mockReturnThis(), 
        first: jest.fn().mockResolvedValue({ available_stock: 50 }),
        update: jest.fn().mockResolvedValue([1]),
      };
      if (table === "inventory_transactions") return { insert: jest.fn().mockReturnThis(), returning: jest.fn().mockResolvedValue([{ id: "tx-1" }]) };
      if (table === "audit_logs") return { insert: jest.fn().mockResolvedValue([1]) };
      return {};
    });
    return await cb(trx);
  });
  return mDb;
});

describe("Inventory API", () => {
  const token = jwt.sign({ userId: "user-1", role: "Warehouse" }, process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only");

  it("should get inventory and detect low stock", async () => {
    const res = await request(app).get("/api/inventory").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body[0].status).toBe("Low Stock"); // 50 < 100
  });

  it("should reject invalid/negative quantity", async () => {
    const res = await request(app)
      .post("/api/inventory/transaction")
      .set("Authorization", `Bearer ${token}`)
      .send({ material_id: "e5a8f09f-4318-4c6e-b39f-b9f123456789", quantity_change: -10, type: "Receipt" });
    expect(res.status).toBe(400); // Handled by Zod validation positive()
  });

  it("should record valid inventory receipt", async () => {
    const res = await request(app)
      .post("/api/inventory/transaction")
      .set("Authorization", `Bearer ${token}`)
      .send({ material_id: "e5a8f09f-4318-4c6e-b39f-b9f123456789", quantity_change: 200, type: "Receipt" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id", "tx-1");
  });

  it("should block unauthorized users from adjusting inventory", async () => {
    const unauthorizedToken = jwt.sign({ userId: "user-qc", role: "QC" }, process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only");
    const res = await request(app)
      .post("/api/inventory/transaction")
      .set("Authorization", `Bearer ${unauthorizedToken}`)
      .send({ material_id: "e5a8f09f-4318-4c6e-b39f-b9f123456789", quantity_change: 100, type: "Receipt" });
    expect(res.status).toBe(403);
  });
});
