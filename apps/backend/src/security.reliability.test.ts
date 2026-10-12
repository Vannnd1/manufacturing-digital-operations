import request from "supertest";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import app from "./app";
import { validateStartupConfig } from "./config/env";

// ---------------------------------------------------------------------------
// Stateful In-Memory Database Mock for Security & Reliability Hardening Tests
// ---------------------------------------------------------------------------

const USER_ADMIN_ID = crypto.randomUUID();
const USER_MANAGER_ID = crypto.randomUUID();
const USER_PURCHASING_ID = crypto.randomUUID();
const USER_WAREHOUSE_ID = crypto.randomUUID();
const USER_PRODUCTION_ID = crypto.randomUUID();
const USER_QC_ID = crypto.randomUUID();

const MAT_ID = crypto.randomUUID();
const SUPP_ACTIVE_ID = crypto.randomUUID();
const SUPP_INACTIVE_ID = crypto.randomUUID();

let dbState: {
  users: any[];
  roles: any[];
  materials: any[];
  inventory: any[];
  suppliers: any[];
  purchase_requests: any[];
  purchase_request_items: any[];
  purchase_orders: any[];
  purchase_order_items: any[];
  goods_receipts: any[];
  goods_receipt_items: any[];
  audit_logs: any[];
};

const createInitialState = () => ({
  users: [
    { id: USER_ADMIN_ID, name: "Admin", email: "admin@example.com", role_id: "role-admin", is_active: true },
    { id: USER_MANAGER_ID, name: "Manager", email: "manager@example.com", role_id: "role-manager", is_active: true },
    { id: USER_PURCHASING_ID, name: "Purchaser", email: "purchasing@example.com", role_id: "role-purchasing", is_active: true },
    { id: USER_WAREHOUSE_ID, name: "Warehouse", email: "warehouse@example.com", role_id: "role-warehouse", is_active: true },
    { id: USER_PRODUCTION_ID, name: "Production", email: "production@example.com", role_id: "role-production", is_active: true },
    { id: USER_QC_ID, name: "QC", email: "qc@example.com", role_id: "role-qc", is_active: true },
  ],
  roles: [
    { id: "role-admin", name: "Admin" },
    { id: "role-manager", name: "Manager" },
    { id: "role-purchasing", name: "Purchasing" },
    { id: "role-warehouse", name: "Warehouse" },
    { id: "role-production", name: "Production" },
    { id: "role-qc", name: "QC" },
  ],
  materials: [
    { id: MAT_ID, sku: "MAT-SEC-01", name: "Security Steel Plate", unit: "kg", min_stock_threshold: 10, is_active: true },
  ],
  inventory: [
    { material_id: MAT_ID, available_stock: 100, reserved_stock: 0 },
  ],
  suppliers: [
    { id: SUPP_ACTIVE_ID, name: "Active Supplier Ltd", is_active: true },
    { id: SUPP_INACTIVE_ID, name: "Decommissioned Supplier Ltd", is_active: false },
  ],
  purchase_requests: [],
  purchase_request_items: [],
  purchase_orders: [],
  purchase_order_items: [],
  goods_receipts: [],
  goods_receipt_items: [],
  audit_logs: [],
});

jest.mock("./db", () => {
  const createBuilder = (table: string) => {
    let whereClause: any = {};
    let selectedLimit: number | undefined;

    const builder: any = {
      where: jest.fn((w: any) => {
        if (typeof w === "object") whereClause = { ...whereClause, ...w };
        return builder;
      }),
      leftJoin: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn((l: number) => {
        selectedLimit = l;
        return builder;
      }),
      offset: jest.fn().mockReturnThis(),
      first: jest.fn(async () => {
        const rows = ((dbState as any)[table] || []).filter((item: any) => {
          for (const key of Object.keys(whereClause)) {
            if (item[key] !== whereClause[key]) return false;
          }
          return true;
        });
        return rows[0] || null;
      }),
      insert: jest.fn((records: any) => {
        const toInsert = Array.isArray(records) ? records : [records];
        const inserted = toInsert.map((r: any) => ({
          ...r,
          id: r.id || crypto.randomUUID(),
          created_at: new Date(),
        }));
        if (!(dbState as any)[table]) (dbState as any)[table] = [];
        (dbState as any)[table].push(...inserted);

        const resPromise: any = Promise.resolve(inserted);
        resPromise.returning = () => Promise.resolve(inserted);
        return resPromise;
      }),
      update: jest.fn((updateData: any) => {
        const rows = ((dbState as any)[table] || []).filter((item: any) => {
          for (const key of Object.keys(whereClause)) {
            if (item[key] !== whereClause[key]) return false;
          }
          return true;
        });
        rows.forEach((r: any) => Object.assign(r, updateData));
        const resPromise: any = Promise.resolve(rows);
        resPromise.returning = () => Promise.resolve(rows);
        return resPromise;
      }),
      then: (resolve: any, reject: any) => {
        try {
          let rows = ((dbState as any)[table] || []).filter((item: any) => {
            for (const key of Object.keys(whereClause)) {
              if (item[key] !== whereClause[key]) return false;
            }
            return true;
          });
          if (selectedLimit !== undefined) {
            rows = rows.slice(0, selectedLimit);
          }
          resolve(rows);
        } catch (e) {
          reject(e);
        }
      },
    };

    return builder;
  };

  const mDb: any = (table: string) => createBuilder(table);
  mDb.transaction = jest.fn(async (cb: any) => {
    const trx: any = (table: string) => createBuilder(table);
    return await cb(trx);
  });
  return mDb;
});

// ---------------------------------------------------------------------------
// Security & Reliability Test Suite
// ---------------------------------------------------------------------------

describe("Phase 14 — Security & Reliability Hardening Test Suite", () => {
  const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only";

  const adminToken = jwt.sign({ userId: USER_ADMIN_ID, role: "Admin" }, JWT_SECRET);
  const managerToken = jwt.sign({ userId: USER_MANAGER_ID, role: "Manager" }, JWT_SECRET);
  const purchasingToken = jwt.sign({ userId: USER_PURCHASING_ID, role: "Purchasing" }, JWT_SECRET);
  const warehouseToken = jwt.sign({ userId: USER_WAREHOUSE_ID, role: "Warehouse" }, JWT_SECRET);
  const productionToken = jwt.sign({ userId: USER_PRODUCTION_ID, role: "Production" }, JWT_SECRET);
  const qcToken = jwt.sign({ userId: USER_QC_ID, role: "QC" }, JWT_SECRET);

  beforeEach(() => {
    dbState = createInitialState();
  });

  // ── 1. HTTP Security Headers ──────────────────────────────────────────────

  describe("1. HTTP Security Headers", () => {
    it("Sends standard security headers on API responses", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
      expect(res.headers["x-frame-options"]).toBe("DENY");
      expect(res.headers["x-xss-protection"]).toBe("1; mode=block");
      expect(res.headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    });
  });

  // ── 2. Request Body Limit (DoS Protection) ────────────────────────────────

  describe("2. Request Body Size Limits", () => {
    it("Rejects requests with payload exceeding 1MB with HTTP 413", async () => {
      // Create a payload larger than 1MB
      const largeString = "a".repeat(1.2 * 1024 * 1024);
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@example.com", password: largeString });

      expect(res.status).toBe(413);
      expect(res.body.code).toBe("PAYLOAD_TOO_LARGE");
    });
  });

  // ── 3. Authentication & Claim Hardening ───────────────────────────────────

  describe("3. Authentication Token & Claim Hardening", () => {
    it("Rejects empty or whitespace-only Bearer token with 401", async () => {
      const res = await request(app)
        .get("/api/inventory")
        .set("Authorization", "Bearer    ");

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("Rejects token with missing userId or role claim with 401", async () => {
      const badToken = jwt.sign({ foo: "bar" }, JWT_SECRET);
      const res = await request(app)
        .get("/api/inventory")
        .set("Authorization", `Bearer ${badToken}`);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("Rejects expired token with 401", async () => {
      const expiredToken = jwt.sign(
        { userId: USER_ADMIN_ID, role: "Admin" },
        JWT_SECRET,
        { expiresIn: "-10s" }
      );
      const res = await request(app)
        .get("/api/inventory")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });
  });

  // ── 4. Role Enforcement on Purchase Request Creation ──────────────────────

  describe("4. Role Enforcement on Purchase Request Creation", () => {
    const validPrPayload = {
      items: [{ material_id: MAT_ID, quantity: 15 }],
    };

    it("Allows Purchasing Staff to create PR", async () => {
      const res = await request(app)
        .post("/api/procurement/pr")
        .set("Authorization", `Bearer ${purchasingToken}`)
        .send(validPrPayload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("Pending");
    });

    it("Forbids Warehouse Staff from creating PR", async () => {
      const res = await request(app)
        .post("/api/procurement/pr")
        .set("Authorization", `Bearer ${warehouseToken}`)
        .send(validPrPayload);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("Forbids QC Staff from creating PR", async () => {
      const res = await request(app)
        .post("/api/procurement/pr")
        .set("Authorization", `Bearer ${qcToken}`)
        .send(validPrPayload);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("Forbids Production Staff from creating PR", async () => {
      const res = await request(app)
        .post("/api/procurement/pr")
        .set("Authorization", `Bearer ${productionToken}`)
        .send(validPrPayload);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });
  });

  // ── 5. Separation of Duties: Self-Approval Prevention ─────────────────────

  describe("5. Separation of Duties: Purchase Request Self-Approval Prevention", () => {
    it("Prevents requester from approving their own PR (Self-Approval Forbidden)", async () => {
      // 1. Manager creates PR
      const createRes = await request(app)
        .post("/api/procurement/pr")
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ items: [{ material_id: MAT_ID, quantity: 20 }] });

      expect(createRes.status).toBe(201);
      const prId = createRes.body.id;

      // 2. The SAME Manager attempts to approve their own PR
      const approveRes = await request(app)
        .patch(`/api/procurement/pr/${prId}/approve`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ status: "Approved" });

      expect(approveRes.status).toBe(403);
      expect(approveRes.body.code).toBe("FORBIDDEN");
      expect(approveRes.body.error).toMatch(/own purchase requests/i);
    });

    it("Allows a different authorized approver (Admin) to approve the PR", async () => {
      // 1. Manager creates PR
      const createRes = await request(app)
        .post("/api/procurement/pr")
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ items: [{ material_id: MAT_ID, quantity: 20 }] });

      const prId = createRes.body.id;

      // 2. Different user (Admin) approves it
      const approveRes = await request(app)
        .patch(`/api/procurement/pr/${prId}/approve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "Approved" });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.status).toBe("Approved");
    });
  });

  // ── 6. Audit Trail RBAC & Parameter Validation ────────────────────────────

  describe("6. Audit Trail RBAC & Parameter Validation", () => {
    it("Allows Admin to access audit logs", async () => {
      const res = await request(app)
        .get("/api/audit/logs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it("Allows Manager to access audit logs", async () => {
      const res = await request(app)
        .get("/api/audit/logs")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
    });

    it("Forbids Warehouse Staff from accessing audit logs", async () => {
      const res = await request(app)
        .get("/api/audit/logs")
        .set("Authorization", `Bearer ${warehouseToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("Forbids Production Staff from accessing audit logs", async () => {
      const res = await request(app)
        .get("/api/audit/logs")
        .set("Authorization", `Bearer ${productionToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("Validates UUID params on traceability endpoints, rejecting invalid IDs with 400", async () => {
      const res = await request(app)
        .get("/api/audit/traceability/prodo/not-a-valid-uuid")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  // ── 7. Procurement & Goods Receipt Invariants ─────────────────────────────

  describe("7. Procurement & Goods Receipt Invariants", () => {
    it("Rejects Purchase Order referencing an inactive or non-existent supplier with 400", async () => {
      // 1. Create and approve PR
      const createRes = await request(app)
        .post("/api/procurement/pr")
        .set("Authorization", `Bearer ${purchasingToken}`)
        .send({ items: [{ material_id: MAT_ID, quantity: 10 }] });

      const prId = createRes.body.id;
      await request(app)
        .patch(`/api/procurement/pr/${prId}/approve`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ status: "Approved" });

      // 2. Try creating PO with inactive supplier
      const poRes = await request(app)
        .post("/api/procurement/po")
        .set("Authorization", `Bearer ${purchasingToken}`)
        .send({
          pr_id: prId,
          supplier_id: SUPP_INACTIVE_ID,
          items: [{ material_id: MAT_ID, quantity: 10, unit_price: 50 }],
        });

      expect(poRes.status).toBe(400);
      expect(poRes.body.error).toMatch(/inactive|does not exist/i);
    });


    it("Rejects Goods Receipt containing duplicate po_item_id entries with 400", async () => {
      // Seed an issued PO
      const poId = crypto.randomUUID();
      const poItemId = crypto.randomUUID();
      dbState.purchase_orders.push({ id: poId, status: "Issued" });
      dbState.purchase_order_items.push({ id: poItemId, po_id: poId, material_id: MAT_ID, quantity: 20 });

      const res = await request(app)
        .post("/api/procurement/gr")
        .set("Authorization", `Bearer ${warehouseToken}`)
        .send({
          po_id: poId,
          items: [
            { po_item_id: poItemId, received_quantity: 5 },
            { po_item_id: poItemId, received_quantity: 5 },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/duplicate/i);
    });
  });

  // ── 8. Public Seed Route Protection ───────────────────────────────────────

  describe("8. Public Seed Route Protection", () => {
    it("Rejects unauthenticated call to /api/auth/seed-demo-users with 401", async () => {
      const res = await request(app).get("/api/auth/seed-demo-users");
      expect(res.status).toBe(401);
    });

    it("Rejects non-admin call to /api/auth/seed-demo-users with 403", async () => {
      const res = await request(app)
        .get("/api/auth/seed-demo-users")
        .set("Authorization", `Bearer ${warehouseToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ── 9. Startup Configuration Safety ───────────────────────────────────────

  describe("9. Startup Configuration Safety", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it("Fails fast in production if JWT_SECRET uses an insecure default fallback", () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "supersecretjwtkey_for_mvp_only";
      process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";

      expect(() => validateStartupConfig()).toThrow(/JWT_SECRET must be securely set/);
    });

    it("Fails fast in production if DATABASE_URL is missing", () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "a-very-strong-production-secret-12345";
      delete process.env.DATABASE_URL;

      expect(() => validateStartupConfig()).toThrow(/DATABASE_URL must be configured/);
    });

    it("Passes validation in production when properly configured", () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "a-very-strong-production-secret-12345";
      process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";

      expect(() => validateStartupConfig()).not.toThrow();
    });
  });
});
