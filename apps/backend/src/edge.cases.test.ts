import request from "supertest";
import jwt from "jsonwebtoken";
import app from "./app";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only";

// Fixture UUIDs
const USER_ADMIN = "11111111-1111-1111-1111-111111111111";
const USER_MGR = "22222222-2222-2222-2222-222222222222";
const USER_WH = "33333333-3333-3333-3333-333333333333";
const USER_PROD = "44444444-4444-4444-4444-444444444444";
const USER_QC = "55555555-5555-5555-5555-555555555555";

const MAT_ACTIVE = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const MAT_ACTIVE_2 = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const MAT_INACTIVE = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const PROD_VALID = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const SUPP_VALID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";

const PR_PENDING = "ffffffff-ffff-ffff-ffff-ffffffffffff";
const PR_APPROVED = "12121212-1212-1212-1212-121212121212";
const PR_FULFILLED = "23232323-2323-2323-2323-232323232323";

const PO_ISSUED = "34343434-3434-3434-3434-343434343434";
const PO_COMPLETED = "45454545-4545-4545-4545-454545454545";
const PO_ITEM_1 = "56565656-5656-5656-5656-565656565656";

const PRODO_PLANNED = "67676767-6767-6767-6767-676767676767";
const PRODO_READY = "78787878-7878-7878-7878-787878787878";
const PRODO_COMPLETED = "89898989-8989-8989-8989-898989898989";
const PRODO_CANCELLED = "9a9a9a9a-9a9a-9a9a-9a9a-9a9a9a9a9a9a";

const PROD_REC_1 = "abababab-abab-abab-abab-abababababab";
const PROD_REC_INSPECTED = "bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc";

interface State {
  materials: any[];
  inventory: any[];
  inventory_transactions: any[];
  products: any[];
  suppliers: any[];
  purchase_requests: any[];
  purchase_request_items: any[];
  purchase_orders: any[];
  purchase_order_items: any[];
  goods_receipts: any[];
  goods_receipt_items: any[];
  production_orders: any[];
  production_order_materials: any[];
  material_reservations: any[];
  production_records: any[];
  quality_inspections: any[];
  defect_records: any[];
  finished_goods_records: any[];
  audit_logs: any[];
}

const buildMockState = (): State => ({
  materials: [
    { id: MAT_ACTIVE, sku: "MAT-ACT-1", name: "Active Material 1", unit: "kg", is_active: true },
    { id: MAT_ACTIVE_2, sku: "MAT-ACT-2", name: "Active Material 2", unit: "kg", is_active: true },
    { id: MAT_INACTIVE, sku: "MAT-INACT", name: "Discontinued Material", unit: "kg", is_active: false },
  ],
  inventory: [
    { material_id: MAT_ACTIVE, available_stock: 100, reserved_stock: 0 },
    { material_id: MAT_ACTIVE_2, available_stock: 10, reserved_stock: 0 },
    { material_id: MAT_INACTIVE, available_stock: 0, reserved_stock: 0 },
  ],
  inventory_transactions: [],
  products: [
    { id: PROD_VALID, sku: "PROD-1", name: "Precision Industrial Motor", unit: "unit" },
  ],
  suppliers: [
    { id: SUPP_VALID, name: "Apex Industrial Supplies", is_active: true },
  ],
  purchase_requests: [
    { id: PR_PENDING, user_id: USER_MGR, request_date: "2026-10-10", status: "Pending" },
    { id: PR_APPROVED, user_id: USER_MGR, request_date: "2026-10-10", status: "Approved" },
    { id: PR_FULFILLED, user_id: USER_MGR, request_date: "2026-10-09", status: "Fulfilled" },
  ],
  purchase_request_items: [
    { id: "pri-1", pr_id: PR_APPROVED, material_id: MAT_ACTIVE, quantity: 50 },
  ],
  purchase_orders: [
    { id: PO_ISSUED, pr_id: PR_APPROVED, supplier_id: SUPP_VALID, user_id: USER_ADMIN, issue_date: "2026-10-10", status: "Issued" },
    { id: PO_COMPLETED, pr_id: null, supplier_id: SUPP_VALID, user_id: USER_ADMIN, issue_date: "2026-10-08", status: "Completed" },
  ],
  purchase_order_items: [
    { id: PO_ITEM_1, po_id: PO_ISSUED, material_id: MAT_ACTIVE, quantity: 50, unit_price: 25 },
  ],
  goods_receipts: [],
  goods_receipt_items: [],
  production_orders: [
    { id: PRODO_PLANNED, product_id: PROD_VALID, planned_quantity: 5, status: "Planned" },
    { id: PRODO_READY, product_id: PROD_VALID, planned_quantity: 5, status: "Ready" },
    { id: PRODO_COMPLETED, product_id: PROD_VALID, planned_quantity: 5, status: "Completed" },
    { id: PRODO_CANCELLED, product_id: PROD_VALID, planned_quantity: 5, status: "Cancelled" },
  ],
  production_order_materials: [
    { id: "pom-1", prodo_id: PRODO_PLANNED, material_id: MAT_ACTIVE, required_quantity: 20 },
    { id: "pom-2", prodo_id: PRODO_READY, material_id: MAT_ACTIVE, required_quantity: 20 },
  ],
  material_reservations: [
    { id: "res-1", prodo_id: PRODO_READY, material_id: MAT_ACTIVE, reserved_quantity: 20 },
  ],
  production_records: [
    { id: PROD_REC_1, prodo_id: PRODO_READY, actual_quantity_produced: 5, completion_date: "2026-10-10" },
    { id: PROD_REC_INSPECTED, prodo_id: PRODO_COMPLETED, actual_quantity_produced: 5, completion_date: "2026-10-09" },
  ],
  quality_inspections: [
    { id: "qi-already", production_record_id: PROD_REC_INSPECTED, inspector_id: USER_QC, pass_quantity: 5, fail_quantity: 0, inspection_date: "2026-10-09" },
  ],
  defect_records: [],
  finished_goods_records: [],
  audit_logs: [],
});

let dbState: State = buildMockState();

jest.mock("./db", () => {
  const queryBuilder = (tableName: string) => {
    let whereClauses: Array<{ field?: string; val?: any; rawFn?: (item: any) => boolean }> = [];
    let joins: Array<{ table: string; left: string; right: string }> = [];

    const builder: any = {
      forUpdate: () => builder,
      leftJoin: (tbl: string, l: string, _op: string, r: string) => {
        joins.push({ table: tbl, left: l, right: r });
        return builder;
      },
      join: (tbl: string, l: string, _op?: string, r?: string) => {
        joins.push({ table: tbl, left: l, right: r || _op || "" });
        return builder;
      },
      select: (..._fields: any[]) => builder,
      where: (arg1: any, arg2?: any) => {
        if (typeof arg1 === "object") {
          whereClauses.push({
            rawFn: (item) => Object.entries(arg1).every(([k, v]) => item[k] === v),
          });
        } else if (arg2 !== undefined) {
          const colName = (arg1.includes(".") ? arg1.split(".").pop() : arg1) || arg1;
          whereClauses.push({ field: colName, val: arg2 });
        }
        return builder;
      },
      whereIn: (field: string, values: any[]) => {
        const colName = (field.includes(".") ? field.split(".").pop() : field) || field;
        whereClauses.push({
          rawFn: (item) => values.includes(item[colName]),
        });
        return builder;
      },
      orderBy: () => builder,
      insert: (data: any) => {
        const rows = Array.isArray(data) ? data : [data];
        const inserted = rows.map((r, idx) => ({
          id: r.id || `gen-${Date.now()}-${idx}`,
          ...r,
        }));
        if (!dbState[tableName as keyof State]) {
          (dbState as any)[tableName] = [];
        }
        (dbState as any)[tableName].push(...inserted);

        const resPromise: any = Promise.resolve(inserted);
        resPromise.returning = () => Promise.resolve(inserted);
        return resPromise;
      },
      update: async (data: any) => {
        const rows = (dbState as any)[tableName] || [];
        for (const row of rows) {
          const matches = whereClauses.every((w) => {
            if (w.rawFn) return w.rawFn(row);
            if (w.field) return row[w.field] === w.val;
            return true;
          });
          if (matches) {
            Object.assign(row, data);
          }
        }
        return [1];
      },
      delete: async () => {
        const rows = (dbState as any)[tableName] || [];
        (dbState as any)[tableName] = rows.filter((row: any) => {
          return !whereClauses.every((w) => {
            if (w.rawFn) return w.rawFn(row);
            if (w.field) return row[w.field] === w.val;
            return true;
          });
        });
        return [1];
      },
      first: async () => {
        const rows = await builder.then();
        return rows[0] || null;
      },
      then: async (resolve?: (val: any) => any) => {
        let items = [...((dbState as any)[tableName] || [])];
        if (joins.length > 0) {
          for (const j of joins) {
            const joinedTable = (dbState as any)[j.table] || [];
            items = items.map((mainItem) => {
              const joinedItem = joinedTable.find((jt: any) => {
                if (j.table === "production_orders") return jt.id === mainItem.prodo_id;
                return false;
              });
              if (joinedItem) {
                return { ...mainItem, product_id: joinedItem.product_id };
              }
              return mainItem;
            });
          }
        }
        for (const w of whereClauses) {
          if (w.rawFn) {
            items = items.filter(w.rawFn);
          } else if (w.field) {
            items = items.filter((it: any) => it[w.field!] === w.val);
          }
        }
        if (resolve) return resolve(items);
        return items;
      },
    };
    return builder;
  };

  const mDb: any = (table: string) => queryBuilder(table);
  mDb.fn = { now: () => new Date() };
  mDb.transaction = jest.fn(async (cb: any) => {
    // Snapshot state to support atomic transaction rollback
    const snapshot = JSON.stringify(dbState);
    try {
      return await cb(mDb);
    } catch (err) {
      dbState = JSON.parse(snapshot);
      throw err;
    }
  });
  return mDb;
});

describe("Phase 13.5 — Data Validation & Edge Cases Comprehensive Suite", () => {
  beforeEach(() => {
    dbState = buildMockState();
  });

  const adminToken = jwt.sign({ userId: USER_ADMIN, role: "Admin" }, JWT_SECRET);
  const mgrToken = jwt.sign({ userId: USER_MGR, role: "Manager" }, JWT_SECRET);
  const whToken = jwt.sign({ userId: USER_WH, role: "Warehouse" }, JWT_SECRET);
  const prodToken = jwt.sign({ userId: USER_PROD, role: "Production" }, JWT_SECRET);
  const qcToken = jwt.sign({ userId: USER_QC, role: "Quality Control" }, JWT_SECRET);

  // ── 1. Insufficient Stock & Boundary Checks ─────────────────────────────────
  describe("1. Insufficient Stock & Stock Movement Boundaries", () => {
    it("fails with 409 when reservation exceeds available stock", async () => {
      // PRODO_PLANNED requires 20 kg of MAT_ACTIVE_2, but only 10 kg is available
      dbState.production_order_materials = [
        { id: "pom-excess", prodo_id: PRODO_PLANNED, material_id: MAT_ACTIVE_2, required_quantity: 20 },
      ];

      const res = await request(app)
        .post(`/api/production/${PRODO_PLANNED}/reserve`)
        .set("Authorization", `Bearer ${prodToken}`);

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("CONFLICT");
      expect(res.body.error).toContain("Insufficient available stock");

      // Verify atomic rollback: no reservation created, available stock intact
      const inv = dbState.inventory.find((i) => i.material_id === MAT_ACTIVE_2);
      expect(inv.available_stock).toBe(10);
      expect(inv.reserved_stock).toBe(0);
    });

    it("fails with 409 when inventory manual adjustment drives stock below zero", async () => {
      const res = await request(app)
        .post("/api/inventory/transaction")
        .set("Authorization", `Bearer ${whToken}`)
        .send({
          material_id: MAT_ACTIVE_2,
          quantity_change: -50, // Available is 10, cannot subtract 50
          type: "Adjustment",
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("CONFLICT");
    });

    it("fails with 400 when receipt transaction has negative quantity", async () => {
      const res = await request(app)
        .post("/api/inventory/transaction")
        .set("Authorization", `Bearer ${whToken}`)
        .send({
          material_id: MAT_ACTIVE,
          quantity_change: -10,
          type: "Receipt",
        });

      expect(res.status).toBe(400);
    });
  });

  // ── 2. Inactive Materials Guard ─────────────────────────────────────────────
  describe("2. Inactive Material Rejection", () => {
    it("rejects Purchase Request creation referencing inactive material", async () => {
      const res = await request(app)
        .post("/api/procurement/pr")
        .set("Authorization", `Bearer ${mgrToken}`)
        .send({
          items: [
            { material_id: MAT_INACTIVE, quantity: 15 },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("BAD_REQUEST");
      expect(res.body.error).toContain("inactive or do not exist");
    });

    it("rejects Production Order BOM referencing inactive material", async () => {
      const res = await request(app)
        .post("/api/production")
        .set("Authorization", `Bearer ${prodToken}`)
        .send({
          product_id: PROD_VALID,
          planned_quantity: 10,
          materials: [
            { material_id: MAT_INACTIVE, required_quantity: 5 },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("BAD_REQUEST");
      expect(res.body.error).toContain("inactive or do not exist");
    });

    it("rejects inventory transactions for inactive material", async () => {
      const res = await request(app)
        .post("/api/inventory/transaction")
        .set("Authorization", `Bearer ${whToken}`)
        .send({
          material_id: MAT_INACTIVE,
          quantity_change: 10,
          type: "Receipt",
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });
  });

  // ── 3. Invalid BOM Structure ────────────────────────────────────────────────
  describe("3. Invalid Bill of Materials (BOM)", () => {
    it("rejects Production Order with empty materials array", async () => {
      const res = await request(app)
        .post("/api/production")
        .set("Authorization", `Bearer ${prodToken}`)
        .send({
          product_id: PROD_VALID,
          planned_quantity: 10,
          materials: [],
        });

      expect(res.status).toBe(400);
    });

    it("rejects Production Order with duplicate materials in the same BOM", async () => {
      const res = await request(app)
        .post("/api/production")
        .set("Authorization", `Bearer ${prodToken}`)
        .send({
          product_id: PROD_VALID,
          planned_quantity: 10,
          materials: [
            { material_id: MAT_ACTIVE, required_quantity: 5 },
            { material_id: MAT_ACTIVE, required_quantity: 10 },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Duplicate materials");
    });

    it("rejects Production Order for non-existent product", async () => {
      const res = await request(app)
        .post("/api/production")
        .set("Authorization", `Bearer ${prodToken}`)
        .send({
          product_id: "00000000-0000-0000-0000-000000000000",
          planned_quantity: 5,
          materials: [{ material_id: MAT_ACTIVE, required_quantity: 10 }],
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });
  });

  // ── 4. Duplicate Transactions & Re-execution Guards ─────────────────────────
  describe("4. Duplicate Transactions & Re-execution Guards", () => {
    it("rejects duplicate QC inspection on the same production record", async () => {
      const res = await request(app)
        .post("/api/quality")
        .set("Authorization", `Bearer ${qcToken}`)
        .send({
          production_record_id: PROD_REC_INSPECTED,
          pass_quantity: 5,
          fail_quantity: 0,
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("CONFLICT");
      expect(res.body.error).toContain("Inspection already exists");
    });

    it("rejects Goods Receipt with received quantity exceeding ordered quantity", async () => {
      const res = await request(app)
        .post("/api/procurement/gr")
        .set("Authorization", `Bearer ${whToken}`)
        .send({
          po_id: PO_ISSUED,
          items: [{ po_item_id: PO_ITEM_1, received_quantity: 100 }], // Ordered is 50
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("BAD_REQUEST");
      expect(res.body.error).toContain("Received quantity cannot exceed PO quantity");
    });

    it("rejects Goods Receipt against already Completed PO", async () => {
      const res = await request(app)
        .post("/api/procurement/gr")
        .set("Authorization", `Bearer ${whToken}`)
        .send({
          po_id: PO_COMPLETED,
          items: [{ po_item_id: PO_ITEM_1, received_quantity: 10 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("PO is not issued");
    });

    it("rejects creating PO from an already fulfilled PR", async () => {
      const res = await request(app)
        .post("/api/procurement/po")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          pr_id: PR_FULFILLED,
          supplier_id: SUPP_VALID,
          items: [{ material_id: MAT_ACTIVE, quantity: 10, unit_price: 15 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("PR is not approved");
    });
  });

  // ── 5. State Machine & Approval Transitions ─────────────────────────────────
  describe("5. State Machine & Approval Transitions", () => {
    it("rejects approval transition on PR that is not in Pending status", async () => {
      const res = await request(app)
        .patch(`/api/procurement/pr/${PR_APPROVED}/approve`)
        .set("Authorization", `Bearer ${mgrToken}`)
        .send({ status: "Approved" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("PR is not pending");
    });

    it("rejects material reservation on a production order that is already Ready", async () => {
      const res = await request(app)
        .post(`/api/production/${PRODO_READY}/reserve`)
        .set("Authorization", `Bearer ${prodToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid status for reservation");
    });

    it("rejects recording production on a Planned order (not yet Ready)", async () => {
      const res = await request(app)
        .post(`/api/production/${PRODO_PLANNED}/record`)
        .set("Authorization", `Bearer ${prodToken}`)
        .send({ actual_quantity_produced: 5 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Order is not ready");
    });

    it("rejects cancelling a completed production order", async () => {
      const res = await request(app)
        .post(`/api/production/${PRODO_COMPLETED}/cancel`)
        .set("Authorization", `Bearer ${prodToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Cannot cancel completed or already cancelled order");
    });

    it("rejects cancelling an already cancelled production order", async () => {
      const res = await request(app)
        .post(`/api/production/${PRODO_CANCELLED}/cancel`)
        .set("Authorization", `Bearer ${prodToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Cannot cancel completed or already cancelled order");
    });
  });

  // ── 6. Quality Control Defect & Quantity Mismatches ──────────────────────────
  describe("6. Quality Control Quantity & Defect Mismatches", () => {
    it("rejects QC inspection where pass + fail does not equal produced quantity", async () => {
      // PROD_REC_1 produced 5 units
      const res = await request(app)
        .post("/api/quality")
        .set("Authorization", `Bearer ${qcToken}`)
        .send({
          production_record_id: PROD_REC_1,
          pass_quantity: 3,
          fail_quantity: 1, // Sum is 4, mismatch with produced 5
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("BAD_REQUEST");
      expect(res.body.error).toContain("Pass and fail quantity must equal total produced quantity");
    });

    it("rejects QC inspection with fail quantity > 0 but missing defect records", async () => {
      const res = await request(app)
        .post("/api/quality")
        .set("Authorization", `Bearer ${qcToken}`)
        .send({
          production_record_id: PROD_REC_1,
          pass_quantity: 3,
          fail_quantity: 2,
          defects: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("BAD_REQUEST");
      expect(res.body.error).toContain("Defect quantities must equal fail quantity");
    });

    it("rejects QC inspection where sum of defects does not match fail quantity", async () => {
      const res = await request(app)
        .post("/api/quality")
        .set("Authorization", `Bearer ${qcToken}`)
        .send({
          production_record_id: PROD_REC_1,
          pass_quantity: 3,
          fail_quantity: 2,
          defects: [
            { defect_reason: "Dimensional variance", quantity: 1 }, // Sum is 1, expected 2
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("BAD_REQUEST");
      expect(res.body.error).toContain("Defect quantities must equal fail quantity");
    });

    it("rejects QC inspection for non-existent production record", async () => {
      const res = await request(app)
        .post("/api/quality")
        .set("Authorization", `Bearer ${qcToken}`)
        .send({
          production_record_id: "00000000-0000-0000-0000-000000000000",
          pass_quantity: 5,
          fail_quantity: 0,
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });
  });
});
