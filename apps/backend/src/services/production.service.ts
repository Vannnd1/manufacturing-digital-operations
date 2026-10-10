import db from "../db";
import { InventoryService } from "./inventory.service";

export class ProductionService {
  static async createProductionOrder(userId: string, data: { product_id: string; planned_quantity: number; materials: { material_id: string; required_quantity: number }[] }) {
    return await db.transaction(async (trx) => {
      const product = await trx("products").where({ id: data.product_id }).first();
      if (!product) throw new Error("PRODUCT_NOT_FOUND");

      const [prodo] = await trx("production_orders").insert({
        product_id: data.product_id,
        planned_quantity: data.planned_quantity,
        status: "Planned",
      }).returning("*");

      const prodoMaterials = data.materials.map(m => ({
        prodo_id: prodo.id,
        material_id: m.material_id,
        required_quantity: m.required_quantity,
      }));

      await trx("production_order_materials").insert(prodoMaterials);

      await trx("audit_logs").insert({
        user_id: userId, action_type: "CREATE_PRODO", entity_name: "PRODUCTION_ORDER", entity_id: prodo.id,
        description: `Created Production Order for ${data.planned_quantity} of product ${product.sku}`,
      });

      return prodo;
    });
  }

  static async getProductionOrders() {
    return await db("production_orders")
      .join("products", "production_orders.product_id", "products.id")
      .select("production_orders.*", "products.name as product_name", "products.sku as product_sku")
      .orderBy("production_orders.id", "desc");
  }

  static async getOrderDetails(prodoId: string) {
    const prodo = await db("production_orders")
      .join("products", "production_orders.product_id", "products.id")
      .where("production_orders.id", prodoId)
      .select("production_orders.*", "products.name as product_name", "products.sku as product_sku", "products.unit as product_unit")
      .first();
      
    if (!prodo) throw new Error("NOT_FOUND");

    const materials = await db("production_order_materials")
      .join("materials", "production_order_materials.material_id", "materials.id")
      .leftJoin("inventory", "materials.id", "inventory.material_id")
      .where("production_order_materials.prodo_id", prodoId)
      .select(
        "materials.id as material_id", 
        "materials.sku", 
        "materials.name", 
        "materials.unit", 
        "production_order_materials.required_quantity",
        "inventory.available_stock"
      );

    return { ...prodo, materials };
  }

  static async checkAvailability(prodoId: string) {
    const details = await this.getOrderDetails(prodoId);
    let allAvailable = true;
    const availability = details.materials.map((m: any) => {
      const isAvailable = Number(m.available_stock) >= Number(m.required_quantity);
      if (!isAvailable) allAvailable = false;
      return {
        material_id: m.material_id,
        material_name: m.name ?? null,
        material_sku: m.sku ?? null,
        unit: m.unit ?? null,
        required: Number(m.required_quantity),
        available: Number(m.available_stock),
        is_sufficient: isAvailable,
      };
    });

    return { all_available: allAvailable, materials: availability };
  }

  static async reserveMaterials(userId: string, prodoId: string) {
    return await db.transaction(async (trx) => {
      const prodo = await trx("production_orders").where({ id: prodoId }).first();
      if (!prodo) throw new Error("NOT_FOUND");
      if (prodo.status !== "Planned") throw new Error("INVALID_STATUS");

      const materials = await trx("production_order_materials").where({ prodo_id: prodoId });

      for (const mat of materials) {
        // Reserve logic uses InventoryService which requires atomic operation
        await InventoryService.recordTransaction(
          mat.material_id,
          Number(mat.required_quantity),
          "Reservation",
          userId,
          prodoId, // reference_id
          trx
        );

        await trx("material_reservations").insert({
          prodo_id: prodoId,
          material_id: mat.material_id,
          reserved_quantity: mat.required_quantity,
        });
      }

      await trx("production_orders").where({ id: prodoId }).update({ status: "Ready" });

      await trx("audit_logs").insert({
        user_id: userId, action_type: "RESERVE_PRODO_MATERIALS", entity_name: "PRODUCTION_ORDER", entity_id: prodoId,
        description: `Reserved materials for PRODO ${prodoId}`,
      });

      return { success: true };
    });
  }

  static async recordProduction(userId: string, prodoId: string, actualQuantity: number) {
    return await db.transaction(async (trx) => {
      const prodo = await trx("production_orders").where({ id: prodoId }).first();
      if (!prodo) throw new Error("NOT_FOUND");
      if (prodo.status !== "Ready" && prodo.status !== "In_Progress") throw new Error("INVALID_STATUS");

      // Consuming reserved materials
      const reservations = await trx("material_reservations").where({ prodo_id: prodoId });

      for (const res of reservations) {
        // We only consume once when production completes. In a real system, partial consumption exists. 
        // For MVP, we consume the full reserved amount assuming successful production batch.
        await InventoryService.recordTransaction(
          res.material_id,
          Number(res.reserved_quantity),
          "Consumption",
          userId,
          prodoId,
          trx
        );
        // We could delete the reservation or leave it. Leaving it is fine for audit, 
        // but we'll delete it to keep reserved_stock math clean if we were querying reservations.
        // Actually, inventory_transactions holds the log. We can just delete it from reservations table.
        await trx("material_reservations").where({ id: res.id }).delete();
      }

      const [record] = await trx("production_records").insert({
        prodo_id: prodoId,
        actual_quantity_produced: actualQuantity,
        completion_date: new Date(),
      }).returning("*");

      await trx("production_orders").where({ id: prodoId }).update({ status: "Completed" });

      await trx("audit_logs").insert({
        user_id: userId, action_type: "RECORD_PRODUCTION", entity_name: "PRODUCTION_ORDER", entity_id: prodoId,
        description: `Recorded production of ${actualQuantity} for PRODO ${prodoId}`,
      });

      return record;
    });
  }
}
