import db from "../db";
import { ReportQueryParams, ReportExportParams } from "../schemas/reports.schema";

export function resolveDateRange(range?: string, start?: string, end?: string): { start: string | null; end: string | null } {
  if (range === "custom" && start && end) {
    return { start, end };
  }
  if (range === "7d") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return {
      start: d.toISOString().split("T")[0],
      end: new Date().toISOString().split("T")[0],
    };
  }
  if (range === "30d") {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return {
      start: d.toISOString().split("T")[0],
      end: new Date().toISOString().split("T")[0],
    };
  }
  // "all" or undefined
  return { start: null, end: null };
}

export function sanitizeCsvField(val: any): string {
  if (val === null || val === undefined) return "";
  let str = String(val);
  // Prevent CSV Formula Injection: values beginning with =, +, -, @, tab, or carriage return
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export class ReportsService {
  /**
   * High-Level Executive Summary across all operational modules
   */
  static async getSummary(params: ReportQueryParams) {
    const dateRange = resolveDateRange(params.range, params.startDate, params.endDate);

    const [inventorySummary, procurementSummary, productionSummary, qualitySummary] = await Promise.all([
      this.getInventorySummaryMetrics(dateRange),
      this.getProcurementSummaryMetrics(dateRange),
      this.getProductionSummaryMetrics(dateRange),
      this.getQualitySummaryMetrics(dateRange),
    ]);

    return {
      period: {
        range: params.range || "30d",
        start_date: dateRange.start,
        end_date: dateRange.end,
      },
      inventory: inventorySummary,
      procurement: procurementSummary,
      production: productionSummary,
      quality: qualitySummary,
    };
  }

  /**
   * Inventory Movements & Stock Ledger Report
   */
  static async getInventoryReport(params: ReportQueryParams) {
    const dateRange = resolveDateRange(params.range, params.startDate, params.endDate);

    // Stock levels by material
    const stockQuery = db("materials")
      .leftJoin("inventory", "materials.id", "inventory.material_id")
      .select(
        "materials.id",
        "materials.sku",
        "materials.name",
        "materials.unit",
        "materials.min_stock_threshold",
        "materials.is_active",
        db.raw("COALESCE(inventory.available_stock, 0) as available_stock"),
        db.raw("COALESCE(inventory.reserved_stock, 0) as reserved_stock"),
        db.raw("(COALESCE(inventory.available_stock, 0) + COALESCE(inventory.reserved_stock, 0)) as total_stock")
      )
      .orderBy("materials.name", "asc");

    if (params.materialId) {
      stockQuery.where("materials.id", params.materialId);
    }

    const stockLevels = await stockQuery;

    // Categorize health
    const categorizedStock = stockLevels.map((item: any) => {
      const avail = Number(item.available_stock);
      const minThresh = Number(item.min_stock_threshold);
      let status: "OUT_OF_STOCK" | "LOW_STOCK" | "HEALTHY" = "HEALTHY";
      if (avail <= 0) {
        status = "OUT_OF_STOCK";
      } else if (avail < minThresh) {
        status = "LOW_STOCK";
      }
      return {
        ...item,
        available_stock: avail,
        reserved_stock: Number(item.reserved_stock),
        total_stock: Number(item.total_stock),
        min_stock_threshold: minThresh,
        status,
      };
    });

    // Transactions in period
    const txQuery = db("inventory_transactions")
      .join("materials", "inventory_transactions.material_id", "materials.id")
      .select(
        "inventory_transactions.id",
        "inventory_transactions.material_id",
        "materials.sku as material_sku",
        "materials.name as material_name",
        "materials.unit as material_unit",
        "inventory_transactions.transaction_type",
        "inventory_transactions.quantity_change",
        "inventory_transactions.reference_id",
        "inventory_transactions.created_at"
      )
      .orderBy("inventory_transactions.created_at", "desc");

    if (params.materialId) {
      txQuery.where("inventory_transactions.material_id", params.materialId);
    }
    if (dateRange.start) {
      txQuery.where("inventory_transactions.created_at", ">=", `${dateRange.start} 00:00:00`);
    }
    if (dateRange.end) {
      txQuery.where("inventory_transactions.created_at", "<=", `${dateRange.end} 23:59:59`);
    }

    const transactions = await txQuery;

    // Aggregate transaction movements
    let totalReceipts = 0;
    let totalConsumptions = 0;
    let totalAdjustments = 0;
    let totalReservations = 0;
    let netMovement = 0;

    for (const tx of transactions) {
      const qty = Number(tx.quantity_change);
      netMovement += qty;
      if (tx.transaction_type === "Receipt") totalReceipts += qty;
      else if (tx.transaction_type === "Consumption") totalConsumptions += Math.abs(qty);
      else if (tx.transaction_type === "Adjustment") totalAdjustments += qty;
      else if (tx.transaction_type === "Reservation") totalReservations += qty;
    }

    return {
      period: {
        range: params.range || "30d",
        start_date: dateRange.start,
        end_date: dateRange.end,
      },
      summary: {
        total_materials: categorizedStock.length,
        low_stock_count: categorizedStock.filter((s) => s.status === "LOW_STOCK").length,
        out_of_stock_count: categorizedStock.filter((s) => s.status === "OUT_OF_STOCK").length,
        healthy_stock_count: categorizedStock.filter((s) => s.status === "HEALTHY").length,
        transaction_count: transactions.length,
        total_receipts_qty: totalReceipts,
        total_consumptions_qty: totalConsumptions,
        total_adjustments_qty: totalAdjustments,
        net_movement_qty: netMovement,
      },
      stock_levels: categorizedStock,
      recent_transactions: transactions.slice(0, 50),
    };
  }

  /**
   * Procurement & Spend Insights Report
   */
  static async getProcurementReport(params: ReportQueryParams) {
    const dateRange = resolveDateRange(params.range, params.startDate, params.endDate);

    // Purchase Requests breakdown
    const prQuery = db("purchase_requests")
      .join("users", "purchase_requests.user_id", "users.id")
      .select("purchase_requests.id", "purchase_requests.status", "purchase_requests.request_date", "users.name as requester_name");

    if (dateRange.start) prQuery.where("purchase_requests.request_date", ">=", dateRange.start);
    if (dateRange.end) prQuery.where("purchase_requests.request_date", "<=", dateRange.end);

    const prs = await prQuery;
    const prStatusCounts: Record<string, number> = { Draft: 0, Pending: 0, Approved: 0, Rejected: 0, Fulfilled: 0 };
    for (const pr of prs) {
      prStatusCounts[pr.status] = (prStatusCounts[pr.status] || 0) + 1;
    }

    // Purchase Orders breakdown & spend
    const poQuery = db("purchase_orders")
      .join("suppliers", "purchase_orders.supplier_id", "suppliers.id")
      .select(
        "purchase_orders.id",
        "purchase_orders.pr_id",
        "purchase_orders.supplier_id",
        "suppliers.name as supplier_name",
        "purchase_orders.status",
        "purchase_orders.issue_date"
      )
      .orderBy("purchase_orders.issue_date", "desc");

    if (dateRange.start) poQuery.where("purchase_orders.issue_date", ">=", dateRange.start);
    if (dateRange.end) poQuery.where("purchase_orders.issue_date", "<=", dateRange.end);

    const pos = await poQuery;
    const poIds = pos.map((p) => p.id);

    // Fetch PO items to calculate actual financial spend commitments
    let totalSpend = 0;
    const supplierSpendMap: Record<string, { supplier_name: string; po_count: number; total_spend: number }> = {};

    let poItems: any[] = [];
    if (poIds.length > 0) {
      poItems = await db("purchase_order_items")
        .join("materials", "purchase_order_items.material_id", "materials.id")
        .whereIn("purchase_order_items.po_id", poIds)
        .select(
          "purchase_order_items.po_id",
          "purchase_order_items.material_id",
          "materials.name as material_name",
          "materials.sku as material_sku",
          "purchase_order_items.quantity",
          "purchase_order_items.unit_price"
        );
    }

    const posWithDetails = pos.map((po) => {
      const items = poItems.filter((i) => i.po_id === po.id);
      const poTotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);
      totalSpend += poTotal;

      if (!supplierSpendMap[po.supplier_id]) {
        supplierSpendMap[po.supplier_id] = {
          supplier_name: po.supplier_name,
          po_count: 0,
          total_spend: 0,
        };
      }
      supplierSpendMap[po.supplier_id].po_count += 1;
      supplierSpendMap[po.supplier_id].total_spend += poTotal;

      return {
        ...po,
        total_amount: poTotal,
        item_count: items.length,
      };
    });

    const supplierSpend = Object.values(supplierSpendMap).sort((a, b) => b.total_spend - a.total_spend);

    // Goods Receipts count
    const grQuery = db("goods_receipts")
      .select("id", "po_id", "receipt_date");
    if (dateRange.start) grQuery.where("receipt_date", ">=", dateRange.start);
    if (dateRange.end) grQuery.where("receipt_date", "<=", dateRange.end);
    const grs = await grQuery;

    return {
      period: {
        range: params.range || "30d",
        start_date: dateRange.start,
        end_date: dateRange.end,
      },
      summary: {
        total_prs: prs.length,
        pending_prs: prStatusCounts["Pending"] || 0,
        approved_prs: prStatusCounts["Approved"] || 0,
        rejected_prs: prStatusCounts["Rejected"] || 0,
        fulfilled_prs: prStatusCounts["Fulfilled"] || 0,
        total_pos: pos.length,
        total_procurement_spend: totalSpend,
        total_goods_receipts: grs.length,
      },
      pr_status_breakdown: prStatusCounts,
      supplier_spend: supplierSpend,
      purchase_orders: posWithDetails.slice(0, 50),
    };
  }

  /**
   * Production Yield & Output Report
   */
  static async getProductionReport(params: ReportQueryParams) {
    const dateRange = resolveDateRange(params.range, params.startDate, params.endDate);

    const prodoQuery = db("production_orders")
      .join("products", "production_orders.product_id", "products.id")
      .leftJoin("production_records", "production_orders.id", "production_records.prodo_id")
      .select(
        "production_orders.id as prodo_id",
        "production_orders.product_id",
        "products.sku as product_sku",
        "products.name as product_name",
        "products.unit as product_unit",
        "production_orders.planned_quantity",
        "production_orders.status",
        "production_records.id as record_id",
        "production_records.actual_quantity_produced",
        "production_records.completion_date"
      )
      .orderBy("production_orders.id", "desc");

    if (dateRange.start) {
      prodoQuery.where(function () {
        this.where("production_records.completion_date", ">=", dateRange.start).orWhereNull("production_records.completion_date");
      });
    }
    if (dateRange.end) {
      prodoQuery.where(function () {
        this.where("production_records.completion_date", "<=", dateRange.end).orWhereNull("production_records.completion_date");
      });
    }

    const orders = await prodoQuery;

    let totalPlannedQty = 0;
    let totalActualQty = 0;
    const statusCounts: Record<string, number> = { Planned: 0, Ready: 0, In_Progress: 0, Completed: 0, Cancelled: 0 };

    for (const order of orders) {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      totalPlannedQty += Number(order.planned_quantity);
      if (order.actual_quantity_produced !== null && order.actual_quantity_produced !== undefined) {
        totalActualQty += Number(order.actual_quantity_produced);
      }
    }

    // Safe yield rate calculation: avoid zero division
    const yieldRate = totalPlannedQty > 0 ? Number(((totalActualQty / totalPlannedQty) * 100).toFixed(2)) : 0;

    return {
      period: {
        range: params.range || "30d",
        start_date: dateRange.start,
        end_date: dateRange.end,
      },
      summary: {
        total_orders: orders.length,
        completed_orders: statusCounts["Completed"] || 0,
        active_orders: (statusCounts["Ready"] || 0) + (statusCounts["In_Progress"] || 0),
        planned_orders: statusCounts["Planned"] || 0,
        cancelled_orders: statusCounts["Cancelled"] || 0,
        total_planned_quantity: totalPlannedQty,
        total_actual_quantity: totalActualQty,
        yield_rate_percent: yieldRate,
      },
      status_breakdown: statusCounts,
      orders: orders.slice(0, 50),
    };
  }

  /**
   * Quality Control & Defect Analysis Report
   */
  static async getQualityReport(params: ReportQueryParams) {
    const dateRange = resolveDateRange(params.range, params.startDate, params.endDate);

    const inspQuery = db("quality_inspections")
      .join("production_records", "quality_inspections.production_record_id", "production_records.id")
      .join("production_orders", "production_records.prodo_id", "production_orders.id")
      .join("products", "production_orders.product_id", "products.id")
      .join("users", "quality_inspections.inspector_id", "users.id")
      .select(
        "quality_inspections.id",
        "quality_inspections.inspection_date",
        "quality_inspections.pass_quantity",
        "quality_inspections.fail_quantity",
        "products.sku as product_sku",
        "products.name as product_name",
        "users.name as inspector_name",
        "production_orders.id as prodo_id"
      )
      .orderBy("quality_inspections.inspection_date", "desc");

    if (dateRange.start) inspQuery.where("quality_inspections.inspection_date", ">=", dateRange.start);
    if (dateRange.end) inspQuery.where("quality_inspections.inspection_date", "<=", dateRange.end);

    const inspections = await inspQuery;
    const inspIds = inspections.map((i) => i.id);

    let totalPass = 0;
    let totalFail = 0;

    for (const insp of inspections) {
      totalPass += Number(insp.pass_quantity);
      totalFail += Number(insp.fail_quantity);
    }

    const totalInspected = totalPass + totalFail;
    const defectRate = totalInspected > 0 ? Number(((totalFail / totalInspected) * 100).toFixed(2)) : 0;

    // Defect reason breakdown
    let defectBreakdown: any[] = [];
    if (inspIds.length > 0) {
      const defects = await db("defect_records")
        .whereIn("inspection_id", inspIds)
        .select("defect_reason", "quantity");

      const defectMap: Record<string, { reason: string; quantity: number; occurrences: number }> = {};
      for (const d of defects) {
        const qty = Number(d.quantity);
        if (!defectMap[d.defect_reason]) {
          defectMap[d.defect_reason] = { reason: d.defect_reason, quantity: 0, occurrences: 0 };
        }
        defectMap[d.defect_reason].quantity += qty;
        defectMap[d.defect_reason].occurrences += 1;
      }

      defectBreakdown = Object.values(defectMap)
        .map((d) => ({
          ...d,
          share_percent: totalFail > 0 ? Number(((d.quantity / totalFail) * 100).toFixed(2)) : 0,
        }))
        .sort((a, b) => b.quantity - a.quantity);
    }

    return {
      period: {
        range: params.range || "30d",
        start_date: dateRange.start,
        end_date: dateRange.end,
      },
      summary: {
        total_inspections: inspections.length,
        total_inspected_quantity: totalInspected,
        total_passed_quantity: totalPass,
        total_failed_quantity: totalFail,
        defect_rate_percent: defectRate,
        recent_incident_count: inspections.filter((i) => Number(i.fail_quantity) > 0).length,
      },
      defect_breakdown: defectBreakdown,
      inspections: inspections.slice(0, 50),
    };
  }

  /**
   * CSV Export Generator with formula injection protection
   */
  static async exportReport(params: ReportExportParams): Promise<{ filename: string; csv: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

    if (params.type === "inventory") {
      const report = await this.getInventoryReport(params);
      const headers = ["Material SKU", "Material Name", "Unit", "Available Stock", "Reserved Stock", "Total Stock", "Min Threshold", "Status"];
      const rows = report.stock_levels.map((item: any) => [
        sanitizeCsvField(item.sku),
        sanitizeCsvField(item.name),
        sanitizeCsvField(item.unit),
        sanitizeCsvField(item.available_stock),
        sanitizeCsvField(item.reserved_stock),
        sanitizeCsvField(item.total_stock),
        sanitizeCsvField(item.min_stock_threshold),
        sanitizeCsvField(item.status),
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      return { filename: `inventory-report-${timestamp}.csv`, csv };
    }

    if (params.type === "procurement") {
      const report = await this.getProcurementReport(params);
      const headers = ["PO ID", "Supplier Name", "Status", "Issue Date", "Item Count", "Total Amount ($)"];
      const rows = report.purchase_orders.map((po: any) => [
        sanitizeCsvField(po.id),
        sanitizeCsvField(po.supplier_name),
        sanitizeCsvField(po.status),
        sanitizeCsvField(po.issue_date),
        sanitizeCsvField(po.item_count),
        sanitizeCsvField(po.total_amount),
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      return { filename: `procurement-spend-${timestamp}.csv`, csv };
    }

    if (params.type === "production") {
      const report = await this.getProductionReport(params);
      const headers = ["Order ID", "Product SKU", "Product Name", "Planned Qty", "Actual Qty", "Status", "Completion Date"];
      const rows = report.orders.map((o: any) => [
        sanitizeCsvField(o.prodo_id),
        sanitizeCsvField(o.product_sku),
        sanitizeCsvField(o.product_name),
        sanitizeCsvField(o.planned_quantity),
        sanitizeCsvField(o.actual_quantity_produced ?? 0),
        sanitizeCsvField(o.status),
        sanitizeCsvField(o.completion_date ?? "N/A"),
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      return { filename: `production-yield-${timestamp}.csv`, csv };
    }

    if (params.type === "quality") {
      const report = await this.getQualityReport(params);
      const headers = ["Inspection ID", "Date", "Product SKU", "Product Name", "Inspector", "Passed Qty", "Failed Qty"];
      const rows = report.inspections.map((i: any) => [
        sanitizeCsvField(i.id),
        sanitizeCsvField(i.inspection_date),
        sanitizeCsvField(i.product_sku),
        sanitizeCsvField(i.product_name),
        sanitizeCsvField(i.inspector_name),
        sanitizeCsvField(i.pass_quantity),
        sanitizeCsvField(i.fail_quantity),
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      return { filename: `quality-inspections-${timestamp}.csv`, csv };
    }

    throw new Error("INVALID_REPORT_TYPE");
  }

  // --- Private Summary Helpers ---

  private static async getInventorySummaryMetrics(dateRange: { start: string | null; end: string | null }) {
    const materials = await db("materials")
      .leftJoin("inventory", "materials.id", "inventory.material_id")
      .select(
        "materials.id",
        "materials.min_stock_threshold",
        db.raw("COALESCE(inventory.available_stock, 0) as available_stock")
      );

    let lowStock = 0;
    let outOfStock = 0;
    for (const m of materials) {
      const avail = Number(m.available_stock);
      const thresh = Number(m.min_stock_threshold);
      if (avail <= 0) outOfStock++;
      else if (avail < thresh) lowStock++;
    }

    const txQuery = db("inventory_transactions").select(
      db.raw("COUNT(*) as count"),
      db.raw("COALESCE(SUM(quantity_change), 0) as net_change")
    );
    if (dateRange.start) txQuery.where("created_at", ">=", `${dateRange.start} 00:00:00`);
    if (dateRange.end) txQuery.where("created_at", "<=", `${dateRange.end} 23:59:59`);
    const [txSummary] = await txQuery;

    return {
      total_materials: materials.length,
      low_stock_count: lowStock,
      out_of_stock_count: outOfStock,
      transaction_count: Number((txSummary as any)?.count || 0),
      net_quantity_movement: Number((txSummary as any)?.net_change || 0),
    };
  }

  private static async getProcurementSummaryMetrics(dateRange: { start: string | null; end: string | null }) {
    const prQuery = db("purchase_requests").select("status");
    if (dateRange.start) prQuery.where("request_date", ">=", dateRange.start);
    if (dateRange.end) prQuery.where("request_date", "<=", dateRange.end);
    const prs = await prQuery;

    const pendingPrs = prs.filter((p) => p.status === "Pending").length;

    const poQuery = db("purchase_orders").select("id");
    if (dateRange.start) poQuery.where("issue_date", ">=", dateRange.start);
    if (dateRange.end) poQuery.where("issue_date", "<=", dateRange.end);
    const pos = await poQuery;

    let totalSpend = 0;
    if (pos.length > 0) {
      const poIds = pos.map((p) => p.id);
      const [spendResult] = await db("purchase_order_items")
        .whereIn("po_id", poIds)
        .select(db.raw("COALESCE(SUM(quantity * unit_price), 0) as total_spend"));
      totalSpend = Number((spendResult as any)?.total_spend || 0);
    }

    const grQuery = db("goods_receipts").select(db.raw("COUNT(*) as count"));
    if (dateRange.start) grQuery.where("receipt_date", ">=", dateRange.start);
    if (dateRange.end) grQuery.where("receipt_date", "<=", dateRange.end);
    const [grResult] = await grQuery;

    return {
      total_prs: prs.length,
      pending_prs: pendingPrs,
      total_pos: pos.length,
      total_spend_commitment: totalSpend,
      total_goods_receipts: Number(grResult?.count || 0),
    };
  }

  private static async getProductionSummaryMetrics(dateRange: { start: string | null; end: string | null }) {
    const prodoQuery = db("production_orders")
      .leftJoin("production_records", "production_orders.id", "production_records.prodo_id")
      .select("production_orders.status", "production_orders.planned_quantity", "production_records.actual_quantity_produced");

    if (dateRange.start) {
      prodoQuery.where(function () {
        this.where("production_records.completion_date", ">=", dateRange.start).orWhereNull("production_records.completion_date");
      });
    }
    if (dateRange.end) {
      prodoQuery.where(function () {
        this.where("production_records.completion_date", "<=", dateRange.end).orWhereNull("production_records.completion_date");
      });
    }

    const orders = await prodoQuery;
    let completed = 0;
    let active = 0;
    let totalPlanned = 0;
    let totalActual = 0;

    for (const o of orders) {
      if (o.status === "Completed") completed++;
      if (o.status === "Ready" || o.status === "In_Progress") active++;
      totalPlanned += Number(o.planned_quantity);
      if (o.actual_quantity_produced !== null && o.actual_quantity_produced !== undefined) {
        totalActual += Number(o.actual_quantity_produced);
      }
    }

    const yieldRate = totalPlanned > 0 ? Number(((totalActual / totalPlanned) * 100).toFixed(2)) : 0;

    return {
      total_orders: orders.length,
      completed_orders: completed,
      active_orders: active,
      total_planned_quantity: totalPlanned,
      total_actual_quantity: totalActual,
      yield_rate_percent: yieldRate,
    };
  }

  private static async getQualitySummaryMetrics(dateRange: { start: string | null; end: string | null }) {
    const inspQuery = db("quality_inspections").select("pass_quantity", "fail_quantity");
    if (dateRange.start) inspQuery.where("inspection_date", ">=", dateRange.start);
    if (dateRange.end) inspQuery.where("inspection_date", "<=", dateRange.end);
    const inspections = await inspQuery;

    let totalPass = 0;
    let totalFail = 0;
    let incidents = 0;

    for (const i of inspections) {
      const p = Number(i.pass_quantity);
      const f = Number(i.fail_quantity);
      totalPass += p;
      totalFail += f;
      if (f > 0) incidents++;
    }

    const totalInspected = totalPass + totalFail;
    const defectRate = totalInspected > 0 ? Number(((totalFail / totalInspected) * 100).toFixed(2)) : 0;

    return {
      total_inspections: inspections.length,
      total_inspected_quantity: totalInspected,
      total_passed_quantity: totalPass,
      total_failed_quantity: totalFail,
      defect_rate_percent: defectRate,
      quality_incident_count: incidents,
    };
  }
}
