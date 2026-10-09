import db from "../db";

export class InventoryService {
  static async getInventory() {
    // Join with materials to get names, SKU and min_stock
    const rows = await db("inventory")
      .join("materials", "inventory.material_id", "=", "materials.id")
      .select(
        "materials.id as material_id",
        "materials.sku",
        "materials.name",
        "materials.unit",
        "materials.min_stock_threshold",
        "inventory.available_stock",
        "inventory.reserved_stock"
      )
      .where("materials.is_active", true)
      .orderBy("materials.name", "asc");

    return rows.map((row) => ({
      ...row,
      available_stock: Number(row.available_stock),
      reserved_stock: Number(row.reserved_stock),
      min_stock_threshold: Number(row.min_stock_threshold),
      status: Number(row.available_stock) < Number(row.min_stock_threshold) ? "Low Stock" : "Normal",
    }));
  }

  static async recordTransaction(
    materialId: string,
    quantityChange: number,
    type: "Receipt" | "Adjustment" | "Reservation" | "Release" | "Consumption",
    userId: string,
    referenceId?: string,
    providedTrx?: any
  ) {
    if (quantityChange <= 0) {
      throw new Error("INVALID_QUANTITY"); 
    }

    const executeLogic = async (trx: any) => {
      const material = await trx("materials").where({ id: materialId, is_active: true }).first();
      if (!material) {
        throw new Error("MATERIAL_NOT_FOUND");
      }

      const inv = await trx("inventory").where({ material_id: materialId }).first();
      if (!inv) throw new Error("INVENTORY_NOT_FOUND");

      let newAvailable = Number(inv.available_stock);
      let newReserved = Number(inv.reserved_stock);
      let actualChange = quantityChange;

      if (type === "Receipt" || type === "Adjustment") {
        newAvailable += quantityChange;
      } else if (type === "Reservation") {
        newAvailable -= quantityChange;
        newReserved += quantityChange;
        actualChange = -quantityChange; // For log perspective
      } else if (type === "Release") {
        newAvailable += quantityChange;
        newReserved -= quantityChange;
        actualChange = quantityChange;
      } else if (type === "Consumption") {
        newReserved -= quantityChange;
        actualChange = -quantityChange;
      }

      if (newAvailable < 0) throw new Error("NEGATIVE_STOCK");
      if (newReserved < 0) throw new Error("NEGATIVE_RESERVED_STOCK");

      await trx("inventory")
        .where({ material_id: materialId })
        .update({ 
          available_stock: newAvailable,
          reserved_stock: newReserved
        });

      const [tx] = await trx("inventory_transactions")
        .insert({
          material_id: materialId,
          transaction_type: type,
          quantity_change: actualChange,
          reference_id: referenceId,
        })
        .returning("*");

      await trx("audit_logs").insert({
        user_id: userId,
        action_type: `INVENTORY_${type.toUpperCase()}`,
        entity_name: "INVENTORY",
        entity_id: materialId,
        description: `Inventory changed by ${actualChange} via ${type}`,
      });

      return tx;
    };

    if (providedTrx) {
      return await executeLogic(providedTrx);
    } else {
      return await db.transaction(executeLogic);
    }
  }
}
