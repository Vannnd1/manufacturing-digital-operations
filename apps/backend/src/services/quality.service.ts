import db from "../db";

export class QualityService {
  static async createInspection(userId: string, data: { production_record_id: string; pass_quantity: number; fail_quantity: number; defects?: { defect_reason: string; quantity: number }[] }) {
    return await db.transaction(async (trx) => {
      const prodRecord = await trx("production_records")
        .join("production_orders", "production_records.prodo_id", "production_orders.id")
        .where("production_records.id", data.production_record_id)
        .select("production_records.*", "production_orders.product_id")
        .first();

      if (!prodRecord) throw new Error("PRODUCTION_RECORD_NOT_FOUND");

      const existingInspection = await trx("quality_inspections").where({ production_record_id: data.production_record_id }).first();
      if (existingInspection) throw new Error("INSPECTION_EXISTS");

      const totalInspected = data.pass_quantity + data.fail_quantity;
      if (Number(prodRecord.actual_quantity_produced) !== totalInspected) {
        throw new Error("QUANTITY_MISMATCH");
      }

      if (data.fail_quantity > 0) {
        const defectsTotal = data.defects?.reduce((sum, d) => sum + d.quantity, 0) || 0;
        if (defectsTotal !== data.fail_quantity) {
          throw new Error("DEFECT_QUANTITY_MISMATCH");
        }
      }

      const [inspection] = await trx("quality_inspections").insert({
        production_record_id: data.production_record_id,
        inspector_id: userId,
        pass_quantity: data.pass_quantity,
        fail_quantity: data.fail_quantity,
        inspection_date: new Date(),
      }).returning("*");

      if (data.defects && data.defects.length > 0) {
        const defectInserts = data.defects.map(d => ({
          inspection_id: inspection.id,
          defect_reason: d.defect_reason,
          quantity: d.quantity,
        }));
        await trx("defect_records").insert(defectInserts);
      }

      // Record finished goods if pass_quantity > 0
      // Note: As per ERD, we insert into finished_goods_records. We do not have a finished_goods_inventory table.
      if (data.pass_quantity > 0) {
        await trx("finished_goods_records").insert({
          product_id: prodRecord.product_id,
          inspection_id: inspection.id,
          quantity: data.pass_quantity,
        });
      }

      await trx("audit_logs").insert({
        user_id: userId, action_type: "RECORD_INSPECTION", entity_name: "QUALITY_INSPECTION", entity_id: inspection.id,
        description: `Recorded inspection for production record ${data.production_record_id}. Pass: ${data.pass_quantity}, Fail: ${data.fail_quantity}`,
      });

      return inspection;
    });
  }

  static async getInspections() {
    return await db("quality_inspections")
      .join("production_records", "quality_inspections.production_record_id", "production_records.id")
      .join("users", "quality_inspections.inspector_id", "users.id")
      .select(
        "quality_inspections.*",
        "production_records.prodo_id",
        "users.name as inspector_name"
      )
      .orderBy("quality_inspections.inspection_date", "desc");
  }

  static async getInspectionDetails(id: string) {
    const inspection = await db("quality_inspections")
      .join("production_records", "quality_inspections.production_record_id", "production_records.id")
      .join("users", "quality_inspections.inspector_id", "users.id")
      .where("quality_inspections.id", id)
      .select(
        "quality_inspections.*",
        "production_records.prodo_id",
        "users.name as inspector_name"
      )
      .first();

    if (!inspection) throw new Error("NOT_FOUND");

    const defects = await db("defect_records").where({ inspection_id: id });
    const finishedGoods = await db("finished_goods_records").where({ inspection_id: id }).first();

    return { ...inspection, defects, finished_goods: finishedGoods || null };
  }

  static async getPendingProductionRecords() {
    // Get production records that don't have an associated quality inspection
    return await db("production_records")
      .leftJoin("quality_inspections", "production_records.id", "quality_inspections.production_record_id")
      .join("production_orders", "production_records.prodo_id", "production_orders.id")
      .join("products", "production_orders.product_id", "products.id")
      .whereNull("quality_inspections.id")
      .select(
        "production_records.*",
        "production_orders.status",
        "products.name as product_name",
        "products.sku as product_sku"
      )
      .orderBy("production_records.completion_date", "asc");
  }
}
