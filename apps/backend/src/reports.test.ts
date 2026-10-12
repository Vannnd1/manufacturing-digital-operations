import request from "supertest";
import app from "./app";
import jwt from "jsonwebtoken";
import { sanitizeCsvField, resolveDateRange } from "./services/reports.service";

const validMaterialId = "11111111-1111-1111-1111-111111111111";
const validSupplierId = "22222222-2222-2222-2222-222222222222";
const validPoId = "33333333-3333-3333-3333-333333333333";
const validProdoId = "44444444-4444-4444-4444-444444444444";
const validInspId = "55555555-5555-5555-5555-555555555555";

// Mock database layer with isolated responses
jest.mock("./db", () => {
  const mDb: any = jest.fn((table: string) => {
    if (table === "materials") {
      const materials = [
        {
          id: validMaterialId,
          sku: "MAT-STEEL-01",
          name: "High-Grade Steel",
          unit: "kg",
          min_stock_threshold: 100,
          is_active: true,
          available_stock: 40, // < 100 => LOW_STOCK
          reserved_stock: 10,
          total_stock: 50,
        },
        {
          id: "11111111-1111-1111-1111-111111111112",
          sku: "MAT-COPPER-01",
          name: "Copper Rod",
          unit: "kg",
          min_stock_threshold: 50,
          is_active: true,
          available_stock: 0, // <= 0 => OUT_OF_STOCK
          reserved_stock: 0,
          total_stock: 0,
        },
        {
          id: "11111111-1111-1111-1111-111111111113",
          sku: "MAT-BOLT-01",
          name: "Industrial Bolt",
          unit: "pcs",
          min_stock_threshold: 200,
          is_active: true,
          available_stock: 500, // >= 200 => HEALTHY
          reserved_stock: 50,
          total_stock: 550,
        },
      ];

      const builder: any = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(materials)),
      };
      return builder;
    }

    if (table === "inventory_transactions") {
      const txs = [
        {
          id: "tx-1",
          material_id: validMaterialId,
          material_sku: "MAT-STEEL-01",
          material_name: "High-Grade Steel",
          material_unit: "kg",
          transaction_type: "Receipt",
          quantity_change: 100,
          reference_id: "GR-01",
          created_at: "2026-10-05 10:00:00",
        },
        {
          id: "tx-2",
          material_id: validMaterialId,
          material_sku: "MAT-STEEL-01",
          material_name: "High-Grade Steel",
          material_unit: "kg",
          transaction_type: "Consumption",
          quantity_change: -60,
          reference_id: "PO-01",
          created_at: "2026-10-06 14:00:00",
        },
      ];

      const builder: any = {
        join: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        sum: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => {
          // If count/sum query
          if (builder.isAgg) {
            return cb([{ count: 2, net_change: 40 }]);
          }
          return cb(txs);
        }),
      };
      builder.count = jest.fn(() => {
        builder.isAgg = true;
        return builder;
      });
      return builder;
    }

    if (table === "purchase_requests") {
      const prs = [
        { id: "pr-1", status: "Pending", request_date: "2026-10-01", requester_name: "Staff A" },
        { id: "pr-2", status: "Approved", request_date: "2026-10-02", requester_name: "Staff B" },
        { id: "pr-3", status: "Fulfilled", request_date: "2026-10-03", requester_name: "Staff C" },
      ];
      const builder: any = {
        join: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(prs)),
      };
      return builder;
    }

    if (table === "purchase_orders") {
      const pos = [
        {
          id: validPoId,
          pr_id: "pr-2",
          supplier_id: validSupplierId,
          supplier_name: "Sumitomo Metal Supplies",
          status: "Issued",
          issue_date: "2026-10-04",
        },
      ];
      const builder: any = {
        join: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(pos)),
      };
      return builder;
    }

    if (table === "purchase_order_items") {
      const items = [
        {
          po_id: validPoId,
          material_id: validMaterialId,
          material_name: "High-Grade Steel",
          material_sku: "MAT-STEEL-01",
          quantity: 100,
          unit_price: 25.5, // 100 * 25.50 = 2550.00
        },
      ];
      const builder: any = {
        join: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sum: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => {
          if (builder.isSum) {
            return cb([{ total_spend: 2550 }]);
          }
          return cb(items);
        }),
      };
      builder.sum = jest.fn(() => {
        builder.isSum = true;
        return builder;
      });
      return builder;
    }

    if (table === "goods_receipts") {
      const grs = [
        { id: "gr-1", po_id: validPoId, receipt_date: "2026-10-05" },
      ];
      const builder: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(builder.isCount ? [{ count: 1 }] : grs)),
      };
      builder.count = jest.fn(() => {
        builder.isCount = true;
        return builder;
      });
      return builder;
    }

    if (table === "production_orders") {
      const orders = [
        {
          prodo_id: validProdoId,
          product_id: "prod-1",
          product_sku: "INV-PWR-100",
          product_name: "Inverter Power Module",
          product_unit: "units",
          planned_quantity: 100,
          status: "Completed",
          record_id: "rec-1",
          actual_quantity_produced: 95,
          completion_date: "2026-10-08",
        },
      ];
      const builder: any = {
        join: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(orders)),
      };
      return builder;
    }

    if (table === "quality_inspections") {
      const inspections = [
        {
          id: validInspId,
          inspection_date: "2026-10-09",
          pass_quantity: 90,
          fail_quantity: 5, // total inspected = 95, defect rate = 5 / 95 = 5.26%
          product_sku: "INV-PWR-100",
          product_name: "Inverter Power Module",
          inspector_name: "QC Specialist",
          prodo_id: validProdoId,
        },
      ];
      const builder: any = {
        join: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(inspections)),
      };
      return builder;
    }

    if (table === "defect_records") {
      const defects = [
        { defect_reason: "Surface Scratch", quantity: 3 },
        { defect_reason: "Solder Bridge", quantity: 2 },
      ];
      const builder: any = {
        whereIn: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(defects)),
      };
      return builder;
    }

    return {};
  });

  mDb.raw = jest.fn((query: string) => query);
  return mDb;
});

describe("Operational Reporting & Insights API", () => {
  const managerToken = jwt.sign(
    { userId: "user-mgr", role: "Manager" },
    process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only"
  );
  const adminToken = jwt.sign(
    { userId: "user-adm", role: "Admin" },
    process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only"
  );

  describe("Sanitization & Date Range Utilities", () => {
    it("should escape formula injection prefixes in CSV fields", () => {
      expect(sanitizeCsvField("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
      expect(sanitizeCsvField("+cmd|' /C calc'!A0")).toBe("'+cmd|' /C calc'!A0");
      expect(sanitizeCsvField("-250")).toBe("'-250");
      expect(sanitizeCsvField("@malicious")).toBe("'@malicious");
      expect(sanitizeCsvField("\tTabPrefixed")).toBe("'\tTabPrefixed");
    });

    it("should properly escape commas and quotes in CSV fields", () => {
      expect(sanitizeCsvField('Product, "Standard" Model')).toBe('"Product, ""Standard"" Model"');
      expect(sanitizeCsvField("Normal Name")).toBe("Normal Name");
      expect(sanitizeCsvField(null)).toBe("");
      expect(sanitizeCsvField(undefined)).toBe("");
    });

    it("should resolve relative date ranges deterministically", () => {
      const r7 = resolveDateRange("7d");
      expect(r7.start).toBeTruthy();
      expect(r7.end).toBeTruthy();

      const r30 = resolveDateRange("30d");
      expect(r30.start).toBeTruthy();
      expect(r30.end).toBeTruthy();

      const rCustom = resolveDateRange("custom", "2026-01-01", "2026-01-31");
      expect(rCustom.start).toBe("2026-01-01");
      expect(rCustom.end).toBe("2026-01-31");

      const rAll = resolveDateRange("all");
      expect(rAll.start).toBeNull();
      expect(rAll.end).toBeNull();
    });
  });

  describe("GET /api/reports/summary", () => {
    it("should block unauthenticated requests with 401", async () => {
      const res = await request(app).get("/api/reports/summary");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("should return operational summary across all domains for authorized user", async () => {
      const res = await request(app)
        .get("/api/reports/summary?range=30d")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("period");
      expect(res.body).toHaveProperty("inventory");
      expect(res.body).toHaveProperty("procurement");
      expect(res.body).toHaveProperty("production");
      expect(res.body).toHaveProperty("quality");

      expect(res.body.inventory.total_materials).toBe(3);
      expect(res.body.inventory.low_stock_count).toBe(1);
      expect(res.body.inventory.out_of_stock_count).toBe(1);

      expect(res.body.procurement.total_prs).toBe(3);
      expect(res.body.procurement.pending_prs).toBe(1);

      expect(res.body.production.total_orders).toBe(1);
      expect(res.body.production.completed_orders).toBe(1);

      expect(res.body.quality.total_inspections).toBe(1);
      expect(res.body.quality.total_inspected_quantity).toBe(95);
      expect(res.body.quality.total_failed_quantity).toBe(5);
    });
  });

  describe("GET /api/reports/inventory-movements", () => {
    it("should return detailed inventory stock status and movements", async () => {
      const res = await request(app)
        .get("/api/reports/inventory-movements?range=30d")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.summary.total_materials).toBe(3);
      expect(res.body.summary.low_stock_count).toBe(1);
      expect(res.body.summary.out_of_stock_count).toBe(1);
      expect(res.body.summary.healthy_stock_count).toBe(1);

      expect(Array.isArray(res.body.stock_levels)).toBe(true);
      expect(Array.isArray(res.body.recent_transactions)).toBe(true);

      const lowStockItem = res.body.stock_levels.find((s: any) => s.sku === "MAT-STEEL-01");
      expect(lowStockItem.status).toBe("LOW_STOCK");

      const outOfStockItem = res.body.stock_levels.find((s: any) => s.sku === "MAT-COPPER-01");
      expect(outOfStockItem.status).toBe("OUT_OF_STOCK");
    });
  });

  describe("GET /api/reports/procurement-spend", () => {
    it("should return procurement spend by supplier and PR status distribution", async () => {
      const res = await request(app)
        .get("/api/reports/procurement-spend?range=30d")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.summary.total_prs).toBe(3);
      expect(res.body.summary.pending_prs).toBe(1);
      expect(res.body.summary.total_pos).toBe(1);
      expect(res.body.summary.total_procurement_spend).toBe(2550);

      expect(Array.isArray(res.body.supplier_spend)).toBe(true);
      expect(res.body.supplier_spend[0].supplier_name).toBe("Sumitomo Metal Supplies");
      expect(res.body.supplier_spend[0].total_spend).toBe(2550);
    });
  });

  describe("GET /api/reports/production-yield", () => {
    it("should return production order yield rate and output metrics", async () => {
      const res = await request(app)
        .get("/api/reports/production-yield?range=30d")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.summary.total_orders).toBe(1);
      expect(res.body.summary.completed_orders).toBe(1);
      expect(res.body.summary.total_planned_quantity).toBe(100);
      expect(res.body.summary.total_actual_quantity).toBe(95);
      expect(res.body.summary.yield_rate_percent).toBe(95); // 95 / 100 * 100 = 95.00%
    });
  });

  describe("GET /api/reports/quality-defects", () => {
    it("should return defect rate and defect reasons breakdown", async () => {
      const res = await request(app)
        .get("/api/reports/quality-defects?range=30d")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.summary.total_inspections).toBe(1);
      expect(res.body.summary.total_inspected_quantity).toBe(95);
      expect(res.body.summary.total_passed_quantity).toBe(90);
      expect(res.body.summary.total_failed_quantity).toBe(5);
      expect(res.body.summary.defect_rate_percent).toBe(5.26); // (5 / 95) * 100 = 5.26%

      expect(Array.isArray(res.body.defect_breakdown)).toBe(true);
      expect(res.body.defect_breakdown.length).toBe(2);
      expect(res.body.defect_breakdown[0].reason).toBe("Surface Scratch");
      expect(res.body.defect_breakdown[0].quantity).toBe(3);
    });
  });

  describe("Date Validation & Edge Cases", () => {
    it("should reject custom range without startDate or endDate (400)", async () => {
      const res = await request(app)
        .get("/api/reports/summary?range=custom")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject custom range where startDate is after endDate (400)", async () => {
      const res = await request(app)
        .get("/api/reports/summary?range=custom&startDate=2026-10-31&endDate=2026-10-01")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
      expect(JSON.stringify(res.body)).toContain("startDate must be before or equal to endDate");
    });

    it("should reject invalid date format strings (400)", async () => {
      const res = await request(app)
        .get("/api/reports/summary?range=custom&startDate=not-a-date&endDate=2026-10-15")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("CSV Export Endpoints", () => {
    it("should export inventory CSV with proper headers and content", async () => {
      const res = await request(app)
        .get("/api/reports/export?type=inventory&range=30d")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.headers["content-disposition"]).toMatch(/attachment; filename="inventory-report-/);
      expect(res.text).toContain("Material SKU,Material Name,Unit,Available Stock,Reserved Stock,Total Stock,Min Threshold,Status");
      expect(res.text).toContain("MAT-STEEL-01");
    });

    it("should export procurement spend CSV", async () => {
      const res = await request(app)
        .get("/api/reports/export?type=procurement&range=30d")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.headers["content-disposition"]).toMatch(/attachment; filename="procurement-spend-/);
      expect(res.text).toContain("PO ID,Supplier Name,Status,Issue Date,Item Count,Total Amount ($)");
      expect(res.text).toContain("Sumitomo Metal Supplies");
    });

    it("should export production yield CSV", async () => {
      const res = await request(app)
        .get("/api/reports/export?type=production&range=30d")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.headers["content-disposition"]).toMatch(/attachment; filename="production-yield-/);
      expect(res.text).toContain("Order ID,Product SKU,Product Name,Planned Qty,Actual Qty,Status,Completion Date");
      expect(res.text).toContain("INV-PWR-100");
    });

    it("should export quality inspections CSV", async () => {
      const res = await request(app)
        .get("/api/reports/export?type=quality&range=30d")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.headers["content-disposition"]).toMatch(/attachment; filename="quality-inspections-/);
      expect(res.text).toContain("Inspection ID,Date,Product SKU,Product Name,Inspector,Passed Qty,Failed Qty");
    });

    it("should reject invalid export type with 400 validation error", async () => {
      const res = await request(app)
        .get("/api/reports/export?type=invalid_type")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });
});
