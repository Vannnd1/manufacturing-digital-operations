import request from "supertest";
import app from "./app";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Stateful Database Mock for Inventory Transaction Integrity Edge Cases
// ---------------------------------------------------------------------------

const MAT_ID = crypto.randomUUID();
const PROD_ID = crypto.randomUUID();
const SUP_ID = crypto.randomUUID();
const USER_WAREHOUSE = crypto.randomUUID();
const USER_PRODUCTION = crypto.randomUUID();
const USER_PURCHASING = crypto.randomUUID();

interface IntegrityState {
  materials: any[];
  inventory: any[];
  inventory_transactions: any[];
  products: any[];
  purchase_requests: any[];
  purchase_orders: any[];
  purchase_order_items: any[];
  goods_receipts: any[];
  goods_receipt_items: any[];
  production_orders: any[];
  production_order_materials: any[];
  material_reservations: any[];
  production_records: any[];
  audit_logs: any[];
}

const createInitialState = (): IntegrityState => ({
  materials: [
    {
      id: MAT_ID,
      sku: "MAT-INTEG-001",
      name: "Precision Aluminum Billet",
      unit: "kg",
      min_stock_threshold: 10,
      is_active: true,
    },
  ],
  inventory: [
    {
      material_id: MAT_ID,
      available_stock: 0,
      reserved_stock: 0,
    },
  ],
  inventory_transactions: [],
  products: [
    {
      id: PROD_ID,
      sku: "PROD-AERO-01",
      name: "Aerospace Bracket",
      unit: "pcs",
    },
  ],
  purchase_requests: [],
  purchase_orders: [],
  purchase_order_items: [],
  goods_receipts: [],
  goods_receipt_items: [],
  production_orders: [],
  production_order_materials: [],
  material_reservations: [],
  production_records: [],
  audit_logs: [],
});

let dbState: IntegrityState = createInitialState();

const createQueryBuilder = (tableName: string) => {
  let whereClauses: Array<{ field?: string; op?: string; val?: any; raw?: (item: any) => boolean }> = [];
  let joins: Array<{ table: string; first: string; second: string; type?: string }> = [];

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

    select: (..._fields: string[]) => builder,
    orderBy: (..._args: any[]) => builder,

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
        returning: async () => inserted,
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
        returning: async () => matched,
        then: (cb: any) => Promise.resolve(cb(matched)),
      };
    },

    delete: async () => {
      const targetTable = (dbState as any)[tableName];
      if (!targetTable) return 0;
      const matched = executeFilter(targetTable);
      for (const item of matched) {
        const idx = targetTable.indexOf(item);
        if (idx !== -1) targetTable.splice(idx, 1);
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

    rows = executeFilter(rows);

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

    return rows;
  };

  return builder;
};

jest.mock("./db", () => {
  const mDb: any = (table: string) => createQueryBuilder(table);
  mDb.transaction = jest.fn(async (cb: (trx: any) => Promise<any>) => {
    const trx: any = (table: string) => createQueryBuilder(table);
    return await cb(trx);
  });
  return mDb;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Phase 13.2 — Inventory Transaction Integrity & Edge Cases", () => {
  const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only";

  const warehouseToken = jwt.sign({ userId: USER_WAREHOUSE, role: "Warehouse" }, JWT_SECRET);
  const productionToken = jwt.sign({ userId: USER_PRODUCTION, role: "Production" }, JWT_SECRET);
  const purchasingToken = jwt.sign({ userId: USER_PURCHASING, role: "Purchasing" }, JWT_SECRET);

  beforeEach(() => {
    dbState = createInitialState();
  });

  // ─── 1. Goods Receipt Over-Receipt & Double-Receipt Guard ───────────────

  describe("1. Goods Receipt Integrity Guards", () => {
    let poId: string;
    let poItemId: string;

    beforeEach(() => {
      poId = crypto.randomUUID();
      poItemId = crypto.randomUUID();

      // Seed an Issued PO for 50 kg
      dbState.purchase_orders.push({
        id: poId,
        supplier_id: SUP_ID,
        user_id: USER_PURCHASING,
        issue_date: new Date(),
        status: "Issued",
      });
      dbState.purchase_order_items.push({
        id: poItemId,
        po_id: poId,
        material_id: MAT_ID,
        quantity: 50,
        unit_price: 12.0,
      });
    });

    it("Rejects over-receipting when received_quantity exceeds PO quantity", async () => {
      const res = await request(app)
        .post("/api/procurement/gr")
        .set("Authorization", `Bearer ${warehouseToken}`)
        .send({
          po_id: poId,
          items: [{ po_item_id: poItemId, received_quantity: 75 }], // 75 > 50
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot exceed PO quantity/i);

      // Inventory must not be changed
      const inv = dbState.inventory.find((i) => i.material_id === MAT_ID);
      expect(inv.available_stock).toBe(0);
    });

    it("Accepts valid receipt up to PO quantity and updates status to Completed", async () => {
      const res = await request(app)
        .post("/api/procurement/gr")
        .set("Authorization", `Bearer ${warehouseToken}`)
        .send({
          po_id: poId,
          items: [{ po_item_id: poItemId, received_quantity: 50 }],
        });

      expect(res.status).toBe(201);
      const inv = dbState.inventory.find((i) => i.material_id === MAT_ID);
      expect(inv.available_stock).toBe(50);

      const po = dbState.purchase_orders.find((p) => p.id === poId);
      expect(po.status).toBe("Completed");
    });

    it("Prevents double-receipting: Rejects GR on an already Completed PO", async () => {
      // Mark PO completed
      dbState.purchase_orders[0].status = "Completed";

      const res = await request(app)
        .post("/api/procurement/gr")
        .set("Authorization", `Bearer ${warehouseToken}`)
        .send({
          po_id: poId,
          items: [{ po_item_id: poItemId, received_quantity: 50 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not issued/i);
    });
  });

  // ─── 2. Material Reservation & Insufficient Stock Guard ────────────────

  describe("2. Material Reservation Atomicity & Guards", () => {
    let prodoId: string;

    beforeEach(() => {
      prodoId = crypto.randomUUID();
      dbState.production_orders.push({
        id: prodoId,
        product_id: PROD_ID,
        planned_quantity: 10,
        status: "Planned",
      });
      dbState.production_order_materials.push({
        id: crypto.randomUUID(),
        prodo_id: prodoId,
        material_id: MAT_ID,
        required_quantity: 40,
      });
      // Available stock is only 15 kg (less than required 40 kg)
      dbState.inventory[0].available_stock = 15;
    });

    it("Rejects reservation when available stock is insufficient (NEGATIVE_STOCK prevention)", async () => {
      const res = await request(app)
        .post(`/api/production/${prodoId}/reserve`)
        .set("Authorization", `Bearer ${productionToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/insufficient available stock/i);

      // Order remains Planned
      const prodo = dbState.production_orders.find((p) => p.id === prodoId);
      expect(prodo.status).toBe("Planned");

      // Stock is untouched
      const inv = dbState.inventory.find((i) => i.material_id === MAT_ID);
      expect(inv.available_stock).toBe(15);
      expect(inv.reserved_stock).toBe(0);
    });

    it("Successfully reserves stock when available stock >= required quantity", async () => {
      // Increase available stock to 60 kg
      dbState.inventory[0].available_stock = 60;

      const res = await request(app)
        .post(`/api/production/${prodoId}/reserve`)
        .set("Authorization", `Bearer ${productionToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const inv = dbState.inventory.find((i) => i.material_id === MAT_ID);
      expect(inv.available_stock).toBe(20); // 60 - 40
      expect(inv.reserved_stock).toBe(40);

      const prodo = dbState.production_orders.find((p) => p.id === prodoId);
      expect(prodo.status).toBe("Ready");
    });

    it("Prevents double reservation: Rejects reserve call on an order already Ready", async () => {
      dbState.production_orders[0].status = "Ready";

      const res = await request(app)
        .post(`/api/production/${prodoId}/reserve`)
        .set("Authorization", `Bearer ${productionToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid status/i);
    });
  });

  // ─── 3. Order Cancellation & Material Release Guard ────────────────────

  describe("3. Order Cancellation & Stock Release", () => {
    let prodoId: string;

    beforeEach(() => {
      prodoId = crypto.randomUUID();
      dbState.production_orders.push({
        id: prodoId,
        product_id: PROD_ID,
        planned_quantity: 10,
        status: "Ready",
      });
      // 40 kg is currently reserved, 10 kg available
      dbState.inventory[0].available_stock = 10;
      dbState.inventory[0].reserved_stock = 40;
      dbState.material_reservations.push({
        id: crypto.randomUUID(),
        prodo_id: prodoId,
        material_id: MAT_ID,
        reserved_quantity: 40,
      });
    });

    it("Cancelling a Ready order releases reserved stock back to available stock (no stock loss)", async () => {
      const res = await request(app)
        .post(`/api/production/${prodoId}/cancel`)
        .set("Authorization", `Bearer ${productionToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Reserved stock returned to available: available = 10 + 40 = 50, reserved = 0
      const inv = dbState.inventory.find((i) => i.material_id === MAT_ID);
      expect(inv.available_stock).toBe(50);
      expect(inv.reserved_stock).toBe(0);

      // Order status updated to Cancelled
      const prodo = dbState.production_orders.find((p) => p.id === prodoId);
      expect(prodo.status).toBe("Cancelled");

      // Reservation row removed
      const reservations = dbState.material_reservations.filter((r) => r.prodo_id === prodoId);
      expect(reservations).toHaveLength(0);

      // Release transaction logged
      const releaseTx = dbState.inventory_transactions.find((t) => t.transaction_type === "Release");
      expect(releaseTx).toBeDefined();
      expect(releaseTx.quantity_change).toBe(40);
    });

    it("Rejects cancellation on a Completed order", async () => {
      dbState.production_orders[0].status = "Completed";

      const res = await request(app)
        .post(`/api/production/${prodoId}/cancel`)
        .set("Authorization", `Bearer ${productionToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot cancel/i);
    });

    it("Rejects cancellation on an already Cancelled order", async () => {
      dbState.production_orders[0].status = "Cancelled";

      const res = await request(app)
        .post(`/api/production/${prodoId}/cancel`)
        .set("Authorization", `Bearer ${productionToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot cancel/i);
    });
  });

  // ─── 4. Production Consumption Integrity ───────────────────────────────

  describe("4. Production Consumption Integrity", () => {
    let prodoId: string;

    beforeEach(() => {
      prodoId = crypto.randomUUID();
      dbState.production_orders.push({
        id: prodoId,
        product_id: PROD_ID,
        planned_quantity: 10,
        status: "Ready",
      });
      dbState.inventory[0].available_stock = 0;
      dbState.inventory[0].reserved_stock = 30;
      dbState.material_reservations.push({
        id: crypto.randomUUID(),
        prodo_id: prodoId,
        material_id: MAT_ID,
        reserved_quantity: 30,
      });
    });

    it("Records production output and permanently consumes reserved stock", async () => {
      const res = await request(app)
        .post(`/api/production/${prodoId}/record`)
        .set("Authorization", `Bearer ${productionToken}`)
        .send({ actual_quantity_produced: 10 });

      expect(res.status).toBe(201);

      // Reserved stock consumed down to 0
      const inv = dbState.inventory.find((i) => i.material_id === MAT_ID);
      expect(inv.reserved_stock).toBe(0);
      expect(inv.available_stock).toBe(0);

      // Order becomes Completed
      const prodo = dbState.production_orders.find((p) => p.id === prodoId);
      expect(prodo.status).toBe("Completed");
    });

    it("Prevents double consumption: Rejects record call on Completed order", async () => {
      dbState.production_orders[0].status = "Completed";

      const res = await request(app)
        .post(`/api/production/${prodoId}/record`)
        .set("Authorization", `Bearer ${productionToken}`)
        .send({ actual_quantity_produced: 10 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Order is not ready/i);
    });
  });

  // ─── 5. Inventory Cycle Count Adjustments ───────────────────────────────

  describe("5. Cycle Count Stock Adjustment Integrity", () => {
    beforeEach(() => {
      dbState.inventory[0].available_stock = 50;
      dbState.inventory[0].reserved_stock = 0;
    });

    it("Supports positive cycle count adjustment (surplus found during audit)", async () => {
      const res = await request(app)
        .post("/api/inventory/transaction")
        .set("Authorization", `Bearer ${warehouseToken}`)
        .send({
          material_id: MAT_ID,
          quantity_change: 15,
          type: "Adjustment",
          reference_id: "AUDIT-SURPLUS-01",
        });

      expect(res.status).toBe(201);
      const inv = dbState.inventory.find((i) => i.material_id === MAT_ID);
      expect(inv.available_stock).toBe(65); // 50 + 15
    });

    it("Supports negative cycle count adjustment (shrinkage / physical discrepancy)", async () => {
      const res = await request(app)
        .post("/api/inventory/transaction")
        .set("Authorization", `Bearer ${warehouseToken}`)
        .send({
          material_id: MAT_ID,
          quantity_change: -10,
          type: "Adjustment",
          reference_id: "AUDIT-DEFICIT-01",
        });

      expect(res.status).toBe(201);
      const inv = dbState.inventory.find((i) => i.material_id === MAT_ID);
      expect(inv.available_stock).toBe(40); // 50 - 10

      const tx = dbState.inventory_transactions.find((t) => t.reference_id === "AUDIT-DEFICIT-01");
      expect(tx).toBeDefined();
      expect(tx.quantity_change).toBe(-10);
    });

    it("Strictly blocks downward adjustment if it would cause negative stock", async () => {
      const res = await request(app)
        .post("/api/inventory/transaction")
        .set("Authorization", `Bearer ${warehouseToken}`)
        .send({
          material_id: MAT_ID,
          quantity_change: -60, // 50 - 60 = -10 (invalid)
          type: "Adjustment",
          reference_id: "AUDIT-OVER-DEFICIT",
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/Stock cannot become negative/i);

      // Stock remains exactly 50
      const inv = dbState.inventory.find((i) => i.material_id === MAT_ID);
      expect(inv.available_stock).toBe(50);
    });

    it("Rejects zero quantity adjustment", async () => {
      const res = await request(app)
        .post("/api/inventory/transaction")
        .set("Authorization", `Bearer ${warehouseToken}`)
        .send({
          material_id: MAT_ID,
          quantity_change: 0,
          type: "Adjustment",
        });

      expect(res.status).toBe(400);
    });

    it("Rejects negative quantity for Receipt type", async () => {
      const res = await request(app)
        .post("/api/inventory/transaction")
        .set("Authorization", `Bearer ${warehouseToken}`)
        .send({
          material_id: MAT_ID,
          quantity_change: -5,
          type: "Receipt",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Validation failed/i);
    });
  });
});
