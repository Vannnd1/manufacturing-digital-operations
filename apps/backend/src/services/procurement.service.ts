import db from "../db";
import { InventoryService } from "./inventory.service";

export class ProcurementService {
  // PR
  static async createPR(userId: string, items: { material_id: string; quantity: number }[]) {
    return await db.transaction(async (trx) => {
      const [pr] = await trx("purchase_requests").insert({
        user_id: userId,
        request_date: new Date(),
        status: "Pending", // Direct to pending for approval
      }).returning("*");

      const prItems = items.map(item => ({
        pr_id: pr.id,
        material_id: item.material_id,
        quantity: item.quantity,
      }));
      await trx("purchase_request_items").insert(prItems);

      await trx("audit_logs").insert({
        user_id: userId, action_type: "CREATE_PR", entity_name: "PURCHASE_REQUEST", entity_id: pr.id,
        description: `Created PR with ${items.length} items`,
      });

      return pr;
    });
  }

  static async getPRs() {
    const prs = await db("purchase_requests")
      .join("users", "purchase_requests.user_id", "users.id")
      .select("purchase_requests.*", "users.name as requester_name")
      .orderBy("request_date", "desc");

    if (prs.length === 0) return prs;

    const prIds = prs.map(pr => pr.id);
    const items = await db("purchase_request_items")
      .join("materials", "purchase_request_items.material_id", "materials.id")
      .whereIn("purchase_request_id", prIds)
      .select(
        "purchase_request_items.purchase_request_id", 
        "purchase_request_items.quantity", 
        "materials.name as material_name", 
        "materials.unit"
      );

    return prs.map(pr => ({
      ...pr,
      items: items.filter(i => i.purchase_request_id === pr.id)
    }));
  }

  static async approvePR(prId: string, status: "Approved" | "Rejected", userId: string) {
    return await db.transaction(async (trx) => {
      const pr = await trx("purchase_requests").where({ id: prId }).first();
      if (!pr) throw new Error("NOT_FOUND");
      if (pr.status !== "Pending") throw new Error("INVALID_TRANSITION");

      const [updated] = await trx("purchase_requests").where({ id: prId }).update({ status }).returning("*");

      await trx("audit_logs").insert({
        user_id: userId, action_type: `APPROVE_PR`, entity_name: "PURCHASE_REQUEST", entity_id: prId,
        description: `PR ${status} by user`,
      });

      return updated;
    });
  }

  // PO
  static async createPO(userId: string, prId: string, supplierId: string, items: { material_id: string; quantity: number, unit_price: number }[]) {
    return await db.transaction(async (trx) => {
      const pr = await trx("purchase_requests").where({ id: prId }).first();
      if (!pr) throw new Error("PR_NOT_FOUND");
      if (pr.status !== "Approved") throw new Error("PR_NOT_APPROVED");

      const [po] = await trx("purchase_orders").insert({
        pr_id: prId,
        supplier_id: supplierId,
        user_id: userId,
        issue_date: new Date(),
        status: "Issued",
      }).returning("*");

      const poItems = items.map(item => ({
        po_id: po.id,
        material_id: item.material_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));
      await trx("purchase_order_items").insert(poItems);

      // Mark PR as Fulfilled (or partially fulfilled, MVP simplifies to Fulfilled)
      await trx("purchase_requests").where({ id: prId }).update({ status: "Fulfilled" });

      await trx("audit_logs").insert({
        user_id: userId, action_type: "CREATE_PO", entity_name: "PURCHASE_ORDER", entity_id: po.id,
        description: `Created PO for PR ${prId}`,
      });

      return po;
    });
  }

  static async getPOs() {
    return await db("purchase_orders")
      .join("suppliers", "purchase_orders.supplier_id", "suppliers.id")
      .select("purchase_orders.*", "suppliers.name as supplier_name")
      .orderBy("issue_date", "desc");
  }

  // Goods Receipt
  static async createGoodsReceipt(userId: string, poId: string, items: { po_item_id: string; received_quantity: number }[]) {
    return await db.transaction(async (trx) => {
      const po = await trx("purchase_orders").where({ id: poId }).first();
      if (!po) throw new Error("PO_NOT_FOUND");
      if (po.status !== "Issued" && po.status !== "Partially_Received") throw new Error("INVALID_PO_STATUS");

      const [gr] = await trx("goods_receipts").insert({
        po_id: poId,
        user_id: userId,
        receipt_date: new Date(),
      }).returning("*");

      for (const item of items) {
        const poItem = await trx("purchase_order_items").where({ id: item.po_item_id, po_id: poId }).first();
        if (!poItem) throw new Error("PO_ITEM_NOT_FOUND");

        await trx("goods_receipt_items").insert({
          receipt_id: gr.id,
          po_item_id: item.po_item_id,
          received_quantity: item.received_quantity,
        });

        // INTEGRATION WITH INVENTORY SERVICE
        await InventoryService.recordTransaction(
          poItem.material_id,
          item.received_quantity,
          "Receipt",
          userId,
          gr.id,
          trx
        );
      }

      await trx("purchase_orders").where({ id: poId }).update({ status: "Completed" }); // Simplified for MVP

      await trx("audit_logs").insert({
        user_id: userId, action_type: "CREATE_GR", entity_name: "GOODS_RECEIPT", entity_id: gr.id,
        description: `Created GR for PO ${poId}`,
      });

      return gr;
    });
  }
}
