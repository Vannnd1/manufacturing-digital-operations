import db from "../db";

export class ProductService {
  static async createProduct(data: { sku: string; name: string; unit: string }, userId: string) {
    const existing = await db("products").where({ sku: data.sku }).first();
    if (existing) throw new Error("SKU_EXISTS");

    const [product] = await db("products").insert(data).returning("*");

    await db("audit_logs").insert({
      user_id: userId, action_type: "CREATE_PRODUCT", entity_name: "PRODUCT", entity_id: product.id,
      description: `Created product ${product.sku}`,
    });

    return product;
  }

  static async getProducts() {
    return await db("products").select("*").orderBy("name", "asc");
  }
}
