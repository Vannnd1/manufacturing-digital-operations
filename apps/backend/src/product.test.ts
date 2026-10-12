import request from "supertest";
import app from "./app";
import jwt from "jsonwebtoken";

const mockProducts = [
  { id: "prod-1", sku: "PROD-ALPHA", name: "Alpha Product", unit: "pcs" },
  { id: "prod-2", sku: "PROD-BETA", name: "Beta Product", unit: "box" }
];

jest.mock("./db", () => {
  const mDb: any = jest.fn((table: string) => {
    if (table === "products") {
      let isFirst = false;
      let skuQuery: string | null = null;
      const builder: any = {
        where: jest.fn((clause: any) => {
          if (clause && clause.sku) skuQuery = clause.sku;
          return builder;
        }),
        first: jest.fn(() => {
          if (skuQuery === "PROD-EXISTS") {
            return Promise.resolve({ id: "prod-existing", sku: "PROD-EXISTS", name: "Existing" });
          }
          return Promise.resolve(null);
        }),
        insert: jest.fn((data: any) => {
          const inserted = { id: "prod-new", ...data };
          return {
            returning: jest.fn().mockResolvedValue([inserted]),
          };
        }),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(mockProducts)),
      };
      return builder;
    }
    if (table === "audit_logs") {
      return { insert: jest.fn().mockResolvedValue([1]) };
    }
    return {};
  });
  return mDb;
});

describe("Product API", () => {
  const adminToken = jwt.sign(
    { userId: "user-admin", role: "Admin" },
    process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only"
  );
  const productionToken = jwt.sign(
    { userId: "user-prod", role: "Production" },
    process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only"
  );
  const warehouseToken = jwt.sign(
    { userId: "user-wh", role: "Warehouse" },
    process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only"
  );

  it("should retrieve products list successfully for authenticated users", async () => {
    const res = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0].sku).toBe("PROD-ALPHA");
  });

  it("should create a new product successfully with Production role", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${productionToken}`)
      .send({
        sku: "PROD-GAMMA",
        name: "Gamma Component",
        unit: "pcs"
      });

    expect(res.status).toBe(201);
    expect(res.body.sku).toBe("PROD-GAMMA");
    expect(res.body.id).toBe("prod-new");
  });

  it("should reject product creation when SKU already exists (409 Conflict)", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sku: "PROD-EXISTS",
        name: "Duplicate SKU Item",
        unit: "pcs"
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("CONFLICT");
  });

  it("should block product creation for unauthorized roles like Warehouse (403)", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${warehouseToken}`)
      .send({
        sku: "PROD-WH",
        name: "Warehouse Item",
        unit: "pcs"
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("should reject invalid product schema (400 Bad Request)", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sku: "", // Empty SKU
        name: "Invalid",
        unit: "pcs"
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });
});
