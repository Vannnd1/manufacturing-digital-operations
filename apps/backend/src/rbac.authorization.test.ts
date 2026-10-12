import request from "supertest";
import app from "./app";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// DB Mock for RBAC testing
// ---------------------------------------------------------------------------
jest.mock("./db", () => {
  const mDb: any = jest.fn((table: string) => {
    return {
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ id: crypto.randomUUID(), is_active: true, status: "Planned", planned_quantity: 10 }),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: crypto.randomUUID() }]),
      update: jest.fn().mockResolvedValue([1]),
      delete: jest.fn().mockResolvedValue([1]),
      join: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
    };
  });

  mDb.transaction = jest.fn(async (cb) => {
    const trx = jest.fn((table: string) => {
      return {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ 
          id: crypto.randomUUID(), 
          status: "Issued", 
          material_id: crypto.randomUUID(), 
          quantity: 10,
          is_active: true,
          available_stock: 50,
          reserved_stock: 0
        }),
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: crypto.randomUUID() }]),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockResolvedValue([1]),
        join: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
      };
    });
    return await cb(trx);
  });

  return mDb;
});

// ---------------------------------------------------------------------------
// RBAC Authorization Enforcement Test Suite
// ---------------------------------------------------------------------------

describe("Phase 13.3 — RBAC & Approval Enforcement Matrix", () => {
  const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only";

  const adminToken = jwt.sign({ userId: crypto.randomUUID(), role: "Admin" }, JWT_SECRET);
  const managerToken = jwt.sign({ userId: crypto.randomUUID(), role: "Manager" }, JWT_SECRET);
  const purchasingToken = jwt.sign({ userId: crypto.randomUUID(), role: "Purchasing" }, JWT_SECRET);
  const warehouseToken = jwt.sign({ userId: crypto.randomUUID(), role: "Warehouse" }, JWT_SECRET);
  const productionToken = jwt.sign({ userId: crypto.randomUUID(), role: "Production" }, JWT_SECRET);
  const qcToken = jwt.sign({ userId: crypto.randomUUID(), role: "QC" }, JWT_SECRET);

  const testId = crypto.randomUUID();

  // ─── 1. Authentication Safeguards ────────────────────────────────────────

  describe("1. Unauthenticated Access Protection (401)", () => {
    it("Rejects request with no Authorization header", async () => {
      const res = await request(app).get("/api/inventory");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("Rejects request with malformed or invalid token", async () => {
      const res = await request(app)
        .get("/api/materials")
        .set("Authorization", "Bearer not-a-valid-jwt-token");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });
  });

  // ─── 2. PR Approval Enforcement ──────────────────────────────────────────

  describe("2. PR Approval Enforcement: Admin & Manager Only", () => {
    it("Allows Manager to approve PR", async () => {
      const res = await request(app)
        .patch(`/api/procurement/pr/${testId}/approve`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ status: "Approved" });
      expect(res.status).not.toBe(403);
    });

    it("Allows Admin to approve PR", async () => {
      const res = await request(app)
        .patch(`/api/procurement/pr/${testId}/approve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "Approved" });
      expect(res.status).not.toBe(403);
    });

    it("Forbids Purchasing Staff from approving PR", async () => {
      const res = await request(app)
        .patch(`/api/procurement/pr/${testId}/approve`)
        .set("Authorization", `Bearer ${purchasingToken}`)
        .send({ status: "Approved" });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("Forbids Warehouse Staff from approving PR", async () => {
      const res = await request(app)
        .patch(`/api/procurement/pr/${testId}/approve`)
        .set("Authorization", `Bearer ${warehouseToken}`)
        .send({ status: "Approved" });
      expect(res.status).toBe(403);
    });

    it("Forbids Production Staff from approving PR", async () => {
      const res = await request(app)
        .patch(`/api/procurement/pr/${testId}/approve`)
        .set("Authorization", `Bearer ${productionToken}`)
        .send({ status: "Approved" });
      expect(res.status).toBe(403);
    });

    it("Forbids QC Staff from approving PR", async () => {
      const res = await request(app)
        .patch(`/api/procurement/pr/${testId}/approve`)
        .set("Authorization", `Bearer ${qcToken}`)
        .send({ status: "Approved" });
      expect(res.status).toBe(403);
    });
  });

  // ─── 3. Purchase Order Creation Enforcement ──────────────────────────────

  describe("3. PO Creation Enforcement: Admin, Manager, Purchasing", () => {
    const validPoPayload = {
      pr_id: testId,
      supplier_id: testId,
      items: [{ material_id: testId, quantity: 10, unit_price: 25 }],
    };

    it("Allows Purchasing Staff to create PO", async () => {
      const res = await request(app)
        .post("/api/procurement/po")
        .set("Authorization", `Bearer ${purchasingToken}`)
        .send(validPoPayload);
      expect(res.status).not.toBe(403);
    });

    it("Allows Manager to create PO", async () => {
      const res = await request(app)
        .post("/api/procurement/po")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(validPoPayload);
      expect(res.status).not.toBe(403);
    });

    it("Forbids Warehouse Staff from creating PO", async () => {
      const res = await request(app)
        .post("/api/procurement/po")
        .set("Authorization", `Bearer ${warehouseToken}`)
        .send(validPoPayload);
      expect(res.status).toBe(403);
    });

    it("Forbids Production Staff from creating PO", async () => {
      const res = await request(app)
        .post("/api/procurement/po")
        .set("Authorization", `Bearer ${productionToken}`)
        .send(validPoPayload);
      expect(res.status).toBe(403);
    });

    it("Forbids QC Staff from creating PO", async () => {
      const res = await request(app)
        .post("/api/procurement/po")
        .set("Authorization", `Bearer ${qcToken}`)
        .send(validPoPayload);
      expect(res.status).toBe(403);
    });
  });

  // ─── 4. Goods Receipt Enforcement ────────────────────────────────────────

  describe("4. Goods Receipt Enforcement: Admin, Manager, Warehouse", () => {
    const validGrPayload = {
      po_id: testId,
      items: [{ po_item_id: testId, received_quantity: 10 }],
    };

    it("Allows Warehouse Staff to record Goods Receipt", async () => {
      const res = await request(app)
        .post("/api/procurement/gr")
        .set("Authorization", `Bearer ${warehouseToken}`)
        .send(validGrPayload);
      expect(res.status).not.toBe(403);
    });

    it("Allows Manager to record Goods Receipt", async () => {
      const res = await request(app)
        .post("/api/procurement/gr")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(validGrPayload);
      expect(res.status).not.toBe(403);
    });

    it("Forbids Purchasing Staff from recording Goods Receipt", async () => {
      const res = await request(app)
        .post("/api/procurement/gr")
        .set("Authorization", `Bearer ${purchasingToken}`)
        .send(validGrPayload);
      expect(res.status).toBe(403);
    });

    it("Forbids Production Staff from recording Goods Receipt", async () => {
      const res = await request(app)
        .post("/api/procurement/gr")
        .set("Authorization", `Bearer ${productionToken}`)
        .send(validGrPayload);
      expect(res.status).toBe(403);
    });

    it("Forbids QC Staff from recording Goods Receipt", async () => {
      const res = await request(app)
        .post("/api/procurement/gr")
        .set("Authorization", `Bearer ${qcToken}`)
        .send(validGrPayload);
      expect(res.status).toBe(403);
    });
  });

  // ─── 5. Inventory Transaction Enforcement ────────────────────────────────

  describe("5. Inventory Adjustments: Admin, Manager, Warehouse", () => {
    const validInvPayload = {
      material_id: testId,
      quantity_change: 10,
      type: "Adjustment",
    };

    it("Allows Warehouse Staff to adjust inventory", async () => {
      const res = await request(app)
        .post("/api/inventory/transaction")
        .set("Authorization", `Bearer ${warehouseToken}`)
        .send(validInvPayload);
      expect(res.status).not.toBe(403);
    });

    it("Forbids Production Staff from manual inventory adjustment", async () => {
      const res = await request(app)
        .post("/api/inventory/transaction")
        .set("Authorization", `Bearer ${productionToken}`)
        .send(validInvPayload);
      expect(res.status).toBe(403);
    });

    it("Forbids QC Staff from manual inventory adjustment", async () => {
      const res = await request(app)
        .post("/api/inventory/transaction")
        .set("Authorization", `Bearer ${qcToken}`)
        .send(validInvPayload);
      expect(res.status).toBe(403);
    });
  });

  // ─── 6. Production Operations Enforcement ────────────────────────────────

  describe("6. Production Operations: Admin, Manager, Production", () => {
    it("Allows Production Staff to reserve materials", async () => {
      const res = await request(app)
        .post(`/api/production/${testId}/reserve`)
        .set("Authorization", `Bearer ${productionToken}`);
      expect(res.status).not.toBe(403);
    });

    it("Allows Production Staff to record production output", async () => {
      const res = await request(app)
        .post(`/api/production/${testId}/record`)
        .set("Authorization", `Bearer ${productionToken}`)
        .send({ actual_quantity_produced: 10 });
      expect(res.status).not.toBe(403);
    });

    it("Allows Production Staff to cancel production order", async () => {
      const res = await request(app)
        .post(`/api/production/${testId}/cancel`)
        .set("Authorization", `Bearer ${productionToken}`);
      expect(res.status).not.toBe(403);
    });

    it("Forbids Warehouse Staff from executing production orders", async () => {
      const res = await request(app)
        .post(`/api/production/${testId}/reserve`)
        .set("Authorization", `Bearer ${warehouseToken}`);
      expect(res.status).toBe(403);
    });

    it("Forbids Purchasing Staff from executing production orders", async () => {
      const res = await request(app)
        .post(`/api/production/${testId}/record`)
        .set("Authorization", `Bearer ${purchasingToken}`)
        .send({ actual_quantity_produced: 10 });
      expect(res.status).toBe(403);
    });

    it("Forbids QC Staff from reserving materials", async () => {
      const res = await request(app)
        .post(`/api/production/${testId}/reserve`)
        .set("Authorization", `Bearer ${qcToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ─── 7. Quality Inspection Enforcement ───────────────────────────────────

  describe("7. Quality Inspection Enforcement: Admin, Manager, QC", () => {
    const validQcPayload = {
      production_record_id: testId,
      pass_quantity: 10,
      fail_quantity: 0,
    };

    it("Allows QC Staff to record quality inspection", async () => {
      const res = await request(app)
        .post("/api/quality")
        .set("Authorization", `Bearer ${qcToken}`)
        .send(validQcPayload);
      expect(res.status).not.toBe(403);
    });

    it("Allows Manager to record quality inspection", async () => {
      const res = await request(app)
        .post("/api/quality")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(validQcPayload);
      expect(res.status).not.toBe(403);
    });

    it("Forbids Production Staff from recording inspection (Segregation of Duties)", async () => {
      const res = await request(app)
        .post("/api/quality")
        .set("Authorization", `Bearer ${productionToken}`)
        .send(validQcPayload);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("Forbids Warehouse Staff from recording inspection", async () => {
      const res = await request(app)
        .post("/api/quality")
        .set("Authorization", `Bearer ${warehouseToken}`)
        .send(validQcPayload);
      expect(res.status).toBe(403);
    });

    it("Forbids Purchasing Staff from recording inspection", async () => {
      const res = await request(app)
        .post("/api/quality")
        .set("Authorization", `Bearer ${purchasingToken}`)
        .send(validQcPayload);
      expect(res.status).toBe(403);
    });
  });
});
