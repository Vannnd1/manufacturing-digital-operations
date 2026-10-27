import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAuditLogs, getProductionOrderTrace } from "../api/audit";
import type { AuditLogItem, InventoryLedgerItem } from "../api/audit";
import { getInventoryTransactions } from "../api/inventory";
import { getProductionOrders } from "../api/production";
import { PageHeader, Card, Table, Th, Td, Badge, Input, Button } from "../components/ui";
import { useAuthStore } from "../store/useAuthStore";
import { 
  GitCommit, 
  History, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Box, 
  Truck, 
  ShieldCheck, 
  Factory,
  Layers
} from "lucide-react";

export function AuditTrail() {
  const { user } = useAuthStore();
  const isAuthorized = user?.role === "Admin" || user?.role === "Manager";

  const [activeTab, setActiveTab] = useState<"LOGS" | "LEDGER" | "TRACE">("LOGS");

  // Tab 1: Audit Logs state
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(isAuthorized);
  const [logsError, setLogsError] = useState("");
  const [selectedEntityFilter, setSelectedEntityFilter] = useState("ALL");
  const [logSearch, setLogSearch] = useState("");

  // Tab 2: Inventory Ledger state
  const [ledger, setLedger] = useState<InventoryLedgerItem[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState("");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("ALL");
  const [ledgerSearch, setLedgerSearch] = useState("");

  // Tab 3: Traceability state
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [traceData, setTraceData] = useState<any>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceError, setTraceError] = useState("");

  // Fetch initial audit logs
  useEffect(() => {
    if (!isAuthorized) return;
    const fetchLogs = async () => {
      setLogsLoading(true);
      setLogsError("");
      try {
        const data = await getAuditLogs();
        setLogs(data);
      } catch (err: any) {
        if (err.response?.status === 403) {
          setLogsError("Access Denied: Only Admin and Manager roles are authorized to inspect audit logs.");
        } else {
          setLogsError("Failed to load audit logs");
        }
      } finally {
        setLogsLoading(false);
      }
    };
    fetchLogs();
  }, [isAuthorized]);

  // Fetch ledger when tab activated
  useEffect(() => {
    if (activeTab === "LEDGER" && ledger.length === 0) {
      const fetchLedger = async () => {
        setLedgerLoading(true);
        setLedgerError("");
        try {
          const data = await getInventoryTransactions();
          setLedger(data);
        } catch {
          setLedgerError("Failed to load inventory transactions ledger");
        } finally {
          setLedgerLoading(false);
        }
      };
      fetchLedger();
    }
  }, [activeTab, ledger.length]);

  // Fetch orders when trace tab activated
  useEffect(() => {
    if (activeTab === "TRACE" && orders.length === 0) {
      getProductionOrders()
        .then((data) => {
          setOrders(data);
          if (data.length > 0 && !selectedOrderId) {
            setSelectedOrderId(data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [activeTab, orders.length, selectedOrderId]);

  // Fetch trace data when selectedOrderId changes
  useEffect(() => {
    if (activeTab === "TRACE" && selectedOrderId) {
      const fetchTrace = async () => {
        setTraceLoading(true);
        setTraceError("");
        try {
          const trace = await getProductionOrderTrace(selectedOrderId);
          setTraceData(trace);
        } catch (err: any) {
          setTraceError(err.response?.data?.error || "Failed to load order traceability genealogy");
        } finally {
          setTraceLoading(false);
        }
      };
      fetchTrace();
    }
  }, [activeTab, selectedOrderId]);

  // Filtering for Audit Logs
  const filteredLogs = logs.filter((log) => {
    const matchEntity = selectedEntityFilter === "ALL" || log.entity_name === selectedEntityFilter;
    const matchSearch =
      !logSearch ||
      log.action_type.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.description.toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.user_name && log.user_name.toLowerCase().includes(logSearch.toLowerCase())) ||
      log.entity_id.toLowerCase().includes(logSearch.toLowerCase());
    return matchEntity && matchSearch;
  });

  // Filtering for Ledger
  const filteredLedger = ledger.filter((item) => {
    const matchType = ledgerTypeFilter === "ALL" || item.transaction_type === ledgerTypeFilter;
    const matchSearch =
      !ledgerSearch ||
      item.material_sku.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      item.material_name.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      (item.reference_id && item.reference_id.toLowerCase().includes(ledgerSearch.toLowerCase()));
    return matchType && matchSearch;
  });

  const getTxBadge = (type: string) => {
    switch (type) {
      case "Receipt":
        return <Badge variant="success">Receipt</Badge>;
      case "Reservation":
        return <Badge variant="warning">Reservation</Badge>;
      case "Consumption":
        return <Badge variant="error">Consumption</Badge>;
      case "Release":
        return <Badge variant="info">Release</Badge>;
      case "Adjustment":
        return <Badge variant="default">Adjustment</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  if (!isAuthorized) {
    return (
      <div className="space-y-6 max-w-7xl">
        <PageHeader
          title="Audit Trail & Traceability"
          description="Inspect immutable compliance logs, physical stock ledger movements, and end-to-end manufacturing lot genealogy."
        />
        <Card className="p-10 text-center max-w-2xl mx-auto border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-stone-100 mb-2">Access Restricted (RBAC Policy)</h2>
          <p className="text-sm text-slate-600 dark:text-stone-300 mb-6 leading-relaxed">
            Halaman <strong>Audit Trail & Traceability</strong> merupakan modul audit kepatuhan (*compliance*) yang dibatasi secara ketat hanya untuk pengguna dengan wewenang <strong>Admin</strong> dan <strong>Manager</strong>.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-lg text-xs font-medium text-slate-700 dark:text-stone-300 mb-6">
            <span>Role Aktif Anda:</span>
            <span className="font-bold text-amber-700 dark:text-amber-400 uppercase">{user?.role || "Quality Control"}</span>
          </div>
          <div className="flex justify-center gap-3">
            <Link to="/quality">
              <Button variant="primary">Buka Modul Quality Control</Button>
            </Link>
            <Link to="/">
              <Button variant="secondary">Kembali ke Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Audit Trail & Traceability"
        description="Inspect immutable compliance logs, physical stock ledger movements, and end-to-end manufacturing lot genealogy."
      />

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-stone-800">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("LOGS")}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "LOGS"
                ? "border-amber-600 text-amber-700 dark:text-amber-500 font-semibold"
                : "border-transparent text-slate-500 dark:text-stone-400 hover:text-slate-700 dark:hover:text-stone-200 hover:border-slate-300 dark:hover:border-stone-700"
            }`}
          >
            <History className="w-4 h-4" />
            System Audit Logs
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-300 rounded-full font-medium">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("LEDGER")}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "LEDGER"
                ? "border-amber-600 text-amber-700 dark:text-amber-500 font-semibold"
                : "border-transparent text-slate-500 dark:text-stone-400 hover:text-slate-700 dark:hover:text-stone-200 hover:border-slate-300 dark:hover:border-stone-700"
            }`}
          >
            <GitCommit className="w-4 h-4" />
            Inventory Transaction Ledger
            {ledger.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-300 rounded-full font-medium">
                {ledger.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("TRACE")}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "TRACE"
                ? "border-amber-600 text-amber-700 dark:text-amber-500 font-semibold"
                : "border-transparent text-slate-500 dark:text-stone-400 hover:text-slate-700 dark:hover:text-stone-200 hover:border-slate-300 dark:hover:border-stone-700"
            }`}
          >
            <Layers className="w-4 h-4" />
            Lot & Batch Traceability
          </button>
        </nav>
      </div>

      {/* ── TAB 1: System Audit Logs ────────────────────────────────────────── */}
      {activeTab === "LOGS" && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/60 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="w-4 h-4 text-slate-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Filter by action, description, or actor..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-9.5 text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <label htmlFor="entity-filter" className="text-xs font-semibold text-slate-500 dark:text-stone-400 uppercase tracking-wider">
                  Entity:
                </label>
                <select
                  id="entity-filter"
                  value={selectedEntityFilter}
                  onChange={(e) => setSelectedEntityFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 dark:border-stone-700 bg-white dark:bg-[#141519] text-xs text-slate-800 dark:text-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                >
                  <option value="ALL">All Entities</option>
                  <option value="PURCHASE_REQUEST">Purchase Requests</option>
                  <option value="PURCHASE_ORDER">Purchase Orders</option>
                  <option value="GOODS_RECEIPT">Goods Receipts</option>
                  <option value="INVENTORY">Inventory</option>
                  <option value="PRODUCTION_ORDER">Production Orders</option>
                  <option value="QUALITY_INSPECTION">Quality Inspections</option>
                  <option value="MATERIAL">Materials</option>
                  <option value="SUPPLIER">Suppliers</option>
                  <option value="USER">User / Auth</option>
                </select>
              </div>
            </div>

            {logsLoading ? (
              <div className="p-12 text-center text-slate-400 dark:text-stone-500 italic text-sm">Loading audit trail records...</div>
            ) : logsError ? (
              <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm border-l-4 border-red-500">{logsError}</div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Timestamp</Th>
                    <Th>Action</Th>
                    <Th>Entity & Ref</Th>
                    <Th>Actor</Th>
                    <Th>Description</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-stone-800">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <Td colSpan={5} className="text-center py-8 text-slate-400 dark:text-stone-500 italic">
                        No audit events match the selected criteria.
                      </Td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-stone-800/40 transition-colors">
                        <Td className="font-mono text-xs text-slate-500 dark:text-stone-400">
                          {new Date(log.created_at).toLocaleString()}
                        </Td>
                        <Td>
                          <Badge variant="default" className="font-mono font-medium text-[11px]">
                            {log.action_type}
                          </Badge>
                        </Td>
                        <Td>
                          <div className="text-xs font-semibold text-slate-800 dark:text-stone-200">{log.entity_name}</div>
                          <div className="text-[11px] font-mono text-slate-400 dark:text-stone-500">
                            {log.entity_id ? `${log.entity_id.slice(0, 8)}…` : "—"}
                          </div>
                        </Td>
                        <Td>
                          <div className="text-xs font-medium text-slate-900 dark:text-stone-100">
                            {log.user_name || "System"}
                          </div>
                          {log.user_role && (
                            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-stone-400">
                              {log.user_role}
                            </div>
                          )}
                        </Td>
                        <Td className="text-xs text-slate-600 dark:text-stone-300 max-w-md truncate" title={log.description}>
                          {log.description}
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {/* ── TAB 2: Inventory Transaction Ledger ─────────────────────────────── */}
      {activeTab === "LEDGER" && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/60 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="w-4 h-4 text-slate-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Filter by SKU, material name, or reference ID..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="pl-9.5 text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <label htmlFor="tx-filter" className="text-xs font-semibold text-slate-500 dark:text-stone-400 uppercase tracking-wider">
                  Movement:
                </label>
                <select
                  id="tx-filter"
                  value={ledgerTypeFilter}
                  onChange={(e) => setLedgerTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 dark:border-stone-700 bg-white dark:bg-[#141519] text-xs text-slate-800 dark:text-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                >
                  <option value="ALL">All Movements</option>
                  <option value="Receipt">Receipt (+)</option>
                  <option value="Reservation">Reservation (-)</option>
                  <option value="Consumption">Consumption (-)</option>
                  <option value="Release">Release (+)</option>
                  <option value="Adjustment">Adjustment</option>
                </select>
              </div>
            </div>

            {ledgerLoading ? (
              <div className="p-12 text-center text-slate-400 dark:text-stone-500 italic text-sm">Loading inventory ledger entries...</div>
            ) : ledgerError ? (
              <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm border-l-4 border-red-500">{ledgerError}</div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Recorded At</Th>
                    <Th>Material</Th>
                    <Th>Movement Type</Th>
                    <Th className="text-right">Qty Change</Th>
                    <Th>Reference Document</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-stone-800">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <Td colSpan={5} className="text-center py-8 text-slate-400 dark:text-stone-500 italic">
                        No inventory transactions found.
                      </Td>
                    </tr>
                  ) : (
                    filteredLedger.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-stone-800/40 transition-colors">
                        <Td className="font-mono text-xs text-slate-500 dark:text-stone-400">
                          {new Date(tx.created_at).toLocaleString()}
                        </Td>
                        <Td>
                          <div className="text-xs font-medium text-slate-900 dark:text-stone-100">{tx.material_name}</div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-stone-400">{tx.material_sku}</div>
                        </Td>
                        <Td>{getTxBadge(tx.transaction_type)}</Td>
                        <Td className="text-right font-mono text-xs font-semibold">
                          <span
                            className={
                              tx.quantity_change > 0
                                ? "text-emerald-700 dark:text-emerald-400"
                                : tx.quantity_change < 0
                                ? "text-amber-800 dark:text-amber-400"
                                : "text-slate-600 dark:text-stone-400"
                            }
                          >
                            {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change} {tx.unit}
                          </span>
                        </Td>
                        <Td className="font-mono text-xs text-slate-600 dark:text-stone-400">
                          {tx.reference_id ? (
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded text-slate-700 dark:text-stone-300">
                              REF: {tx.reference_id.slice(0, 8)}…
                            </span>
                          ) : (
                            "—"
                          )}
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {/* ── TAB 3: Order & Lot Traceability ─────────────────────────────────── */}
      {activeTab === "TRACE" && (
        <div className="space-y-6">
          <Card className="p-4 bg-slate-50/60 dark:bg-stone-900/60 border-slate-200 dark:border-stone-800">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <label htmlFor="select-prodo" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-stone-300 mb-1.5">
                  Select Production Order for Lineage Trace:
                </label>
                <select
                  id="select-prodo"
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="px-3.5 py-2 border border-slate-300 dark:border-stone-700 bg-white dark:bg-[#141519] text-xs text-slate-900 dark:text-stone-100 font-medium rounded-xl min-w-[320px] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                >
                  {orders.length === 0 ? (
                    <option value="">No production orders available</option>
                  ) : (
                    orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        PRODO #{o.id.slice(0, 8)} — {o.product_name} ({o.product_sku}) [{o.status}]
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="text-xs text-slate-500 dark:text-stone-400 max-w-sm leading-relaxed">
                Traces the full manufacturing genealogy: from raw material purchase orders and inbound receipts,
                through factory floor reservation & consumption, to final QC signoff.
              </div>
            </div>
          </Card>

          {traceLoading ? (
            <div className="p-16 text-center text-slate-400 dark:text-stone-500 italic text-sm">Building traceability genealogy tree...</div>
          ) : traceError ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm border-l-4 border-red-500">{traceError}</div>
          ) : !traceData ? null : (
            <div className="space-y-6">
              {/* Stage 1: Order Header & Yield */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5 border-l-4 border-l-blue-600">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400 mb-2">
                    <Factory className="w-4 h-4 text-blue-600" />
                    Target Output
                  </div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-stone-100">{traceData.order.product_name}</div>
                  <div className="text-xs font-mono text-slate-500 dark:text-stone-400 mt-0.5">{traceData.order.product_sku}</div>
                  <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-stone-800">
                    <span className="text-slate-500 dark:text-stone-400">Planned Quantity:</span>
                    <span className="font-bold text-slate-900 dark:text-stone-100 font-mono">
                      {traceData.order.planned_quantity} {traceData.order.product_unit}
                    </span>
                  </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-amber-600">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400 mb-2">
                    <GitCommit className="w-4 h-4 text-amber-600" />
                    Execution Status
                  </div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-stone-100">
                    <Badge variant={traceData.order.status === "Completed" ? "success" : "warning"}>
                      {traceData.order.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-stone-800">
                    <span className="text-slate-500 dark:text-stone-400">Actual Produced:</span>
                    <span className="font-bold text-slate-900 dark:text-stone-100 font-mono">
                      {traceData.production_record ? traceData.production_record.actual_quantity_produced : 0}{" "}
                      {traceData.order.product_unit}
                    </span>
                  </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-emerald-600">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400 mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Quality Signoff
                  </div>
                  {traceData.quality_inspection ? (
                    <div>
                      <div className="text-lg font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        Inspected & Released
                      </div>
                      <div className="mt-2 text-xs text-slate-600 dark:text-stone-300">
                        Inspector: <strong className="text-slate-900 dark:text-stone-100">{traceData.quality_inspection.inspector_name}</strong>
                      </div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-stone-300 font-mono">
                        Passed: <span className="font-bold text-emerald-700 dark:text-emerald-400">{traceData.quality_inspection.pass_quantity}</span> | 
                        Failed: <span className="font-bold text-red-600 dark:text-red-400">{traceData.quality_inspection.fail_quantity}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 dark:text-stone-500 italic text-sm py-2">
                      Pending quality verification.
                    </div>
                  )}
                </Card>
              </div>

              {/* Stage 2: Upstream Sourcing Linkage */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/60 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-600 dark:text-stone-400" />
                  <h4 className="font-semibold text-slate-900 dark:text-stone-100 text-sm">
                    Upstream Sourcing Origin (Goods Receipts & Purchase Orders)
                  </h4>
                </div>
                <Table>
                  <thead>
                    <tr>
                      <Th>Material</Th>
                      <Th>Supplier Partner</Th>
                      <Th>PO ID</Th>
                      <Th>Goods Receipt ID</Th>
                      <Th>Receipt Date</Th>
                      <Th className="text-right">Qty Received</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-stone-800">
                    {traceData.upstream_procurement.length === 0 ? (
                      <tr>
                        <Td colSpan={6} className="text-center py-6 text-slate-400 dark:text-stone-500 italic">
                          No upstream procurement records linked directly to this batch.
                        </Td>
                      </tr>
                    ) : (
                      traceData.upstream_procurement.map((u: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-stone-800/40 transition-colors">
                          <Td>
                            <span className="font-medium text-slate-900 dark:text-stone-100">{u.material_name}</span>{" "}
                            <span className="font-mono text-slate-400 dark:text-stone-500 text-xs">({u.material_sku})</span>
                          </Td>
                          <Td className="font-medium text-slate-800 dark:text-stone-200">{u.supplier_name}</Td>
                          <Td className="font-mono text-xs text-slate-600 dark:text-stone-400">#{u.po_id.slice(0, 8)}…</Td>
                          <Td className="font-mono text-xs text-slate-600 dark:text-stone-400">#{u.receipt_id.slice(0, 8)}…</Td>
                          <Td className="text-xs text-slate-600 dark:text-stone-400">{new Date(u.receipt_date).toLocaleDateString()}</Td>
                          <Td className="text-right font-mono text-xs font-semibold text-slate-900 dark:text-stone-100">
                            {u.received_quantity} {u.unit}
                          </Td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Card>

              {/* Stage 3: Shop Floor Material Requirements vs Consumptions */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/60 flex items-center gap-2">
                  <Box className="w-4 h-4 text-slate-600 dark:text-stone-400" />
                  <h4 className="font-semibold text-slate-900 dark:text-stone-100 text-sm">
                    Bill of Materials Consumption & Inventory Ledger Trace
                  </h4>
                </div>
                <Table>
                  <thead>
                    <tr>
                      <Th>Material SKU & Name</Th>
                      <Th className="text-right">BOM Required</Th>
                      <Th>Stock Movements Recorded for Order</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-stone-800">
                    {traceData.bom_requirements.map((bom: any) => {
                      const relatedTxs = traceData.stock_movements.filter(
                        (sm: any) => sm.material_id === bom.material_id
                      );
                      return (
                        <tr key={bom.material_id} className="hover:bg-slate-50/60 dark:hover:bg-stone-800/40 transition-colors">
                          <Td>
                            <div className="font-medium text-slate-900 dark:text-stone-100">{bom.material_name}</div>
                            <div className="font-mono text-xs text-slate-500 dark:text-stone-400">{bom.material_sku}</div>
                          </Td>
                          <Td className="text-right font-mono font-semibold text-slate-900 dark:text-stone-100">
                            {bom.required_quantity} {bom.unit}
                          </Td>
                          <Td>
                            {relatedTxs.length === 0 ? (
                              <span className="text-slate-400 dark:text-stone-500 italic text-xs">No movements recorded</span>
                            ) : (
                              <div className="space-y-1">
                                {relatedTxs.map((sm: any) => (
                                  <div key={sm.id} className="flex items-center gap-2 text-xs font-mono">
                                    {getTxBadge(sm.transaction_type)}
                                    <span className="text-slate-700 dark:text-stone-300 font-semibold">
                                      {sm.quantity_change} {bom.unit}
                                    </span>
                                    <span className="text-slate-400 dark:text-stone-500 text-[11px]">
                                      ({new Date(sm.created_at).toLocaleTimeString()})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card>

              {/* Stage 4: Defect Analysis if any */}
              {traceData.defects.length > 0 && (
                <Card className="border-red-200 dark:border-red-900/50 overflow-hidden">
                  <div className="p-4 border-b border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 flex items-center gap-2 text-red-800 dark:text-red-300">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <h4 className="font-semibold text-sm">Quality Defect Records Logged for this Batch</h4>
                  </div>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Defect Reason</Th>
                        <Th className="text-right">Defective Quantity</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-stone-800">
                      {traceData.defects.map((d: any) => (
                        <tr key={d.id} className="hover:bg-slate-50/60 dark:hover:bg-stone-800/40 transition-colors">
                          <Td className="font-medium text-slate-900 dark:text-stone-100">{d.defect_reason}</Td>
                          <Td className="text-right font-mono font-bold text-red-600 dark:text-red-400">{d.quantity}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
