import request from "supertest";
import app from "./app";
import jwt from "jsonwebtoken";

const validSupplierId = "22222222-2222-2222-2222-222222222222";
const notFoundSupplierId = "99999999-9999-9999-9999-999999999999";

const mockSuppliers = [
  { id: validSupplierId, name: "Supplier A", contact_info: "123-456", is_active: true },
  { id: "33333333-3333-3333-3333-333333333333", name: "Supplier B (Inactive)", contact_info: "789-012", is_active: false }
];

jest.mock("./db", () => {
  const mDb: any = jest.fn((table: string) => {
    if (table === "suppliers") {
      let isIdLookup: string | null = null;
      let rawCheck: string | null = null;

      const builder: any = {
        whereRaw: jest.fn((sql: string, bindings: any[]) => {
          rawCheck = bindings?.[0];
          return builder;
        }),
        where: jest.fn((clause: any) => {
          if (clause && clause.id) isIdLookup = clause.id;
          return builder;
        }),
        first: jest.fn(() => {
          if (rawCheck === "duplicate supplier") {
            return Promise.resolve({ id: "sup-dup", name: "Duplicate Supplier" });
          }
          if (isIdLookup === validSupplierId) {
            return Promise.resolve(mockSuppliers[0]);
          }
          if (isIdLookup === notFoundSupplierId) {
            return Promise.resolve(null);
          }
          return Promise.resolve(null);
        }),
        insert: jest.fn((data: any) => {
          const inserted = { id: validSupplierId, is_active: true, ...data };
          return {
            returning: jest.fn().mockResolvedValue([inserted]),
          };
        }),
        update: jest.fn((data: any) => {
          return {
            returning: jest.fn().mockResolvedValue([{ ...mockSuppliers[0], ...data }]),
          };
        }),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(mockSuppliers)),
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

describe("Supplier API", () => {
  const purchasingToken = jwt.sign(
    { userId: "user-1", role: "Purchasing" },
    process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only"
  );
  const warehouseToken = jwt.sign(
    { userId: "user-2", role: "Warehouse" },
    process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only"
  );

  it("should create supplier successfully", async () => {
    const res = await request(app)
      .post("/api/suppliers")
      .set("Authorization", `Bearer ${purchasingToken}`)
      .send({ name: "Supplier A", contact_info: "123-456" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id", validSupplierId);
  });

  it("should reject duplicate supplier creation (409 Conflict)", async () => {
    const res = await request(app)
      .post("/api/suppliers")
      .set("Authorization", `Bearer ${purchasingToken}`)
      .send({ name: "Duplicate Supplier" });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("CONFLICT");
  });

  it("should block unauthorized creation", async () => {
    const res = await request(app)
      .post("/api/suppliers")
      .set("Authorization", `Bearer ${warehouseToken}`)
      .send({ name: "Supplier B" });
    expect(res.status).toBe(403);
  });

  it("should list suppliers for authenticated users", async () => {
    const res = await request(app)
      .get("/api/suppliers")
      .set("Authorization", `Bearer ${purchasingToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should list suppliers with includeInactive parameter", async () => {
    const res = await request(app)
      .get("/api/suppliers?includeInactive=true")
      .set("Authorization", `Bearer ${warehouseToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should get supplier details by valid UUID", async () => {
    const res = await request(app)
      .get(`/api/suppliers/${validSupplierId}`)
      .set("Authorization", `Bearer ${purchasingToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(validSupplierId);
  });

  it("should return 400 when supplier ID is not a valid UUID", async () => {
    const res = await request(app)
      .get("/api/suppliers/not-a-uuid")
      .set("Authorization", `Bearer ${purchasingToken}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("should return 404 when supplier UUID does not exist", async () => {
    const res = await request(app)
      .get(`/api/suppliers/${notFoundSupplierId}`)
      .set("Authorization", `Bearer ${purchasingToken}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  it("should update supplier successfully with authorized role", async () => {
    const res = await request(app)
      .patch(`/api/suppliers/${validSupplierId}`)
      .set("Authorization", `Bearer ${purchasingToken}`)
      .send({ contact_info: "999-888" });
    expect(res.status).toBe(200);
    expect(res.body.contact_info).toBe("999-888");
  });

  it("should block unauthorized supplier update (403)", async () => {
    const res = await request(app)
      .patch(`/api/suppliers/${validSupplierId}`)
      .set("Authorization", `Bearer ${warehouseToken}`)
      .send({ contact_info: "999-888" });
    expect(res.status).toBe(403);
  });
});
