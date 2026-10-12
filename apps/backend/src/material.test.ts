import request from "supertest";
import app from "./app";
import jwt from "jsonwebtoken";

const validMaterialId = "11111111-1111-1111-1111-111111111111";
const notFoundMaterialId = "99999999-9999-9999-9999-999999999999";

const mockMaterials = [
  { id: validMaterialId, sku: "SKU-01", name: "Steel Sheet", unit: "kg", min_stock_threshold: 100, is_active: true },
  { id: "33333333-3333-3333-3333-333333333333", sku: "SKU-INACTIVE", name: "Old Copper", unit: "kg", min_stock_threshold: 10, is_active: false }
];

jest.mock("./db", () => {
  const mDb: any = jest.fn((table: string) => {
    if (table === "materials") {
      let isIdLookup: string | null = null;
      let isSkuLookup: string | null = null;

      const builder: any = {
        where: jest.fn((clause: any) => {
          if (clause && clause.id) isIdLookup = clause.id;
          if (clause && clause.sku) isSkuLookup = clause.sku;
          return builder;
        }),
        first: jest.fn(() => {
          if (isSkuLookup === "SKU-EXISTS") {
            return Promise.resolve({ id: "mat-exists", sku: "SKU-EXISTS" });
          }
          if (isIdLookup === validMaterialId) {
            return Promise.resolve(mockMaterials[0]);
          }
          if (isIdLookup === notFoundMaterialId) {
            return Promise.resolve(null);
          }
          return Promise.resolve(null);
        }),
        insert: jest.fn((data: any) => {
          const inserted = { id: validMaterialId, ...data };
          return {
            returning: jest.fn().mockResolvedValue([inserted]),
          };
        }),
        update: jest.fn((data: any) => {
          return {
            returning: jest.fn().mockResolvedValue([{ ...mockMaterials[0], ...data }]),
          };
        }),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(mockMaterials)),
      };
      return builder;
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
  mDb.transaction = jest.fn(async (cb) => await cb(mDb));
  return mDb;
});

describe("Material API", () => {
  const adminToken = jwt.sign(
    { userId: "user-1", role: "Admin" },
    process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only"
  );
  const warehouseToken = jwt.sign(
    { userId: "user-wh", role: "Warehouse" },
    process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only"
  );
  const qcToken = jwt.sign(
    { userId: "user-qc", role: "QC" },
    process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only"
  );

  it("should create material successfully", async () => {
    const res = await request(app)
      .post("/api/materials")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ sku: "SKU-01", name: "Steel", unit: "kg", min_stock_threshold: 100 });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id", validMaterialId);
  });

  it("should reject material creation when SKU already exists (409 Conflict)", async () => {
    const res = await request(app)
      .post("/api/materials")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ sku: "SKU-EXISTS", name: "Existing Steel", unit: "kg", min_stock_threshold: 100 });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("CONFLICT");
  });

  it("should block unauthorized material creation (403)", async () => {
    const res = await request(app)
      .post("/api/materials")
      .set("Authorization", `Bearer ${qcToken}`)
      .send({ sku: "SKU-02", name: "Wood", unit: "kg", min_stock_threshold: 50 });
    expect(res.status).toBe(403);
  });

  it("should create material with canonical units like pcs and m", async () => {
    const resPcs = await request(app)
      .post("/api/materials")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ sku: "SKU-03", name: "Bolt", unit: "pcs", min_stock_threshold: 500 });
    expect(resPcs.status).toBe(201);

    const resM = await request(app)
      .post("/api/materials")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ sku: "SKU-04", name: "Cable", unit: "m", min_stock_threshold: 200 });
    expect(resM.status).toBe(201);
  });

  it("should reject material creation when unit is missing or empty (400 Bad Request)", async () => {
    const res = await request(app)
      .post("/api/materials")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ sku: "SKU-05", name: "EmptyUnit", unit: "", min_stock_threshold: 10 });
    expect(res.status).toBe(400);
  });

  it("should retrieve materials list", async () => {
    const res = await request(app)
      .get("/api/materials")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it("should retrieve materials with includeInactive parameter", async () => {
    const res = await request(app)
      .get("/api/materials?includeInactive=true")
      .set("Authorization", `Bearer ${warehouseToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should retrieve single material by valid UUID", async () => {
    const res = await request(app)
      .get(`/api/materials/${validMaterialId}`)
      .set("Authorization", `Bearer ${warehouseToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(validMaterialId);
  });

  it("should return 400 when material ID is not a valid UUID", async () => {
    const res = await request(app)
      .get("/api/materials/invalid-uuid")
      .set("Authorization", `Bearer ${warehouseToken}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("should return 404 when material UUID does not exist", async () => {
    const res = await request(app)
      .get(`/api/materials/${notFoundMaterialId}`)
      .set("Authorization", `Bearer ${warehouseToken}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  it("should update material successfully with Warehouse role", async () => {
    const res = await request(app)
      .patch(`/api/materials/${validMaterialId}`)
      .set("Authorization", `Bearer ${warehouseToken}`)
      .send({ min_stock_threshold: 150 });
    expect(res.status).toBe(200);
    expect(res.body.min_stock_threshold).toBe(150);
  });

  it("should block unauthorized material update for QC role (403)", async () => {
    const res = await request(app)
      .patch(`/api/materials/${validMaterialId}`)
      .set("Authorization", `Bearer ${qcToken}`)
      .send({ min_stock_threshold: 150 });
    expect(res.status).toBe(403);
  });

  it("should return 404 when updating non-existent material UUID", async () => {
    const res = await request(app)
      .patch(`/api/materials/${notFoundMaterialId}`)
      .set("Authorization", `Bearer ${warehouseToken}`)
      .send({ min_stock_threshold: 150 });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});
