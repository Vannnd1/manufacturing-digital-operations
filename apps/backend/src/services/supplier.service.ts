import db from "../db";

export class SupplierService {
  static async createSupplier(data: { name: string; contact_info?: string; is_active: boolean }, userId: string) {
    const existing = await db("suppliers").whereRaw('LOWER(name) = ?', [data.name.toLowerCase()]).first();
    if (existing) {
      throw new Error("SUPPLIER_EXISTS");
    }

    const [supplier] = await db("suppliers").insert(data).returning("*");

    await db("audit_logs").insert({
      user_id: userId,
      action_type: "CREATE_SUPPLIER",
      entity_name: "SUPPLIER",
      entity_id: supplier.id,
      description: `Created supplier ${supplier.name}`,
    });

    return supplier;
  }

  static async getSuppliers(includeInactive: boolean = false) {
    const query = db("suppliers").select("*").orderBy("name", "asc");
    if (!includeInactive) {
      query.where({ is_active: true });
    }
    return query;
  }

  static async getSupplierById(id: string) {
    const supplier = await db("suppliers").where({ id }).first();
    if (!supplier) throw new Error("NOT_FOUND");
    return supplier;
  }

  static async updateSupplier(id: string, data: Partial<{ name: string; contact_info: string; is_active: boolean }>, userId: string) {
    const supplier = await db("suppliers").where({ id }).first();
    if (!supplier) throw new Error("NOT_FOUND");

    const [updated] = await db("suppliers").where({ id }).update(data).returning("*");

    await db("audit_logs").insert({
      user_id: userId,
      action_type: "UPDATE_SUPPLIER",
      entity_name: "SUPPLIER",
      entity_id: id,
      description: `Updated supplier ${updated.name}`,
    });

    return updated;
  }
}
