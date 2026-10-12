import request from "supertest";
import app from "./app";
import jwt from "jsonwebtoken";

const validPrId = "11111111-1111-1111-1111-111111111111";
const validPoId = "44444444-4444-4444-4444-444444444444";
const notFoundPoId = "99999999-9999-9999-9999-999999999999";
const validPoItemId = "55555555-5555-5555-5555-555555555555";
const validSupplierId = "22222222-2222-2222-2222-222222222222";
const validMaterialId = "33333333-3333-3333-3333-333333333333";

jest.mock("./db", () => {
  const mDb: any = jest.fn((table: string) => {
    if (table === "purchase_requests") {
      const prs = [
        { id: validPrId, user_id: "user-p", status: "Pending", requester_name: "Purchasing Staff" }
      ];
      const builder: any = {
        join: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(prs)),
      };
      return builder;
    }
    if (table === "purchase_request_items") {
      const items = [
        { pr_id: validPrId, quantity: 10, material_name: "Steel Sheet", unit: "kg" }
      ];
      const builder: any = {
        join: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(items)),
      };
      return builder;
    }
    if (table === "purchase_orders") {
      let isIdLookup: string | null = null;
      const pos = [
        { id: validPoId, pr_id: validPrId, supplier_id: validSupplierId, supplier_name: "Acme Corp", status: "Issued", issue_date: "2026-01-01" }
      ];
      const builder: any = {
        join: jest.fn().mockReturnThis(),
        where: jest.fn((fieldOrClause: any, val?: any) => {
          if (fieldOrClause === "purchase_orders.id" || fieldOrClause === "id") {
            isIdLookup = val;
          } else if (typeof fieldOrClause === "object" && fieldOrClause?.id) {
            isIdLookup = fieldOrClause.id;
          }
          return builder;
        }),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        first: jest.fn(() => {
          if (isIdLookup === validPoId) return Promise.resolve(pos[0]);
          if (isIdLookup === notFoundPoId) return Promise.resolve(null);
          return Promise.resolve(null);
        }),
        then: jest.fn((cb) => cb(pos)),
      };
      return builder;
    }
    if (table === "purchase_order_items") {
      const items = [
        {
          po_item_id: validPoItemId,
          po_id: validPoId,
          material_id: validMaterialId,
          quantity: 10,
          unit_price: 100,
          material_name: "Steel Sheet",
          material_sku: "SKU-01",
          unit: "kg"
        }
      ];
      const builder: any = {
        join: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => cb(items)),
      };
      return builder;
    }
    return {};
  });

  mDb.transaction = jest.fn(async (cb) => {
    const trx = jest.fn((table: string) => {
      if (table === "purchase_requests") return {
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: validPrId, status: "Pending" }]),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: validPrId, status: "Approved" }),
        update: jest.fn().mockReturnThis()
      };
      if (table === "purchase_request_items") return { insert: jest.fn().mockResolvedValue([1]) };

      if (table === "purchase_orders") return {
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: validPoId, status: "Issued" }]),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: validPoId, status: "Issued" }),
        update: jest.fn().mockReturnThis()
      };
      if (table === "purchase_order_items") return {
        insert: jest.fn().mockResolvedValue([1]),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: validPoItemId, po_id: validPoId, material_id: validMaterialId, quantity: 10 }),
      };

      if (table === "goods_receipts") return {
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: "gr-1" }])
      };
      if (table === "goods_receipt_items") return { insert: jest.fn().mockResolvedValue([1]) };

      if (table === "suppliers") return { where: jest.fn().mockReturnThis(), first: jest.fn().mockResolvedValue({ id: validSupplierId, is_active: true }) };
      if (table === "materials") return { where: jest.fn().mockReturnThis(), first: jest.fn().mockResolvedValue({ id: validMaterialId, is_active: true }) };
      if (table === "inventory") return { where: jest.fn().mockReturnThis(), first: jest.fn().mockResolvedValue({ available_stock: 50 }), update: jest.fn().mockResolvedValue([1]) };
      if (table === "inventory_transactions") return { insert: jest.fn().mockReturnThis(), returning: jest.fn().mockResolvedValue([{ id: "tx-1" }]) };

      if (table === "audit_logs") return { insert: jest.fn().mockResolvedValue([1]) };
      return {};
    });
    return await cb(trx);
  });
  return mDb;
});

describe("Procurement API & GR Integration", () => {
  const purchasingToken = jwt.sign({ userId: "user-p", role: "Purchasing" }, process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only");
  const managerToken = jwt.sign({ userId: "user-m", role: "Manager" }, process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only");
  const warehouseToken = jwt.sign({ userId: "user-w", role: "Warehouse" }, process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only");

  it("should create PR successfully", async () => {
    const res = await request(app)
      .post("/api/procurement/pr")
      .set("Authorization", `Bearer ${purchasingToken}`)
      .send({ items: [{ material_id: "e5a8f09f-4318-4c6e-b39f-b9f123456789", quantity: 10 }] });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Pending");
  });

  it("should list PRs with requester and item details", async () => {
    const res = await request(app)
      .get("/api/procurement/pr")
      .set("Authorization", `Bearer ${purchasingToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].items.length).toBe(1);
  });

  it("should block unauthorized approval", async () => {
    const res = await request(app)
      .patch(`/api/procurement/pr/${validPrId}/approve`)
      .set("Authorization", `Bearer ${purchasingToken}`)
      .send({ status: "Approved" });
    expect(res.status).toBe(403);
  });

  it("should validate PR approval status transition", async () => {
    const res = await request(app)
      .patch(`/api/procurement/pr/${validPrId}/approve`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ status: "Approved" });
    expect(res.status).toBe(400); // Because it's already "Approved" in the mock, transition is invalid
  });

  it("should create PO successfully", async () => {
    const res = await request(app)
      .post("/api/procurement/po")
      .set("Authorization", `Bearer ${purchasingToken}`)
      .send({
        pr_id: validPrId,
        supplier_id: validSupplierId,
        items: [{ material_id: validMaterialId, quantity: 10, unit_price: 100 }]
      });
    expect(res.status).toBe(201);
  });

  it("should list POs with supplier name and items", async () => {
    const res = await request(app)
      .get("/api/procurement/po")
      .set("Authorization", `Bearer ${purchasingToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].supplier_name).toBe("Acme Corp");
    expect(res.body[0].items.length).toBe(1);
  });

  it("should retrieve single PO by ID with nested line items", async () => {
    const res = await request(app)
      .get(`/api/procurement/po/${validPoId}`)
      .set("Authorization", `Bearer ${purchasingToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(validPoId);
    expect(res.body.supplier_name).toBe("Acme Corp");
    expect(res.body.items.length).toBe(1);
  });

  it("should return 404 when PO ID does not exist", async () => {
    const res = await request(app)
      .get(`/api/procurement/po/${notFoundPoId}`)
      .set("Authorization", `Bearer ${purchasingToken}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  it("should create GR and integrate with inventory", async () => {
    const res = await request(app)
      .post("/api/procurement/gr")
      .set("Authorization", `Bearer ${warehouseToken}`)
      .send({
        po_id: validPoId,
        items: [{ po_item_id: validPoItemId, received_quantity: 10 }]
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe("gr-1");
  });
});
