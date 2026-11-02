import { mockStore } from "./mockData";

export function handleMockRequest(url: string, method: string = "get", data?: any): any {
  const normMethod = method.toLowerCase();
  // Strip origin and leading /api
  let path = url.replace(/^https?:\/\/[^/]+/, "");
  if (path.startsWith("/api")) {
    path = path.slice(4);
  }
  const [pathname, queryString] = path.split("?");
  const query = new URLSearchParams(queryString || "");

  // 1. Auth
  if (pathname === "/auth/login" && normMethod === "post") {
    return mockStore.login(data || {});
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
      return mockStore.createMaterial(data || {});
    }
  }
  const matMatch = pathname.match(/^\/materials\/([^/]+)$/);
  if (matMatch && normMethod === "patch") {
    return mockStore.updateMaterial(matMatch[1], data || {});
  }

  // 3. Inventory
  if (pathname === "/inventory" && normMethod === "get") {
    return mockStore.getInventory();
  }
  if (pathname === "/inventory/transaction" && normMethod === "post") {
    return mockStore.adjustInventory(data || {});
  }
  if (pathname === "/inventory/transactions" && normMethod === "get") {
    return mockStore.getInventoryTransactions();
  }

  // 4. Procurement
  if (pathname === "/suppliers") {
    if (normMethod === "get") return mockStore.getSuppliers();
    if (normMethod === "post") return mockStore.createSupplier(data || {});
  }
  if (pathname === "/procurement/pr") {
    if (normMethod === "get") return mockStore.getPRs();
    if (normMethod === "post") return mockStore.createPR(data || {});
  }
  const prApproveMatch = pathname.match(/^\/procurement\/pr\/([^/]+)\/approve$/);
  if (prApproveMatch && normMethod === "patch") {
    return mockStore.approvePR(prApproveMatch[1], data?.status || "Approved");
  }
  if (pathname === "/procurement/po") {
    if (normMethod === "get") return mockStore.getPOs();
    if (normMethod === "post") return mockStore.createPO(data || {});
  }
  if (pathname === "/procurement/gr" && normMethod === "post") {
    return mockStore.createGR(data || {});
  }

  // 5. Products
  if (pathname === "/products" && normMethod === "get") {
    return mockStore.getProducts();
  }

  // 6. Production
  if (pathname === "/production") {
    if (normMethod === "get") return mockStore.getProductionOrders();
    if (normMethod === "post") return mockStore.createProductionOrder(data || {});
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
    return mockStore.recordProduction(recMatch[1], Number(data?.actual_quantity_produced) || 1);
  }
  const cancelMatch = pathname.match(/^\/production\/([^/]+)\/cancel$/);
  if (cancelMatch && normMethod === "post") {
    return mockStore.cancelProductionOrder(cancelMatch[1]);
  }

  // 7. Quality
  if (pathname === "/quality") {
    if (normMethod === "get") return mockStore.getInspections();
    if (normMethod === "post") return mockStore.createInspection(data || {});
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
    return [];
  }
  if (pathname.startsWith("/reports/procurement-spend") && normMethod === "get") {
    return mockStore.getReportsSummary().spendBySupplier;
  }
  if (pathname.startsWith("/reports/production-yield") && normMethod === "get") {
    return [{ date: new Date().toISOString().split("T")[0], yield_rate: 98.8, total_produced: 750 }];
  }
  if (pathname.startsWith("/reports/quality-defects") && normMethod === "get") {
    return mockStore.getReportsSummary().topDefects;
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
