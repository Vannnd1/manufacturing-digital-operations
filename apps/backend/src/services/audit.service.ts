import db from "../db";

export interface AuditLogFilter {
  entity_name?: string;
  entity_id?: string;
  action_type?: string;
  user_id?: string;
  limit?: number;
  offset?: number;
}

export class AuditService {
  /**
   * Query chronological audit logs with actor attribution (user name, email, role).
   */
  static async getLogs(filter?: AuditLogFilter) {
    const limit = Math.min(Number(filter?.limit) || 100, 500);
    const offset = Number(filter?.offset) || 0;

    let query = db("audit_logs")
      .leftJoin("users", "audit_logs.user_id", "=", "users.id")
      .leftJoin("roles", "users.role_id", "=", "roles.id")
      .select(
        "audit_logs.id",
        "audit_logs.user_id",
        "users.name as user_name",
        "users.email as user_email",
        "roles.name as user_role",
        "audit_logs.action_type",
        "audit_logs.entity_name",
        "audit_logs.entity_id",
        "audit_logs.description",
        "audit_logs.created_at"
      )
      .orderBy("audit_logs.created_at", "desc")
      .limit(limit)
      .offset(offset);

    if (filter?.entity_name) {
      query = query.where("audit_logs.entity_name", filter.entity_name);
    }
    if (filter?.entity_id) {
      query = query.where("audit_logs.entity_id", filter.entity_id);
    }
    if (filter?.action_type) {
      query = query.where("audit_logs.action_type", filter.action_type);
    }
    if (filter?.user_id) {
      query = query.where("audit_logs.user_id", filter.user_id);
    }

    const logs = await query;
    return logs;
  }

  /**
   * End-to-end production order genealogy & traceability.
   * Connects:
   * Production Order -> Materials Required -> Stock Reservations/Consumptions ->
   * Production Record -> QC Inspection -> Defect Records -> Finished Goods Record ->
   * Upstream Supplier Goods Receipts.
   */
  static async getProductionOrderTrace(prodoId: string) {
    // 1. Production Order header
    const order = await db("production_orders")
      .join("products", "production_orders.product_id", "=", "products.id")
      .where("production_orders.id", prodoId)
      .select(
        "production_orders.id",
        "production_orders.product_id",
        "products.sku as product_sku",
        "products.name as product_name",
        "products.unit as product_unit",
        "production_orders.planned_quantity",
        "production_orders.status"
      )
      .first();

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    // 2. Audit history for this order
    const orderAuditLogs = await db("audit_logs")
      .leftJoin("users", "audit_logs.user_id", "=", "users.id")
      .leftJoin("roles", "users.role_id", "=", "roles.id")
      .where("audit_logs.entity_id", prodoId)
      .select(
        "audit_logs.id",
        "audit_logs.action_type",
        "audit_logs.description",
        "audit_logs.created_at",
        "users.name as actor_name",
        "roles.name as actor_role"
      )
      .orderBy("audit_logs.created_at", "asc");

    // 3. Bill of Materials requirements
    const bomMaterials = await db("production_order_materials")
      .join("materials", "production_order_materials.material_id", "=", "materials.id")
      .where("production_order_materials.prodo_id", prodoId)
      .select(
        "production_order_materials.material_id",
        "materials.sku as material_sku",
        "materials.name as material_name",
        "materials.unit",
        "production_order_materials.required_quantity"
      );

    // 4. Stock movement ledger for this order (reservations, releases, consumptions)
    const stockTransactions = await db("inventory_transactions")
      .join("materials", "inventory_transactions.material_id", "=", "materials.id")
      .where("inventory_transactions.reference_id", prodoId)
      .select(
        "inventory_transactions.id",
        "inventory_transactions.material_id",
        "materials.sku as material_sku",
        "materials.name as material_name",
        "materials.unit",
        "inventory_transactions.transaction_type",
        "inventory_transactions.quantity_change",
        "inventory_transactions.created_at"
      )
      .orderBy("inventory_transactions.created_at", "asc");

    // 5. Production execution record
    const productionRecord = await db("production_records")
      .where("production_records.prodo_id", prodoId)
      .select(
        "production_records.id",
        "production_records.actual_quantity_produced",
        "production_records.completion_date"
      )
      .first();

    // 6. QC inspection and defects
    let qualityInspection: any = null;
    let defectRecords: any[] = [];
    let finishedGoodsRecord: any = null;

    if (productionRecord) {
      const inspection = await db("quality_inspections")
        .leftJoin("users", "quality_inspections.inspector_id", "=", "users.id")
        .where("quality_inspections.production_record_id", productionRecord.id)
        .select(
          "quality_inspections.id",
          "quality_inspections.inspector_id",
          "users.name as inspector_name",
          "quality_inspections.pass_quantity",
          "quality_inspections.fail_quantity",
          "quality_inspections.inspection_date"
        )
        .first();

      if (inspection) {
        qualityInspection = {
          ...inspection,
          pass_quantity: Number(inspection.pass_quantity),
          fail_quantity: Number(inspection.fail_quantity),
        };

        defectRecords = await db("defect_records")
          .where("defect_records.inspection_id", inspection.id)
          .select("id", "defect_reason", "quantity");

        finishedGoodsRecord = await db("finished_goods_records")
          .where("finished_goods_records.inspection_id", inspection.id)
          .select("id", "product_id", "quantity")
          .first();
      }
    }

    // 7. Upstream Supplier Origin for the consumed raw materials
    const materialIds = bomMaterials.map((m: any) => m.material_id);
    let upstreamProcurement: any[] = [];
    if (materialIds.length > 0) {
      upstreamProcurement = await db("goods_receipt_items")
        .join("goods_receipts", "goods_receipt_items.receipt_id", "=", "goods_receipts.id")
        .join("purchase_order_items", "goods_receipt_items.po_item_id", "=", "purchase_order_items.id")
        .join("purchase_orders", "purchase_order_items.po_id", "=", "purchase_orders.id")
        .join("suppliers", "purchase_orders.supplier_id", "=", "suppliers.id")
        .join("materials", "purchase_order_items.material_id", "=", "materials.id")
        .whereIn("purchase_order_items.material_id", materialIds)
        .select(
          "materials.id as material_id",
          "materials.sku as material_sku",
          "materials.name as material_name",
          "suppliers.name as supplier_name",
          "purchase_orders.id as po_id",
          "goods_receipts.id as receipt_id",
          "goods_receipts.receipt_date",
          "goods_receipt_items.received_quantity",
          "materials.unit"
        )
        .orderBy("goods_receipts.receipt_date", "desc")
        .limit(10);
    }

    return {
      order: {
        ...order,
        planned_quantity: Number(order.planned_quantity),
      },
      audit_timeline: orderAuditLogs,
      bom_requirements: bomMaterials.map((m: any) => ({
        ...m,
        required_quantity: Number(m.required_quantity),
      })),
      stock_movements: stockTransactions.map((t: any) => ({
        ...t,
        quantity_change: Number(t.quantity_change),
      })),
      production_record: productionRecord
        ? {
            ...productionRecord,
            actual_quantity_produced: Number(productionRecord.actual_quantity_produced),
          }
        : null,
      quality_inspection: qualityInspection,
      defects: defectRecords.map((d: any) => ({
        ...d,
        quantity: Number(d.quantity),
      })),
      finished_goods: finishedGoodsRecord
        ? {
            ...finishedGoodsRecord,
            quantity: Number(finishedGoodsRecord.quantity),
          }
        : null,
      upstream_procurement: upstreamProcurement.map((u: any) => ({
        ...u,
        received_quantity: Number(u.received_quantity),
      })),
    };
  }

  /**
   * Material stock lineage and full traceability.
   */
  static async getMaterialTrace(materialId: string) {
    const material = await db("materials")
      .leftJoin("inventory", "materials.id", "=", "inventory.material_id")
      .where("materials.id", materialId)
      .select(
        "materials.id",
        "materials.sku",
        "materials.name",
        "materials.unit",
        "materials.min_stock_threshold",
        "materials.is_active",
        "inventory.available_stock",
        "inventory.reserved_stock"
      )
      .first();

    if (!material) {
      throw new Error("MATERIAL_NOT_FOUND");
    }

    // Historical stock ledger
    const transactions = await db("inventory_transactions")
      .where("inventory_transactions.material_id", materialId)
      .select(
        "id",
        "transaction_type",
        "quantity_change",
        "reference_id",
        "created_at"
      )
      .orderBy("created_at", "desc")
      .limit(100);

    // Audit logs for this material or inventory
    const auditLogs = await db("audit_logs")
      .leftJoin("users", "audit_logs.user_id", "=", "users.id")
      .where(function () {
        this.where({ entity_name: "MATERIAL", entity_id: materialId })
          .orWhere({ entity_name: "INVENTORY", entity_id: materialId });
      })
      .select(
        "audit_logs.id",
        "audit_logs.action_type",
        "audit_logs.description",
        "audit_logs.created_at",
        "users.name as actor_name"
      )
      .orderBy("audit_logs.created_at", "desc")
      .limit(50);

    return {
      material: {
        ...material,
        min_stock_threshold: Number(material.min_stock_threshold),
        available_stock: Number(material.available_stock || 0),
        reserved_stock: Number(material.reserved_stock || 0),
      },
      stock_ledger: transactions.map((tx: any) => ({
        ...tx,
        quantity_change: Number(tx.quantity_change),
      })),
      audit_logs: auditLogs,
    };
  }
}
