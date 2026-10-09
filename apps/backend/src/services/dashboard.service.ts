import db from "../db";

export class DashboardService {
  static async getSummary() {
    const [lowStockItems, prStatus, poStatus, prodoStatus, recentFailedInspections] = await Promise.all([
      this.getLowStockItems(),
      this.getPRStatusCounts(),
      this.getPOStatusCounts(),
      this.getProdoStatusCounts(),
      this.getRecentFailedInspections()
    ]);

    return {
      inventory: {
        low_stock_items: lowStockItems
      },
      procurement: {
        pr_status_counts: prStatus,
        po_status_counts: poStatus
      },
      production: {
        order_status_counts: prodoStatus
      },
      quality: {
        recent_failed_inspections: recentFailedInspections
      }
    };
  }

  private static async getLowStockItems() {
    return await db("inventory")
      .join("materials", "inventory.material_id", "materials.id")
      .whereRaw("inventory.available_stock < materials.min_stock_threshold")
      .select("materials.id", "materials.sku", "materials.name", "inventory.available_stock", "materials.min_stock_threshold")
      .limit(10);
  }

  private static async getPRStatusCounts() {
    const counts = await db("purchase_requests")
      .select("status")
      .count("* as count")
      .groupBy("status");
    return this.mapCounts(counts);
  }

  private static async getPOStatusCounts() {
    const counts = await db("purchase_orders")
      .select("status")
      .count("* as count")
      .groupBy("status");
    return this.mapCounts(counts);
  }

  private static async getProdoStatusCounts() {
    const counts = await db("production_orders")
      .select("status")
      .count("* as count")
      .groupBy("status");
    return this.mapCounts(counts);
  }

  private static async getRecentFailedInspections() {
    return await db("quality_inspections")
      .join("production_records", "quality_inspections.production_record_id", "production_records.id")
      .join("production_orders", "production_records.prodo_id", "production_orders.id")
      .join("products", "production_orders.product_id", "products.id")
      .where("quality_inspections.fail_quantity", ">", 0)
      .select(
        "quality_inspections.id",
        "quality_inspections.inspection_date",
        "quality_inspections.fail_quantity",
        "products.name as product_name",
        "products.sku as product_sku"
      )
      .orderBy("quality_inspections.inspection_date", "desc")
      .limit(5);
  }

  private static mapCounts(dbResults: any[]) {
    const map: Record<string, number> = {};
    for (const row of dbResults) {
      map[row.status] = Number(row.count);
    }
    return map;
  }
}
