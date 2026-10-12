import request from "supertest";
import jwt from "jsonwebtoken";
import app from "./app";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only";

// Fixture UUIDs
const USER_ADMIN_ID = "11111111-1111-4111-a111-111111111111";
const USER_INSPECTOR_ID = "22222222-2222-4222-a222-222222222222";
const MAT_STEEL_ID = "33333333-3333-4333-a333-333333333333";
const PROD_CHASSIS_ID = "44444444-4444-4444-a444-444444444444";
const SUPP_METAL_ID = "55555555-5555-4555-a555-555555555555";
const PO_1_ID = "66666666-6666-4666-a666-666666666666";
const GR_1_ID = "77777777-7777-4777-a777-777777777777";
const PRODO_1_ID = "88888888-8888-4888-a888-888888888888";
const PROD_REC_1_ID = "99999999-9999-4999-a999-999999999999";
const QC_INSP_1_ID = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

const mockDbState: any = {
  users: [
    { id: USER_ADMIN_ID, name: "Admin User", email: "admin@example.com", role_id: "role-admin" },
    { id: USER_INSPECTOR_ID, name: "QC Lead", email: "qc@example.com", role_id: "role-qc" },
  ],
  roles: [
    { id: "role-admin", name: "Admin" },
    { id: "role-qc", name: "Quality Control" },
  ],
  materials: [
    { id: MAT_STEEL_ID, sku: "MAT-STL-01", name: "Heavy Steel Sheet", unit: "kg", min_stock_threshold: 50, is_active: true },
  ],
  inventory: [
    { material_id: MAT_STEEL_ID, available_stock: 450, reserved_stock: 0 },
  ],
  products: [
    { id: PROD_CHASSIS_ID, sku: "PROD-CHS-01", name: "Steel Equipment Chassis", unit: "unit" },
  ],
  suppliers: [
    { id: SUPP_METAL_ID, name: "Nippon Steel Partner", contact_info: "contact@nippon.example", is_active: true },
  ],
  purchase_orders: [
    { id: PO_1_ID, supplier_id: SUPP_METAL_ID, user_id: USER_ADMIN_ID, issue_date: "2026-10-01", status: "Completed" },
  ],
  purchase_order_items: [
    { id: "poi-1", po_id: PO_1_ID, material_id: MAT_STEEL_ID, quantity: 500, unit_price: 15.0 },
  ],
  goods_receipts: [
    { id: GR_1_ID, po_id: PO_1_ID, user_id: USER_ADMIN_ID, receipt_date: "2026-10-02" },
  ],
  goods_receipt_items: [
    { id: "gri-1", receipt_id: GR_1_ID, po_item_id: "poi-1", received_quantity: 500 },
  ],
  production_orders: [
    { id: PRODO_1_ID, product_id: PROD_CHASSIS_ID, planned_quantity: 10, status: "Completed" },
  ],
  production_order_materials: [
    { id: "pom-1", prodo_id: PRODO_1_ID, material_id: MAT_STEEL_ID, required_quantity: 50 },
  ],
  inventory_transactions: [
    {
      id: "tx-1",
      material_id: MAT_STEEL_ID,
      transaction_type: "Receipt",
      quantity_change: 500,
      reference_id: GR_1_ID,
      created_at: new Date("2026-10-02T08:00:00Z"),
    },
    {
      id: "tx-2",
      material_id: MAT_STEEL_ID,
      transaction_type: "Reservation",
      quantity_change: -50,
      reference_id: PRODO_1_ID,
      created_at: new Date("2026-10-03T09:00:00Z"),
    },
    {
      id: "tx-3",
      material_id: MAT_STEEL_ID,
      transaction_type: "Consumption",
      quantity_change: -50,
      reference_id: PRODO_1_ID,
      created_at: new Date("2026-10-03T14:00:00Z"),
    },
  ],
  production_records: [
    { id: PROD_REC_1_ID, prodo_id: PRODO_1_ID, actual_quantity_produced: 10, completion_date: "2026-10-03" },
  ],
  quality_inspections: [
    {
      id: QC_INSP_1_ID,
      production_record_id: PROD_REC_1_ID,
      inspector_id: USER_INSPECTOR_ID,
      pass_quantity: 9,
      fail_quantity: 1,
      inspection_date: "2026-10-04",
    },
  ],
  defect_records: [
    { id: "def-1", inspection_id: QC_INSP_1_ID, defect_reason: "Surface scratch beyond tolerance", quantity: 1 },
  ],
  finished_goods_records: [
    { id: "fg-1", product_id: PROD_CHASSIS_ID, inspection_id: QC_INSP_1_ID, quantity: 9 },
  ],
  audit_logs: [
    {
      id: "log-1",
      user_id: USER_ADMIN_ID,
      action_type: "CREATE_PO",
      entity_name: "PURCHASE_ORDER",
      entity_id: PO_1_ID,
      description: "Created PO for steel sheets",
      created_at: new Date("2026-10-01T10:00:00Z"),
    },
    {
      id: "log-2",
      user_id: USER_ADMIN_ID,
      action_type: "CREATE_GR",
      entity_name: "GOODS_RECEIPT",
      entity_id: GR_1_ID,
      description: "Received 500kg steel",
      created_at: new Date("2026-10-02T08:05:00Z"),
    },
    {
      id: "log-3",
      user_id: USER_ADMIN_ID,
      action_type: "CREATE_PRODO",
      entity_name: "PRODUCTION_ORDER",
      entity_id: PRODO_1_ID,
      description: "Created Production Order for 10 Chassis",
      created_at: new Date("2026-10-03T08:30:00Z"),
    },
    {
      id: "log-4",
      user_id: USER_ADMIN_ID,
      action_type: "RECORD_PRODUCTION",
      entity_name: "PRODUCTION_ORDER",
      entity_id: PRODO_1_ID,
      description: "Recorded production of 10 for PRODO",
      created_at: new Date("2026-10-03T14:30:00Z"),
    },
    {
      id: "log-5",
      user_id: USER_INSPECTOR_ID,
      action_type: "RECORD_INSPECTION",
      entity_name: "QUALITY_INSPECTION",
      entity_id: QC_INSP_1_ID,
      description: "Recorded inspection: Pass 9, Fail 1",
      created_at: new Date("2026-10-04T11:00:00Z"),
    },
  ],
};

// Mock Knex Query Builder simulating SQLite / Postgres
jest.mock("./db", () => {
  const queryBuilder = (tableName: string) => {
    let currentTable = tableName;
    let whereClauses: Array<{ field?: string; val?: any; rawFn?: (item: any) => boolean }> = [];
    let joins: Array<{ table: string; left: string; right: string }> = [];
    let limitVal: number | null = null;
    let offsetVal: number = 0;

    const builder: any = {
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
        if (typeof arg1 === "function") {
          // nested where builder
          const nested: any = {
            where: (criteria: any) => {
              whereClauses.push({
                rawFn: (item) => Object.entries(criteria).every(([k, v]) => item[k] === v),
              });
              return nested;
            },
            orWhere: (criteria: any) => {
              whereClauses.push({
                rawFn: (item) => Object.entries(criteria).every(([k, v]) => item[k] === v),
              });
              return nested;
            },
          };
          arg1.call(nested);
        } else if (typeof arg1 === "object") {
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
      orderBy: (_col: string, _dir?: string) => builder,
      limit: (n: number) => {
        limitVal = n;
        return builder;
      },
      offset: (n: number) => {
        offsetVal = n;
        return builder;
      },
      first: async () => {
        const rows = await builder.then();
        return rows[0] || null;
      },
      then: async (resolve?: (val: any) => any) => {
        let items = [...(mockDbState[currentTable] || [])];

        // Apply joins
        for (const j of joins) {
          const joinedTable = mockDbState[j.table] || [];
          items = items.map((mainItem) => {
            const joinedItem = joinedTable.find((jt: any) => {
              if (j.table === "users") return jt.id === mainItem.user_id || jt.id === mainItem.inspector_id;
              if (j.table === "roles") return jt.id === mainItem.role_id;
              if (j.table === "products") return jt.id === mainItem.product_id;
              if (j.table === "materials") return jt.id === mainItem.material_id;
              if (j.table === "inventory") return jt.material_id === mainItem.id;
              if (j.table === "purchase_orders") return jt.id === mainItem.po_id;
              if (j.table === "suppliers") return jt.id === mainItem.supplier_id;
              if (j.table === "goods_receipts") return jt.id === mainItem.receipt_id;
              if (j.table === "purchase_order_items") return jt.id === mainItem.po_item_id;
              return false;
            });

            if (joinedItem) {
              const res: any = { ...mainItem };
              if (j.table === "users") {
                res.user_name = joinedItem.name;
                res.user_email = joinedItem.email;
                res.actor_name = joinedItem.name;
                res.inspector_name = joinedItem.name;
                res.role_id = joinedItem.role_id;
              }
              if (j.table === "roles") {
                res.user_role = joinedItem.name;
                res.actor_role = joinedItem.name;
              }
              if (j.table === "products") {
                res.product_sku = joinedItem.sku;
                res.product_name = joinedItem.name;
                res.product_unit = joinedItem.unit;
              }
              if (j.table === "materials") {
                res.material_sku = joinedItem.sku;
                res.material_name = joinedItem.name;
                res.unit = joinedItem.unit;
              }
              if (j.table === "inventory") {
                res.available_stock = joinedItem.available_stock;
                res.reserved_stock = joinedItem.reserved_stock;
              }
              if (j.table === "purchase_order_items") {
                res.material_id = joinedItem.material_id;
                res.po_id = joinedItem.po_id;
              }
              if (j.table === "goods_receipts") {
                res.receipt_date = joinedItem.receipt_date;
              }
              if (j.table === "purchase_orders") {
                res.supplier_id = joinedItem.supplier_id;
              }
              if (j.table === "suppliers") {
                res.supplier_name = joinedItem.name;
              }
              return res;
            }
            return mainItem;
          });
        }

        // Apply where filters
        for (const w of whereClauses) {
          if (w.rawFn) {
            items = items.filter(w.rawFn);
          } else if (w.field) {
            items = items.filter((it: any) => it[w.field!] === w.val);
          }
        }

        if (offsetVal > 0) items = items.slice(offsetVal);
        if (limitVal !== null) items = items.slice(0, limitVal);

        if (resolve) return resolve(items);
        return items;
      },
    };

    return builder;
  };

  const mDb: any = (table: string) => queryBuilder(table);
  mDb.fn = { now: () => new Date() };
  mDb.transaction = jest.fn(async (cb: any) => cb(mDb));
  return mDb;
});

describe("Phase 13.4 — Audit Trail & Traceability Test Suite", () => {
  const adminToken = jwt.sign({ userId: USER_ADMIN_ID, role: "Admin" }, JWT_SECRET);

  describe("1. Audit Logs Querying & Attribution", () => {
    it("rejects unauthenticated requests with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/audit/logs");
      expect(res.status).toBe(401);
    });

    it("returns chronological audit logs with actor name, email, and role", async () => {
      const res = await request(app)
        .get("/api/audit/logs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const firstLog = res.body[0];
      expect(firstLog).toHaveProperty("action_type");
      expect(firstLog).toHaveProperty("entity_name");
      expect(firstLog).toHaveProperty("entity_id");
      expect(firstLog).toHaveProperty("description");
      expect(firstLog).toHaveProperty("created_at");
      expect(firstLog).toHaveProperty("user_name");
      expect(firstLog).toHaveProperty("user_role");
    });

    it("filters audit logs by entity_name", async () => {
      const res = await request(app)
        .get("/api/audit/logs?entity_name=PRODUCTION_ORDER")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.every((l: any) => l.entity_name === "PRODUCTION_ORDER")).toBe(true);
    });

    it("filters audit logs by action_type", async () => {
      const res = await request(app)
        .get("/api/audit/logs?action_type=RECORD_INSPECTION")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.every((l: any) => l.action_type === "RECORD_INSPECTION")).toBe(true);
    });
  });

  describe("2. Inventory Transaction Ledger", () => {
    it("returns inventory stock movements with material info and reference IDs", async () => {
      const res = await request(app)
        .get("/api/inventory/transactions")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);

      const txReceipt = res.body.find((t: any) => t.transaction_type === "Receipt");
      expect(txReceipt).toBeDefined();
      expect(txReceipt.quantity_change).toBe(500);
      expect(txReceipt.material_sku).toBe("MAT-STL-01");
      expect(txReceipt.reference_id).toBe(GR_1_ID);
    });

    it("filters inventory transactions by material_id", async () => {
      const res = await request(app)
        .get(`/api/inventory/transactions?material_id=${MAT_STEEL_ID}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.every((t: any) => t.material_id === MAT_STEEL_ID)).toBe(true);
    });
  });

  describe("3. End-to-End Production Order Traceability", () => {
    it("returns 404 for a non-existent production order", async () => {
      const res = await request(app)
        .get("/api/audit/traceability/prodo/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("returns complete end-to-end genealogy for a finished production order", async () => {
      const res = await request(app)
        .get(`/api/audit/traceability/prodo/${PRODO_1_ID}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body;

      // 1. Order details
      expect(data.order.id).toBe(PRODO_1_ID);
      expect(data.order.product_sku).toBe("PROD-CHS-01");
      expect(data.order.planned_quantity).toBe(10);
      expect(data.order.status).toBe("Completed");

      // 2. BOM requirements
      expect(data.bom_requirements.length).toBe(1);
      expect(data.bom_requirements[0].material_sku).toBe("MAT-STL-01");
      expect(data.bom_requirements[0].required_quantity).toBe(50);

      // 3. Stock transactions tied to this order
      expect(data.stock_movements.length).toBe(2);
      expect(data.stock_movements.map((s: any) => s.transaction_type)).toEqual(
        expect.arrayContaining(["Reservation", "Consumption"])
      );

      // 4. Production record
      expect(data.production_record).toBeDefined();
      expect(data.production_record.actual_quantity_produced).toBe(10);

      // 5. Quality Inspection & Defect Breakdown
      expect(data.quality_inspection).toBeDefined();
      expect(data.quality_inspection.pass_quantity).toBe(9);
      expect(data.quality_inspection.fail_quantity).toBe(1);
      expect(data.quality_inspection.inspector_name).toBe("QC Lead");

      // 6. Defect records
      expect(data.defects.length).toBe(1);
      expect(data.defects[0].defect_reason).toBe("Surface scratch beyond tolerance");
      expect(data.defects[0].quantity).toBe(1);

      // 7. Finished goods
      expect(data.finished_goods).toBeDefined();
      expect(data.finished_goods.quantity).toBe(9);

      // 8. Upstream supplier procurement linkage
      expect(data.upstream_procurement.length).toBeGreaterThan(0);
      expect(data.upstream_procurement[0].supplier_name).toBe("Nippon Steel Partner");
      expect(data.upstream_procurement[0].po_id).toBe(PO_1_ID);
      expect(data.upstream_procurement[0].receipt_id).toBe(GR_1_ID);
    });
  });

  describe("4. Material Stock Lineage & Traceability", () => {
    it("returns 404 for a non-existent material", async () => {
      const res = await request(app)
        .get("/api/audit/traceability/material/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("returns complete stock ledger and audit records for a material", async () => {
      const res = await request(app)
        .get(`/api/audit/traceability/material/${MAT_STEEL_ID}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body;

      expect(data.material.id).toBe(MAT_STEEL_ID);
      expect(data.material.sku).toBe("MAT-STL-01");
      expect(data.material.available_stock).toBe(450);

      expect(Array.isArray(data.stock_ledger)).toBe(true);
      expect(data.stock_ledger.length).toBe(3);

      expect(Array.isArray(data.audit_logs)).toBe(true);
    });
  });
});
