import request from "supertest";
import app from "./app";
import jwt from "jsonwebtoken";

jest.mock("./db", () => {
  const mDb: any = jest.fn((table: string) => {
    if (table === "suppliers") {
      return {
        whereRaw: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: "sup-1", name: "Supplier A", is_active: true }]),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb([{ id: "sup-1", name: "Supplier A", is_active: true }])),
      };
    }
    if (table === "audit_logs") {
      return { insert: jest.fn().mockResolvedValue([1]) };
    }
    return {};
  });
  return mDb;
});

describe("Supplier API", () => {
  const token = jwt.sign({ userId: "user-1", role: "Purchasing" }, process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only");

  it("should create supplier successfully", async () => {
    const res = await request(app)
      .post("/api/suppliers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Supplier A", contact_info: "123-456" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id", "sup-1");
  });

  it("should block unauthorized creation", async () => {
    const warehouseToken = jwt.sign({ userId: "user-2", role: "Warehouse" }, process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only");
    const res = await request(app)
      .post("/api/suppliers")
      .set("Authorization", `Bearer ${warehouseToken}`)
      .send({ name: "Supplier B" });
    expect(res.status).toBe(403);
  });
});
