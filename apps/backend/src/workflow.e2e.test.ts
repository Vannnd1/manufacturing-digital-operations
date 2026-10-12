import request from "supertest";
import app from "./app";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Stateful In-Memory Database Mock for End-to-End Workflow Integration
// ---------------------------------------------------------------------------

// Pre-seeded master data UUIDs (valid UUID format required by Zod)
const MAT_1_ID = crypto.randomUUID();
const PROD_1_ID = crypto.randomUUID();
const SUP_1_ID = crypto.randomUUID();
const USER_PURCHASING_ID = crypto.randomUUID();
const USER_MANAGER_ID = crypto.randomUUID();
const USER_WAREHOUSE_ID = crypto.randomUUID();
const USER_PRODUCTION_ID = crypto.randomUUID();
const USER_QC_ID = crypto.randomUUID();

interface DbState {
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

const createInitialState = (): DbState => ({
  materials: [
    {
      id: MAT_1_ID,
      sku: "MAT-STEEL-001",
      name: "Industrial Steel Plate",
      unit: "kg",
      min_stock_threshold: 20,
      is_active: true,
    },
  ],
  inventory: [
    {
      material_id: MAT_1_ID,
      available_stock: 0,
      reserved_stock: 0,
    },
  ],
  inventory_transactions: [],
  products: [
    {
      id: PROD_1_ID,
      sku: "PROD-PANEL-01",
      name: "Reinforced Steel Panel",
      unit: "pcs",
    },
  ],
  suppliers: [
    {
      id: SUP_1_ID,
      name: "Global Industrial Metals Corp",
      contact_info: "supply@globalmetals.example",
      is_active: true,
    },
  ],
  purchase_requests: [],
  purchase_request_items: [],
  purchase_orders: [],
  purchase_order_items: [],
  goods_receipts: [],
  goods_receipt_items: [],
  production_orders: [],
  production_order_materials: [],
  material_reservations: [],
  production_records: [],
  quality_inspections: [],
  defect_records: [],
  finished_goods_records: [],
  audit_logs: [],
});

let dbState: DbState = createInitialState();

const createQueryBuilder = (tableName: string) => {
  let whereClauses: Array<{ field?: string; op?: string; val?: any; raw?: (item: any) => boolean }> = [];
  let joins: Array<{ table: string; first: string; second: string; type?: string }> = [];
  let selectFields: string[] = [];
  let orderField: string | null = null;
  let orderDir: "asc" | "desc" = "asc";

  const getTableData = (table: string): any[] => {
    return (dbState as any)[table] || [];
  };

  const builder: any = {
    where: (clauseOrField: any, opOrVal?: any, val?: any) => {
      if (typeof clauseOrField === "object" && clauseOrField !== null) {
        Object.entries(clauseOrField).forEach(([k, v]) => {
          whereClauses.push({ field: k, op: "=", val: v });
        });
      } else if (val !== undefined) {
        whereClauses.push({ field: clauseOrField, op: opOrVal, val });
      } else {
        whereClauses.push({ field: clauseOrField, op: "=", val: opOrVal });
      }
      return builder;
    },

    whereIn: (field: string, values: any[]) => {
      whereClauses.push({
        raw: (item: any) => values.includes(item[field]),
      });
      return builder;
    },

    whereNull: (field: string) => {
      whereClauses.push({
        raw: (item: any) => {
          const val = item[field] !== undefined ? item[field] : (field.includes(".") ? item[field.split(".")[1]] : undefined);
          return val === null || val === undefined;
        },
      });
      return builder;
    },

    join: (table: string, first: string, second: string) => {
      joins.push({ table, first, second, type: "inner" });
      return builder;
    },

    leftJoin: (table: string, first: string, second: string) => {
      joins.push({ table, first, second, type: "left" });
      return builder;
    },

    select: (...fields: string[]) => {
      selectFields = fields;
      return builder;
    },

    orderBy: (field: string, dir: "asc" | "desc" = "asc") => {
      orderField = field;
      orderDir = dir;
      return builder;
    },

    insert: (data: any | any[]) => {
      const records = Array.isArray(data) ? data : [data];
      const inserted: any[] = [];
      const targetTable = getTableData(tableName);

      for (const rec of records) {
        const fullRec = {
          id: rec.id || crypto.randomUUID(),
          created_at: new Date(),
          ...rec,
        };
        targetTable.push(fullRec);
        inserted.push(fullRec);
      }

      return {
        returning: async (_fields?: string | string[]) => inserted,
        then: (cb: any) => Promise.resolve(cb(inserted)),
      };
    },

    update: (data: any) => {
      const targetTable = getTableData(tableName);
      const matched = executeFilter(targetTable);
      for (const item of matched) {
        Object.assign(item, data);
      }
      return {
        returning: async (_fields?: string | string[]) => matched,
        then: (cb: any) => Promise.resolve(cb(matched)),
      };
    },

    delete: async () => {
      const targetTable = (dbState as any)[tableName];
      if (!targetTable) return 0;
      const matched = executeFilter(targetTable);
      for (const item of matched) {
        const idx = targetTable.indexOf(item);
        if (idx !== -1) {
          targetTable.splice(idx, 1);
        }
      }
      return matched.length;
    },

    first: async () => {
      const results = await executeQuery();
      return results[0] || null;
    },

    then: (cb: any) => {
      return executeQuery().then(cb);
    },
  };

  const executeFilter = (data: any[]) => {
    return data.filter((item) => {
      for (const clause of whereClauses) {
        if (clause.raw) {
          if (!clause.raw(item)) return false;
        } else if (clause.field) {
          const actualVal = item[clause.field] !== undefined
            ? item[clause.field]
            : (clause.field.includes(".") ? item[clause.field.split(".")[1]] : undefined);
          if (clause.op === "=" && actualVal !== clause.val) return false;
          if (clause.op === ">" && actualVal <= clause.val) return false;
          if (clause.op === "<" && actualVal >= clause.val) return false;
        }
      }
      return true;
    });
  };

  const executeQuery = async () => {
    let rows: any[] = getTableData(tableName).map((r) => {
      const initial: any = { ...r };
      Object.keys(r).forEach((k) => {
        initial[`${tableName}.${k}`] = r[k];
      });
      return initial;
    });

    // Apply joins if any
    for (const j of joins) {
      const joinedTable = getTableData(j.table);
      const newRows: any[] = [];
      for (const row of rows) {
        const matches = joinedTable.filter((jr) => {
          const leftVal = row[j.first] !== undefined ? row[j.first] : row[j.first.split(".")[1]];
          const rightVal = jr[j.second] !== undefined ? jr[j.second] : jr[j.second.split(".")[1]];
          return leftVal === rightVal;
        });

        if (matches.length > 0) {
          for (const m of matches) {
            const merged: any = { ...m, ...row };
            Object.keys(row).forEach((k) => {
              merged[`${tableName}.${k}`] = row[k];
            });
            Object.keys(m).forEach((k) => {
              merged[`${j.table}.${k}`] = m[k];
            });
            newRows.push(merged);
          }
        } else if (j.type === "left") {
          const merged: any = { ...row };
          merged[`${j.table}.id`] = null;
          newRows.push(merged);
        }
      }
      rows = newRows;
    }

    // Apply where filters
    rows = executeFilter(rows);

    // Apply custom project joins for getOrderDetails or Quality pending
    if (tableName === "production_order_materials") {
      rows = rows.map((m) => {
        const mat = dbState.materials.find((x) => x.id === m.material_id);
        const inv = dbState.inventory.find((x) => x.material_id === m.material_id);
        return {
          ...m,
          sku: mat?.sku,
          name: mat?.name,
          unit: mat?.unit,
          available_stock: inv?.available_stock ?? 0,
        };
      });
    }

    if (tableName === "production_orders" && joins.some((j) => j.table === "products")) {
      rows = rows.map((po) => {
        const prod = dbState.products.find((p) => p.id === po.product_id);
        return {
          ...po,
          product_name: prod?.name,
          product_sku: prod?.sku,
          product_unit: prod?.unit,
        };
      });
    }

    if (tableName === "production_records" && joins.some((j) => j.table === "production_orders")) {
      rows = rows.map((pr) => {
        const po = dbState.production_orders.find((p) => p.id === pr.prodo_id);
        const prod = po ? dbState.products.find((p) => p.id === po.product_id) : null;
        return {
          ...pr,
          product_id: po?.product_id,
          product_name: prod?.name,
          product_sku: prod?.sku,
          status: po?.status,
        };
      });
    }

    return rows;
  };

  return builder;
};

// Mock ./db
jest.mock("./db", () => {
  const mDb: any = (table: string) => createQueryBuilder(table);
  mDb.transaction = jest.fn(async (cb: (trx: any) => Promise<any>) => {
    const trx: any = (table: string) => createQueryBuilder(table);
    return await cb(trx);
  });
  return mDb;
});

// ---------------------------------------------------------------------------
// End-to-End Workflow Test Suite
// ---------------------------------------------------------------------------

describe("Phase 13.1 — End-to-End Manufacturing Workflow Integration", () => {
  const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only";

  // Role tokens
  const purchasingToken = jwt.sign({ userId: USER_PURCHASING_ID, role: "Purchasing" }, JWT_SECRET);
  const managerToken = jwt.sign({ userId: USER_MANAGER_ID, role: "Manager" }, JWT_SECRET);
  const warehouseToken = jwt.sign({ userId: USER_WAREHOUSE_ID, role: "Warehouse" }, JWT_SECRET);
  const productionToken = jwt.sign({ userId: USER_PRODUCTION_ID, role: "Production" }, JWT_SECRET);
  const qcToken = jwt.sign({ userId: USER_QC_ID, role: "QC" }, JWT_SECRET);

  // Workflow state variables passed across stages
  let createdPrId: string;
  let createdPoId: string;
  let poItemId: string;
  let createdGrId: string;
  let createdProdoId: string;
  let createdProdRecordId: string;
  let createdInspectionId: string;

  beforeAll(() => {
    // Reset state before tests
    dbState = createInitialState();
  });

  // ─── 1. Purchase Request (PR) ──────────────────────────────────────────

  describe("Stage 1: Purchase Request Lifecycle", () => {
    it("Purchasing Staff creates a new PR for raw material", async () => {
      const res = await request(app)
        .post("/api/procurement/pr")
        .set("Authorization", `Bearer ${purchasingToken}`)
        .send({
          items: [
            {
              material_id: MAT_1_ID,
              quantity: 100,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.status).toBe("Pending");
      createdPrId = res.body.id;

      // Verify DB persistence
      const pr = dbState.purchase_requests.find((p) => p.id === createdPrId);
      expect(pr).toBeDefined();
      expect(pr.status).toBe("Pending");
      const items = dbState.purchase_request_items.filter((i) => i.pr_id === createdPrId);
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(100);
    });

    it("Enforces RBAC: Warehouse Staff is forbidden from approving a PR", async () => {
      const res = await request(app)
        .patch(`/api/procurement/pr/${createdPrId}/approve`)
        .set("Authorization", `Bearer ${warehouseToken}`)
        .send({ status: "Approved" });

      expect(res.status).toBe(403);
    });

    it("Manager reviews and approves the PR", async () => {
      const res = await request(app)
        .patch(`/api/procurement/pr/${createdPrId}/approve`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ status: "Approved" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Approved");

      const pr = dbState.purchase_requests.find((p) => p.id === createdPrId);
      expect(pr.status).toBe("Approved");
    });
  });

  // ─── 2. Purchase Order (PO) ────────────────────────────────────────────

  describe("Stage 2: Purchase Order Issuance", () => {
    it("Enforces validation: Cannot issue a PO for an unapproved or nonexistent PR", async () => {
      const fakePrId = crypto.randomUUID();
      const res = await request(app)
        .post("/api/procurement/po")
        .set("Authorization", `Bearer ${purchasingToken}`)
        .send({
          pr_id: fakePrId,
          supplier_id: SUP_1_ID,
          items: [
            {
              material_id: MAT_1_ID,
              quantity: 100,
              unit_price: 25.5,
            },
          ],
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("Purchasing Staff generates and issues a PO linked to the approved PR", async () => {
      const res = await request(app)
        .post("/api/procurement/po")
        .set("Authorization", `Bearer ${purchasingToken}`)
        .send({
          pr_id: createdPrId,
          supplier_id: SUP_1_ID,
          items: [
            {
              material_id: MAT_1_ID,
              quantity: 100,
              unit_price: 25.5,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.status).toBe("Issued");
      createdPoId = res.body.id;

      // PR must transition to Fulfilled
      const pr = dbState.purchase_requests.find((p) => p.id === createdPrId);
      expect(pr.status).toBe("Fulfilled");

      // Verify PO items created
      const poItems = dbState.purchase_order_items.filter((i) => i.po_id === createdPoId);
      expect(poItems).toHaveLength(1);
      expect(poItems[0].quantity).toBe(100);
      poItemId = poItems[0].id;
    });
  });

  // ─── 3. Goods Receipt (GR) & Inventory Inflow ──────────────────────────

  describe("Stage 3: Goods Receipt & Inventory Inflow", () => {
    it("Enforces RBAC: Production Staff is forbidden from receiving goods", async () => {
      const res = await request(app)
        .post("/api/procurement/gr")
        .set("Authorization", `Bearer ${productionToken}`)
        .send({
          po_id: createdPoId,
          items: [{ po_item_id: poItemId, received_quantity: 100 }],
        });

      expect(res.status).toBe(403);
    });

    it("Warehouse Staff records Goods Receipt: stock increases automatically in inventory", async () => {
      const initialInv = dbState.inventory.find((i) => i.material_id === MAT_1_ID);
      expect(initialInv.available_stock).toBe(0);

      const res = await request(app)
        .post("/api/procurement/gr")
        .set("Authorization", `Bearer ${warehouseToken}`)
        .send({
          po_id: createdPoId,
          items: [
            {
              po_item_id: poItemId,
              received_quantity: 100,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      createdGrId = res.body.id;

      // PO must be marked Completed
      const po = dbState.purchase_orders.find((p) => p.id === createdPoId);
      expect(po.status).toBe("Completed");

      // Inventory must reflect the 100 received units
      const updatedInv = dbState.inventory.find((i) => i.material_id === MAT_1_ID);
      expect(updatedInv.available_stock).toBe(100);
      expect(updatedInv.reserved_stock).toBe(0);

      // Inventory transaction ledger must record the Receipt
      const tx = dbState.inventory_transactions.find((t) => t.reference_id === createdGrId);
      expect(tx).toBeDefined();
      expect(tx.transaction_type).toBe("Receipt");
      expect(tx.quantity_change).toBe(100);
    });
  });

  // ─── 4. Production Planning & Material Reservation ─────────────────────

  describe("Stage 4: Production Planning & BOM Reservation", () => {
    it("Production Staff creates a Production Order with Bill of Materials", async () => {
      const res = await request(app)
        .post("/api/production")
        .set("Authorization", `Bearer ${productionToken}`)
        .send({
          product_id: PROD_1_ID,
          planned_quantity: 50,
          materials: [
            {
              material_id: MAT_1_ID,
              required_quantity: 100,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.status).toBe("Planned");
      createdProdoId = res.body.id;

      const prodo = dbState.production_orders.find((p) => p.id === createdProdoId);
      expect(prodo).toBeDefined();
      expect(prodo.planned_quantity).toBe(50);
    });

    it("Performs automated Material Availability check against current warehouse stock", async () => {
      const res = await request(app)
        .get(`/api/production/${createdProdoId}/availability`)
        .set("Authorization", `Bearer ${productionToken}`);

      expect(res.status).toBe(200);
      expect(res.body.all_available).toBe(true);
      expect(res.body.materials).toHaveLength(1);
      expect(res.body.materials[0].required).toBe(100);
      expect(res.body.materials[0].available).toBe(100);
      expect(res.body.materials[0].is_sufficient).toBe(true);
    });

    it("Reserves required materials: moves stock from available to reserved", async () => {
      const res = await request(app)
        .post(`/api/production/${createdProdoId}/reserve`)
        .set("Authorization", `Bearer ${productionToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // ProdO status becomes 'Ready'
      const prodo = dbState.production_orders.find((p) => p.id === createdProdoId);
      expect(prodo.status).toBe("Ready");

      // Stock moved: available drops to 0, reserved rises to 100
      const inv = dbState.inventory.find((i) => i.material_id === MAT_1_ID);
      expect(inv.available_stock).toBe(0);
      expect(inv.reserved_stock).toBe(100);

      // Material reservation record created
      const resRecord = dbState.material_reservations.find((r) => r.prodo_id === createdProdoId);
      expect(resRecord).toBeDefined();
      expect(resRecord.reserved_quantity).toBe(100);
    });
  });

  // ─── 5. Production Execution & Material Consumption ────────────────────

  describe("Stage 5: Production Execution & Material Consumption", () => {
    it("Records actual production output and permanently consumes reserved stock", async () => {
      const res = await request(app)
        .post(`/api/production/${createdProdoId}/record`)
        .set("Authorization", `Bearer ${productionToken}`)
        .send({
          actual_quantity_produced: 50,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.actual_quantity_produced).toBe(50);
      createdProdRecordId = res.body.id;

      // ProdO marked Completed
      const prodo = dbState.production_orders.find((p) => p.id === createdProdoId);
      expect(prodo.status).toBe("Completed");

      // Reserved stock consumed down to 0
      const inv = dbState.inventory.find((i) => i.material_id === MAT_1_ID);
      expect(inv.available_stock).toBe(0);
      expect(inv.reserved_stock).toBe(0);

      // Reservations cleared
      const remainingReservations = dbState.material_reservations.filter((r) => r.prodo_id === createdProdoId);
      expect(remainingReservations).toHaveLength(0);

      // Consumption transaction logged
      const consumptionTx = dbState.inventory_transactions.find(
        (t) => t.transaction_type === "Consumption" && t.reference_id === createdProdoId
      );
      expect(consumptionTx).toBeDefined();
      expect(consumptionTx.quantity_change).toBe(-100);
    });
  });

  // ─── 6. Quality Control (QC) & Finished Goods ──────────────────────────

  describe("Stage 6: Quality Control Inspection & Finished Goods", () => {
    it("Pending Inspections queue correctly lists the uninspected production record", async () => {
      const res = await request(app)
        .get("/api/quality/pending")
        .set("Authorization", `Bearer ${qcToken}`);

      expect(res.status).toBe(200);
      const pendingMatch = res.body.find((r: any) => r.id === createdProdRecordId);
      expect(pendingMatch).toBeDefined();
      expect(pendingMatch.actual_quantity_produced).toBe(50);
    });

    it("Enforces validation: Rejects inspection when pass + fail does not equal total produced", async () => {
      const res = await request(app)
        .post("/api/quality")
        .set("Authorization", `Bearer ${qcToken}`)
        .send({
          production_record_id: createdProdRecordId,
          pass_quantity: 45,
          fail_quantity: 2, // 45 + 2 = 47 != 50
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/equal total produced/i);
    });

    it("Enforces validation: Rejects inspection when defect quantities do not match fail_quantity", async () => {
      const res = await request(app)
        .post("/api/quality")
        .set("Authorization", `Bearer ${qcToken}`)
        .send({
          production_record_id: createdProdRecordId,
          pass_quantity: 48,
          fail_quantity: 2,
          defects: [
            {
              defect_reason: "Dimensional Out of Spec",
              quantity: 1, // 1 != 2
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Defect quantities must equal/i);
    });

    it("QC Staff submits valid inspection with defect categorization: Finished Goods recorded", async () => {
      const res = await request(app)
        .post("/api/quality")
        .set("Authorization", `Bearer ${qcToken}`)
        .send({
          production_record_id: createdProdRecordId,
          pass_quantity: 48,
          fail_quantity: 2,
          defects: [
            {
              defect_reason: "Dimensional Out of Spec",
              quantity: 2,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.pass_quantity).toBe(48);
      expect(res.body.fail_quantity).toBe(2);
      createdInspectionId = res.body.id;

      // Defect record created
      const defect = dbState.defect_records.find((d) => d.inspection_id === createdInspectionId);
      expect(defect).toBeDefined();
      expect(defect.defect_reason).toBe("Dimensional Out of Spec");
      expect(defect.quantity).toBe(2);

      // Finished goods record created for 48 passed units
      const fg = dbState.finished_goods_records.find((f) => f.inspection_id === createdInspectionId);
      expect(fg).toBeDefined();
      expect(fg.quantity).toBe(48);
      expect(fg.product_id).toBe(PROD_1_ID);

      // Verify production record is no longer in pending inspections queue
      const pendingRes = await request(app)
        .get("/api/quality/pending")
        .set("Authorization", `Bearer ${qcToken}`);
      const stillPending = pendingRes.body.find((r: any) => r.id === createdProdRecordId);
      expect(stillPending).toBeUndefined();
    });
  });

  // ─── 7. Complete Traceability & Audit Trail ────────────────────────────

  describe("Stage 7: Complete End-to-End Audit Trail Verification", () => {
    it("Verifies complete immutable audit log recorded across every major business transition", async () => {
      const actions = dbState.audit_logs.map((l) => l.action_type);

      expect(actions).toContain("CREATE_PR");
      expect(actions).toContain("APPROVE_PR");
      expect(actions).toContain("CREATE_PO");
      expect(actions).toContain("CREATE_GR");
      expect(actions).toContain("INVENTORY_RECEIPT");
      expect(actions).toContain("CREATE_PRODO");
      expect(actions).toContain("INVENTORY_RESERVATION");
      expect(actions).toContain("RESERVE_PRODO_MATERIALS");
      expect(actions).toContain("INVENTORY_CONSUMPTION");
      expect(actions).toContain("RECORD_PRODUCTION");
      expect(actions).toContain("RECORD_INSPECTION");
    });
  });
});
