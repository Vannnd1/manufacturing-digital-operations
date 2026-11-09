import { mockStore } from "./mockData";

export function handleMockRequest(url: string, method: string = "get", data?: any): any {
  const normMethod = (method || "get").toLowerCase();
  // Strip origin and leading /api
  let path = (url || "").replace(/^https?:\/\/[^/]+/, "");
  if (path.startsWith("/api")) {
    path = path.slice(4);
  }
  const [pathname, queryString] = path.split("?");
  const query = new URLSearchParams(queryString || "");

  // Safely parse JSON data if passed as string (e.g. from Axios transformRequest or raw payload)
  let payload: any = data;
  if (typeof data === "string") {
    try {
      payload = JSON.parse(data);
    } catch {
      payload = {};
    }
  } else if (!payload || typeof payload !== "object") {
    payload = {};
  }

  // 1. Auth
  if (pathname === "/auth/login" && normMethod === "post") {
    return mockStore.login(payload);
  }
  if (pathname === "/auth/seed-demo-users") {
    return { message: "Demo users ready" };
  }

  // 2. Materials
  if (pathname === "/materials") {
    if (normMethod === "get") {
      const includeInactive = query.get("includeInactive") === "true";
      return mockStore.getMaterials(includeInactive);
    }
    if (normMethod === "post") {
      return mockStore.createMaterial(payload);
    }
  }
  const matMatch = pathname.match(/^\/materials\/([^/]+)$/);
  if (matMatch && normMethod === "patch") {
    return mockStore.updateMaterial(matMatch[1], payload);
  }

  // 3. Inventory
  if (pathname === "/inventory" && normMethod === "get") {
    return mockStore.getInventory();
  }
  if (pathname === "/inventory/transaction" && normMethod === "post") {
    return mockStore.adjustInventory(payload);
  }
  if (pathname === "/inventory/transactions" && normMethod === "get") {
    return mockStore.getInventoryTransactions();
  }

  // 4. Procurement
  if (pathname === "/suppliers") {
    if (normMethod === "get") return mockStore.getSuppliers();
    if (normMethod === "post") return mockStore.createSupplier(payload);
  }
  if (pathname === "/procurement/pr") {
    if (normMethod === "get") return mockStore.getPRs();
    if (normMethod === "post") return mockStore.createPR(payload);
  }
  const prApproveMatch = pathname.match(/^\/procurement\/pr\/([^/]+)\/approve$/);
  if (prApproveMatch && normMethod === "patch") {
    return mockStore.approvePR(prApproveMatch[1], payload?.status || "Approved");
  }
  if (pathname === "/procurement/po") {
    if (normMethod === "get") return mockStore.getPOs();
    if (normMethod === "post") return mockStore.createPO(payload);
  }
  if (pathname === "/procurement/gr" && normMethod === "post") {
    return mockStore.createGR(payload);
  }

  // 5. Products
  if (pathname === "/products" && normMethod === "get") {
    return mockStore.getProducts();
  }

  // 6. Production
  if (pathname === "/production") {
    if (normMethod === "get") return mockStore.getProductionOrders();
    if (normMethod === "post") return mockStore.createProductionOrder(payload);
  }
  const availMatch = pathname.match(/^\/production\/([^/]+)\/availability$/);
  if (availMatch && normMethod === "get") {
    return mockStore.checkAvailability(availMatch[1]);
  }
  const resMatch = pathname.match(/^\/production\/([^/]+)\/reserve$/);
  if (resMatch && normMethod === "post") {
    return mockStore.reserveMaterials(resMatch[1]);
  }
  const recMatch = pathname.match(/^\/production\/([^/]+)\/record$/);
  if (recMatch && normMethod === "post") {
    return mockStore.recordProduction(recMatch[1], Number(payload?.actual_quantity_produced) || 1);
  }
  const cancelMatch = pathname.match(/^\/production\/([^/]+)\/cancel$/);
  if (cancelMatch && normMethod === "post") {
    return mockStore.cancelProductionOrder(cancelMatch[1]);
  }

  // 7. Quality
  if (pathname === "/quality") {
    if (normMethod === "get") return mockStore.getInspections();
    if (normMethod === "post") return mockStore.createInspection(payload);
  }
  if (pathname === "/quality/pending" && normMethod === "get") {
    return mockStore.getPendingInspections();
  }

  // 8. Dashboard & Reports
  if (pathname === "/health/sync-catalog") {
    return { status: "ok", message: "Catalog synchronized" };
  }
  if (pathname === "/dashboard/summary" && normMethod === "get") {
    return mockStore.getDashboardSummary();
  }
  if (pathname.startsWith("/reports/summary") && normMethod === "get") {
    return mockStore.getReportsSummary();
  }
  if (pathname.startsWith("/reports/inventory-movements") && normMethod === "get") {
    return mockStore.getInventoryReport();
  }
  if (pathname.startsWith("/reports/procurement-spend") && normMethod === "get") {
    return mockStore.getProcurementReport();
  }
  if (pathname.startsWith("/reports/production-yield") && normMethod === "get") {
    return mockStore.getProductionReport();
  }
  if (pathname.startsWith("/reports/quality-defects") && normMethod === "get") {
    return mockStore.getQualityReport();
  }
  if (pathname.startsWith("/reports/export")) {
    return "Date,SKU,Material,HS Code,Quantity,Status\n2026-11-02,MAT-COP-001,Copper Tube,7411.10,12000,Normal";
  }

  // 9. Audit
  if (pathname.startsWith("/audit/logs") && normMethod === "get") {
    return mockStore.getAuditLogs();
  }

  // Fallback default
  return [];
}
