import request from "supertest";
import app from "./app";
import jwt from "jsonwebtoken";

jest.mock("./db", () => {
  const mDb: any = jest.fn((table: string) => {
    const chain = {
      join: jest.fn().mockReturnThis(),
      whereRaw: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    };

    if (table === "inventory") {
      (chain as any).then = jest.fn((cb) => cb([{ id: "mat-1", sku: "M-1", name: "Mat 1", available_stock: 5, min_stock_threshold: 10 }]));
      return chain;
    }
    if (table === "purchase_requests") {
      (chain as any).then = jest.fn((cb) => cb([{ status: "Pending", count: 3 }]));
      return chain;
    }
    if (table === "purchase_orders") {
      (chain as any).then = jest.fn((cb) => cb([{ status: "Issued", count: 2 }, { status: "Completed", count: 5 }]));
      return chain;
    }
    if (table === "production_orders") {
      (chain as any).then = jest.fn((cb) => cb([{ status: "Planned", count: 4 }, { status: "Ready", count: 1 }]));
      return chain;
    }
    if (table === "quality_inspections") {
      (chain as any).then = jest.fn((cb) => cb([{ id: "insp-1", fail_quantity: 5, product_name: "Prod 1" }]));
      return chain;
    }

    return chain;
  });
  return mDb;
});

describe("Dashboard API", () => {
  const token = jwt.sign({ userId: "user-m", role: "Manager" }, process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only");

  it("should fetch dashboard summary successfully", async () => {
    const res = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.inventory.low_stock_items).toHaveLength(1);
    expect(res.body.procurement.pr_status_counts["Pending"]).toBe(3);
    expect(res.body.procurement.po_status_counts["Completed"]).toBe(5);
    expect(res.body.production.order_status_counts["Planned"]).toBe(4);
    expect(res.body.quality.recent_failed_inspections).toHaveLength(1);
  });

  it("should block unauthenticated access", async () => {
    const res = await request(app).get("/api/dashboard/summary");
    expect(res.status).toBe(401);
  });
});
