import db from "../db";

export class MaterialService {
  static async createMaterial(data: { sku: string; name: string; unit: string; min_stock_threshold: number; is_active: boolean }, userId: string) {
    return await db.transaction(async (trx) => {
      const existing = await trx("materials").where({ sku: data.sku }).first();
      if (existing) {
        throw new Error("SKU_EXISTS");
      }

      const [material] = await trx("materials").insert(data).returning("*");

      // Initialize inventory for new material atomically
      await trx("inventory").insert({ material_id: material.id, available_stock: 0, reserved_stock: 0 });

      await trx("audit_logs").insert({
        user_id: userId,
        action_type: "CREATE_MATERIAL",
        entity_name: "MATERIAL",
        entity_id: material.id,
        description: `Created material ${material.sku}`,
      });

      return material;
    });
  }

  static async getMaterials(includeInactive: boolean = false) {
    const query = db("materials").select("*").orderBy("name", "asc");
    if (!includeInactive) {
      query.where({ is_active: true });
    }
    return query;
  }

  static async getMaterialById(id: string) {
    const material = await db("materials").where({ id }).first();
    if (!material) throw new Error("NOT_FOUND");
    return material;
  }

  static async updateMaterial(id: string, data: Partial<{ name: string; unit: string; min_stock_threshold: number; is_active: boolean }>, userId: string) {
    const material = await db("materials").where({ id }).first();
    if (!material) throw new Error("NOT_FOUND");

    const [updated] = await db("materials").where({ id }).update(data).returning("*");

    await db("audit_logs").insert({
      user_id: userId,
      action_type: "UPDATE_MATERIAL",
      entity_name: "MATERIAL",
      entity_id: id,
      description: `Updated material ${material.sku}`,
    });

    return updated;
  }
}
