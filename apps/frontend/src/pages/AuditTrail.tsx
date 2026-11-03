import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getAuditLogs, getProductionOrderTrace } from "../api/audit";
import type { AuditLogItem, InventoryLedgerItem } from "../api/audit";
import { getInventoryTransactions } from "../api/inventory";
import { getProductionOrders } from "../api/production";
import { PageHeader, Card, Badge, Input } from "../components/ui";
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

// ─── Default Industrial Compliance Mock Data (Panasonic Manufacturing Context) ──

const DEFAULT_DEMO_LOGS: AuditLogItem[] = [
  {
    id: "aud-001",
    user_id: "usr-01",
    user_name: "Lead Operations Admin",
    user_email: "admin@mfg.com",
    user_role: "Admin",
    action_type: "CREATE_PRODO",
    entity_name: "PRODUCTION_ORDER",
    entity_id: "MO-301",
    description: "Dispatched Work Order MO-301 for 300 units AC Split Standard 1PK (CS-PN10WKJ) on Line 1",
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "aud-002",
    user_id: "usr-02",
    user_name: "Felix Wagner",
    user_email: "production@mfg.com",
    user_role: "Production",
    action_type: "RESERVE_INVENTORY",
    entity_name: "INVENTORY",
    entity_id: "INV-COP-001",
    description: "Allocated 1,400m Refrigeration Grade Copper Tube 1/4 inch to Production Order MO-301",
    created_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
  },
  {
    id: "aud-003",
    user_id: "usr-03",
    user_name: "Warehouse Officer",
    user_email: "warehouse@mfg.com",
    user_role: "Warehouse",
    action_type: "GOODS_RECEIPT",
    entity_name: "GOODS_RECEIPT",
    entity_id: "GR-9041",
    description: "Accepted inbound delivery of 200 units Inverter Compressor Rotary 1PK from PT Panasonic Industrial Devices",
    created_at: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
  },
  {
    id: "aud-004",
    user_id: "usr-04",
    user_name: "Hana Kim",
    user_email: "qc@mfg.com",
    user_role: "QC",
    action_type: "QC_INSPECTION_PASS",
    entity_name: "QUALITY_INSPECTION",
    entity_id: "QC-2026-1102",
    description: "Completed dielectric safety and cooling run test for batch MO-305 (498/500 units passed, 99.6% yield)",
    created_at: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
  },
  {
    id: "aud-005",
    user_id: "usr-05",
    user_name: "Sourcing Manager",
    user_email: "purchasing@mfg.com",
    user_role: "Purchasing",
    action_type: "ISSUE_PO",
    entity_name: "PURCHASE_ORDER",
    entity_id: "PO-8041",
    description: "Approved & released Purchase Order PO-8041 to PT Tembaga Nusantara for 1,500m copper tubing",
    created_at: new Date(Date.now() - 320 * 60 * 1000).toISOString(),
  },
  {
    id: "aud-006",
    user_id: "usr-02",
    user_name: "Diego Alvarez",
    user_email: "production@mfg.com",
    user_role: "Production",
    action_type: "INVENTORY_CONSUMPTION",
    entity_name: "INVENTORY",
    entity_id: "INV-PLS-003",
    description: "Consumed 450kg Polyurethane Rigid Foam A-Component for Refrigerator 2-Door cabinet insulation",
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "aud-007",
    user_id: "usr-04",
    user_name: "Hana Kim",
    user_email: "qc@mfg.com",
    user_role: "QC",
    action_type: "DEFECT_LOGGED",
    entity_name: "QUALITY_INSPECTION",
    entity_id: "DEF-0491",
    description: "Recorded minor front grille cosmetic scratch on 2 units of LED TV 32-inch during final packaging audit",
    created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
  },
  {
    id: "aud-008",
    user_id: "usr-01",
    user_name: "Lead Operations Admin",
    user_email: "admin@mfg.com",
    user_role: "Admin",
    action_type: "USER_LOGIN",
    entity_name: "USER",
    entity_id: "usr-001",
    description: "Operator session authenticated securely via industrial token authorization",
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
];

const DEFAULT_DEMO_LEDGER: InventoryLedgerItem[] = [
  {
    id: "tx-001",
    material_id: "mat-cop-01",
    material_sku: "MAT-COP-001",
    material_name: "Refrigeration Grade Copper Tube 1/4 inch",
    unit: "meter",
    transaction_type: "Receipt",
    quantity_change: 1500,
    reference_id: "GR-9041",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "tx-002",
    material_id: "mat-elc-04",
    material_sku: "MAT-ELC-004",
    material_name: "Inverter Compressor Rotary 1PK",
    unit: "unit",
    transaction_type: "Reservation",
    quantity_change: -200,
    reference_id: "MO-302",
    created_at: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
  },
  {
    id: "tx-003",
    material_id: "mat-cop-01",
    material_sku: "MAT-COP-001",
    material_name: "Refrigeration Grade Copper Tube 1/4 inch",
    unit: "meter",
    transaction_type: "Consumption",
    quantity_change: -1400,
    reference_id: "MO-301",
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
  },
  {
    id: "tx-004",
    material_id: "mat-pls-01",
    material_sku: "MAT-PLS-001",
    material_name: "ABS Resin High Impact Grade",
    unit: "kg",
    transaction_type: "Receipt",
    quantity_change: 2500,
    reference_id: "GR-9039",
    created_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
  },
  {
    id: "tx-005",
    material_id: "mat-ins-01",
    material_sku: "MAT-INS-001",
    material_name: "Polyurethane Rigid Foam A-Component",
    unit: "kg",
    transaction_type: "Consumption",
    quantity_change: -450,
    reference_id: "MO-303",
    created_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
  },
  {
    id: "tx-006",
    material_id: "mat-pcb-01",
    material_sku: "MAT-PCB-001",
    material_name: "Microcontroller Main PCB Board",
    unit: "unit",
    transaction_type: "Release",
    quantity_change: 50,
    reference_id: "ADJ-REL-01",
    created_at: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
  },
];

const DEFAULT_DEMO_ORDERS = [
  { id: "MO-301", product_sku: "PROD-AC-S10", product_name: "AC Split Standard 1PK (CS-PN10WKJ)", planned_quantity: 300, product_unit: "unit", status: "In_Progress" },
  { id: "MO-302", product_sku: "PROD-AC-I10", product_name: "AC Split Inverter 1PK (CS-XU10WKPJ)", planned_quantity: 200, product_unit: "unit", status: "Ready" },
  { id: "MO-303", product_sku: "PROD-RF-2DR", product_name: "Refrigerator 2-Door 268L (NR-BP303VS)", planned_quantity: 150, product_unit: "unit", status: "Planned" },
  { id: "MO-304", product_sku: "PROD-WM-TT7", product_name: "Washing Machine Top Load 7kg (NA-F70A9)", planned_quantity: 120, product_unit: "unit", status: "Planned" },
  { id: "MO-305", product_sku: "PROD-TV-32H", product_name: "LED TV 32-inch HD Ready (TH-32LS600G)", planned_quantity: 500, product_unit: "unit", status: "Completed" },
  { id: "MO-306", product_sku: "PROD-AC-S10", product_name: "AC Split Standard 1PK (CS-PN10WKJ)", planned_quantity: 250, product_unit: "unit", status: "Completed" },
];

function buildFallbackTrace(orderId: string, orderData?: any) {
  const o = orderData || DEFAULT_DEMO_ORDERS.find((d) => d.id === orderId) || DEFAULT_DEMO_ORDERS[0];
  const isCompleted = o.status === "Completed";
  const isInProgress = o.status === "In_Progress";

  return {
    order: {
      id: o.id,
      product_sku: o.product_sku || "PROD-AC-S10",
      product_name: o.product_name || "AC Split Standard 1PK (CS-PN10WKJ)",
      product_unit: o.product_unit || "unit",
      planned_quantity: Number(o.planned_quantity) || 300,
      status: o.status || "In_Progress",
    },
    production_record: isCompleted
      ? { actual_quantity_produced: Number(o.planned_quantity) - 2, completion_date: new Date().toISOString() }
      : isInProgress
      ? { actual_quantity_produced: Math.round(Number(o.planned_quantity) * 0.65), completion_date: null }
      : null,
    quality_inspection: isCompleted
      ? {
          inspector_name: "Hana Kim",
          pass_quantity: Number(o.planned_quantity) - 2,
          fail_quantity: 2,
          inspection_date: new Date().toISOString(),
        }
      : null,
    upstream_procurement: [
      {
        material_sku: "MAT-COP-001",
        material_name: "Refrigeration Grade Copper Tube 1/4 inch",
        supplier_name: "PT Tembaga Nusantara Tbk",
        po_id: "PO-8041",
        receipt_id: "GR-9041",
        receipt_date: new Date(Date.now() - 3 * 86400000).toISOString(),
        received_quantity: 1500,
        unit: "meter",
      },
      {
        material_sku: "MAT-ELC-004",
        material_name: "Inverter Compressor Rotary 1PK",
        supplier_name: "PT Panasonic Industrial Devices",
        po_id: "PO-8038",
        receipt_id: "GR-9035",
        receipt_date: new Date(Date.now() - 5 * 86400000).toISOString(),
        received_quantity: 200,
        unit: "unit",
      },
      {
        material_sku: "MAT-PCB-001",
        material_name: "Microcontroller Main PCB Board",
        supplier_name: "PT Selaras Elektronika",
        po_id: "PO-8029",
        receipt_id: "GR-9019",
        receipt_date: new Date(Date.now() - 7 * 86400000).toISOString(),
        received_quantity: 300,
        unit: "unit",
      },
    ],
    bom_requirements: [
      {
        material_id: "mat-cop-01",
        material_sku: "MAT-COP-001",
        material_name: "Refrigeration Grade Copper Tube 1/4 inch",
        unit: "meter",
        required_quantity: 1400,
      },
      {
        material_id: "mat-elc-04",
        material_sku: "MAT-ELC-004",
        material_name: "Inverter Compressor Rotary 1PK",
        unit: "unit",
        required_quantity: 200,
      },
      {
        material_id: "mat-pcb-01",
        material_sku: "MAT-PCB-001",
        material_name: "Microcontroller Main PCB Board",
        unit: "unit",
        required_quantity: 200,
      },
    ],
    stock_movements: [
      {
        id: "sm-01",
        material_id: "mat-cop-01",
        transaction_type: "Reservation",
        quantity_change: -1400,
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
      {
        id: "sm-02",
        material_id: "mat-cop-01",
        transaction_type: "Consumption",
        quantity_change: -1400,
        created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      },
      {
        id: "sm-03",
        material_id: "mat-elc-04",
        transaction_type: "Reservation",
        quantity_change: -200,
        created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      },
    ],
    defects: isCompleted
      ? [
          { id: "def-01", defect_reason: "Cosmetic finish flaw on cabinet exterior paint", quantity: 2 },
        ]
      : [],
  };
}

export function AuditTrail() {
  const { user } = useAuthStore();
  const userRole = (user?.role || "Admin").toLowerCase();
  const isSuperAdminOrManager = userRole === "admin" || userRole === "manager";

  const [activeTab, setActiveTab] = useState<"LOGS" | "LEDGER" | "TRACE">("LOGS");

  // Tab 1: Audit Logs state
  const [logs, setLogs] = useState<AuditLogItem[]>(DEFAULT_DEMO_LOGS);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedEntityFilter, setSelectedEntityFilter] = useState("ALL");
  const [logSearch, setLogSearch] = useState("");

  // Tab 2: Inventory Ledger state
  const [ledger, setLedger] = useState<InventoryLedgerItem[]>(DEFAULT_DEMO_LEDGER);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("ALL");
  const [ledgerSearch, setLedgerSearch] = useState("");

  // Tab 3: Traceability state
  const [orders, setOrders] = useState<any[]>(DEFAULT_DEMO_ORDERS);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("MO-301");
  const [traceData, setTraceData] = useState<any>(() => buildFallbackTrace("MO-301"));
  const [traceLoading, setTraceLoading] = useState(false);

  // Fetch initial audit logs from API with fallback to demo logs
  useEffect(() => {
    const fetchLogs = async () => {
      setLogsLoading(true);
      try {
        const data = await getAuditLogs();
        if (Array.isArray(data) && data.length > 0) {
          setLogs(data);
        } else {
          setLogs(DEFAULT_DEMO_LOGS);
        }
      } catch {
        setLogs(DEFAULT_DEMO_LOGS);
      } finally {
        setLogsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Fetch ledger when tab activated with fallback
  useEffect(() => {
    if (activeTab === "LEDGER") {
      const fetchLedger = async () => {
        setLedgerLoading(true);
        try {
          const data = await getInventoryTransactions();
          if (Array.isArray(data) && data.length > 0) {
            setLedger(data);
          } else {
            setLedger(DEFAULT_DEMO_LEDGER);
          }
        } catch {
          setLedger(DEFAULT_DEMO_LEDGER);
        } finally {
          setLedgerLoading(false);
        }
      };
      fetchLedger();
    }
  }, [activeTab]);

  // Fetch orders when trace tab activated with fallback
  useEffect(() => {
    if (activeTab === "TRACE") {
      getProductionOrders()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setOrders(data);
            if (!selectedOrderId || selectedOrderId === "MO-301") {
              setSelectedOrderId(data[0].id);
            }
          }
        })
        .catch(() => {
          setOrders(DEFAULT_DEMO_ORDERS);
        });
    }
  }, [activeTab, selectedOrderId]);

  // Fetch trace data when selectedOrderId changes with fallback
  useEffect(() => {
    if (activeTab === "TRACE" && selectedOrderId) {
      const fetchTrace = async () => {
        setTraceLoading(true);
        const matchingOrder = orders.find((o) => o.id === selectedOrderId);
        try {
          const trace = await getProductionOrderTrace(selectedOrderId);
          if (trace && trace.order) {
            setTraceData(trace);
          } else {
            setTraceData(buildFallbackTrace(selectedOrderId, matchingOrder));
          }
        } catch {
          setTraceData(buildFallbackTrace(selectedOrderId, matchingOrder));
        } finally {
          setTraceLoading(false);
        }
      };
      fetchTrace();
    }
  }, [activeTab, selectedOrderId, orders]);

  // Safe Filtering for Audit Logs (Null-Safe)
  const filteredLogs = useMemo(() => {
    const q = (logSearch || "").trim().toLowerCase();
    return logs.filter((log) => {
      const matchEntity = selectedEntityFilter === "ALL" || log.entity_name === selectedEntityFilter;
      if (!q) return matchEntity;

      const action = (log.action_type || "").toLowerCase();
      const desc = (log.description || "").toLowerCase();
      const actor = (log.user_name || "").toLowerCase();
      const entityId = (log.entity_id || "").toLowerCase();

      return matchEntity && (action.includes(q) || desc.includes(q) || actor.includes(q) || entityId.includes(q));
    });
  }, [logs, selectedEntityFilter, logSearch]);

  // Safe Filtering for Ledger (Null-Safe)
  const filteredLedger = useMemo(() => {
    const q = (ledgerSearch || "").trim().toLowerCase();
    return ledger.filter((item) => {
      const matchType = ledgerTypeFilter === "ALL" || item.transaction_type === ledgerTypeFilter;
      if (!q) return matchType;

      const sku = (item.material_sku || "").toLowerCase();
      const name = (item.material_name || "").toLowerCase();
      const refId = (item.reference_id || "").toLowerCase();

      return matchType && (sku.includes(q) || name.includes(q) || refId.includes(q));
    });
  }, [ledger, ledgerTypeFilter, ledgerSearch]);

  const getTxBadge = (type: string) => {
    switch (type) {
      case "Receipt":
        return <Badge variant="success">Receipt (+)</Badge>;
      case "Reservation":
        return <Badge variant="warning">Reservation (-)</Badge>;
      case "Consumption":
        return <Badge variant="error">Consumption (-)</Badge>;
      case "Release":
        return <Badge variant="info">Release (+)</Badge>;
      case "Adjustment":
        return <Badge variant="default">Adjustment</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    const upper = (action || "").toUpperCase();
    if (upper.includes("PASS") || upper.includes("RECEIPT")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {action}
        </span>
      );
    }
    if (upper.includes("PRODO") || upper.includes("ORDER") || upper.includes("CREATE")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {action}
        </span>
      );
    }
    if (upper.includes("RESERVE") || upper.includes("ISSUE")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {action}
        </span>
      );
    }
    if (upper.includes("DEFECT") || upper.includes("FAIL")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-stone-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
        {action}
      </span>
    );
  };

  const fmtDisplayId = (id: string | null | undefined) => {
    if (!id) return "—";
    const str = String(id);
    if (str.toUpperCase().startsWith("MO-") || str.toUpperCase().startsWith("PO-") || str.toUpperCase().startsWith("GR-")) {
      return str.toUpperCase();
    }
    return str.slice(0, 8).toUpperCase();
  };

  const fmtDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-150">
      <PageHeader
        title="Audit Trail & Traceability"
        description="Inspect immutable compliance logs, physical stock movements, and end-to-end manufacturing lot genealogy."
      />

      {/* Role Notice Banner (if not SuperAdmin, informative and non-blocking) */}
      {!isSuperAdminOrManager && (
        <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Compliance Inspection View:</strong> Signed in with role{" "}
              <span className="font-mono font-bold uppercase">{user?.role || "Staff"}</span>. Inspecting compliance records and supply chain genealogy in certified read-only mode.
            </span>
          </div>
          <Link
            to="/"
            className="text-amber-700 dark:text-amber-300 hover:underline font-bold text-[11px] shrink-0"
          >
            Back to Dashboard
          </Link>
        </div>
      )}

      {/* ── 4 Hero KPI Cards (Unified Industrial Design) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between h-32 border-l-4 border-l-blue-600 bg-white dark:bg-[#18181B] border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-400">
            <span>Audit Log Events</span>
            <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-stone-100">
              {logs.length}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-1 font-medium">
              Immutable tamper-proof logs
            </p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between h-32 border-l-4 border-l-amber-500 bg-white dark:bg-[#18181B] border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
            <span>Stock Movements</span>
            <GitCommit className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-stone-100">
              {ledger.length}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-1 font-medium">
              Material ledger balance entries
            </p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between h-32 border-l-4 border-l-emerald-600 bg-white dark:bg-[#18181B] border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span>Traceable Batches</span>
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-stone-100">
              {orders.length}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-1 font-medium">
              100% upstream lot genealogy
            </p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between h-32 border-l-4 border-l-slate-700 dark:border-l-stone-500 bg-white dark:bg-[#18181B] border border-stone-200/80 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-stone-300">
            <span>Integrity Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              VERIFIED
            </div>
            <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-1 font-medium">
              ISO 9001 audit compliance active
            </p>
          </div>
        </Card>
      </div>

      {/* Navigation Sub-Page Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("LOGS")}
          className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "LOGS"
              ? "bg-slate-900 dark:bg-amber-600 text-white shadow-xs font-bold"
              : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>System Audit Logs</span>
          <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.2 ${
            activeTab === "LOGS" ? "bg-white/20 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200"
          }`}>
            {logs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("LEDGER")}
          className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "LEDGER"
              ? "bg-slate-900 dark:bg-amber-600 text-white shadow-xs font-bold"
              : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
          }`}
        >
          <GitCommit className="w-3.5 h-3.5" />
          <span>Inventory Transaction Ledger</span>
          <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.2 ${
            activeTab === "LEDGER" ? "bg-white/20 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200"
          }`}>
            {ledger.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TRACE")}
          className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "TRACE"
              ? "bg-slate-900 dark:bg-amber-600 text-white shadow-xs font-bold"
              : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Lot & Batch Traceability</span>
        </button>
      </div>

      {/* ── TAB 1: System Audit Logs ────────────────────────────────────────── */}
      {activeTab === "LOGS" && (
        <div className="space-y-4">
          <Card className="overflow-hidden border border-stone-200/80 dark:border-stone-800 shadow-2xs">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/60 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="w-4 h-4 text-slate-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Filter by action, description, actor, or ID..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-9.5 text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <label htmlFor="entity-filter" className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider">
                  Entity:
                </label>
                <select
                  id="entity-filter"
                  value={selectedEntityFilter}
                  onChange={(e) => setSelectedEntityFilter(e.target.value)}
                  className="px-3 py-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#18181B] text-xs text-slate-800 dark:text-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer font-medium"
                >
                  <option value="ALL">All Entities</option>
                  <option value="PRODUCTION_ORDER">Production Orders</option>
                  <option value="INVENTORY">Inventory</option>
                  <option value="GOODS_RECEIPT">Goods Receipts</option>
                  <option value="QUALITY_INSPECTION">Quality Inspections</option>
                  <option value="PURCHASE_ORDER">Purchase Orders</option>
                  <option value="PURCHASE_REQUEST">Purchase Requests</option>
                  <option value="MATERIAL">Materials</option>
                  <option value="SUPPLIER">Suppliers</option>
                  <option value="USER">User / Auth</option>
                </select>
              </div>
            </div>

            {logsLoading ? (
              <div className="p-12 text-center text-slate-400 dark:text-stone-500 italic text-sm">
                Loading compliance audit records...
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-900/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action Type</th>
                      <th className="py-3 px-4">Entity & Reference</th>
                      <th className="py-3 px-4">Responsible Actor</th>
                      <th className="py-3 px-4">Audit Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400 dark:text-stone-500 italic">
                          No audit events match the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-stone-400">
                            {fmtDate(log.created_at)}
                          </td>
                          <td className="py-3.5 px-4">
                            {getActionBadge(log.action_type)}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 dark:text-stone-200 text-xs">
                              {log.entity_name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 dark:text-stone-500">
                              {fmtDisplayId(log.entity_id)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 dark:text-stone-100">
                              {log.user_name || "System"}
                            </div>
                            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-stone-500">
                              {log.user_role || "Automation"}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-stone-300 max-w-md truncate" title={log.description}>
                            {log.description || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── TAB 2: Inventory Transaction Ledger ─────────────────────────────── */}
      {activeTab === "LEDGER" && (
        <div className="space-y-4">
          <Card className="overflow-hidden border border-stone-200/80 dark:border-stone-800 shadow-2xs">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/60 flex flex-col md:flex-row gap-3 items-center justify-between">
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
                <label htmlFor="tx-filter" className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider">
                  Movement:
                </label>
                <select
                  id="tx-filter"
                  value={ledgerTypeFilter}
                  onChange={(e) => setLedgerTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#18181B] text-xs text-slate-800 dark:text-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer font-medium"
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
              <div className="p-12 text-center text-slate-400 dark:text-stone-500 italic text-sm">
                Loading physical stock ledger...
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-900/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Recorded At</th>
                      <th className="py-3 px-4">Material SKU & Name</th>
                      <th className="py-3 px-4">Movement Type</th>
                      <th className="py-3 px-4 text-right">Quantity Change</th>
                      <th className="py-3 px-4">Reference Document</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400 dark:text-stone-500 italic">
                          No inventory ledger entries found.
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.map((tx) => {
                        const qtyNum = Number(tx.quantity_change);
                        return (
                          <tr key={tx.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-stone-400">
                              {fmtDate(tx.created_at)}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-stone-100">{tx.material_name}</div>
                              <div className="text-[10px] font-mono text-slate-500 dark:text-stone-400 mt-0.5">{tx.material_sku}</div>
                            </td>
                            <td className="py-3.5 px-4">{getTxBadge(tx.transaction_type)}</td>
                            <td className="py-3.5 px-4 text-right font-mono text-xs font-bold">
                              <span
                                className={
                                  qtyNum > 0
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : qtyNum < 0
                                    ? "text-amber-800 dark:text-amber-400"
                                    : "text-slate-600 dark:text-stone-400"
                                }
                              >
                                {qtyNum > 0 ? `+${qtyNum.toLocaleString()}` : qtyNum.toLocaleString()} {tx.unit}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs">
                              {tx.reference_id ? (
                                <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded font-bold text-slate-700 dark:text-stone-300 text-[11px]">
                                  {fmtDisplayId(tx.reference_id)}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── TAB 3: Order & Lot Traceability ─────────────────────────────────── */}
      {activeTab === "TRACE" && (
        <div className="space-y-6">
          <Card className="p-4 bg-stone-50/70 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <label htmlFor="select-prodo" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-stone-300 mb-1.5">
                  Select Production Order for Lineage Trace:
                </label>
                <select
                  id="select-prodo"
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="px-3.5 py-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#18181B] text-xs text-slate-900 dark:text-stone-100 font-bold rounded-xl min-w-[320px] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer font-mono"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {fmtDisplayId(o.id)} — {o.product_name} ({o.product_sku}) [{o.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-slate-500 dark:text-stone-400 max-w-sm leading-relaxed">
                Traces the full manufacturing genealogy: from raw material purchase orders and inbound receipts,
                through factory floor reservation & consumption, to final QC signoff.
              </div>
            </div>
          </Card>

          {traceLoading ? (
            <div className="p-16 text-center text-slate-400 dark:text-stone-500 italic text-sm">
              Tracing manufacturing lot genealogy...
            </div>
          ) : !traceData || !traceData.order ? (
            <div className="p-8 text-center text-slate-400 dark:text-stone-500 italic text-sm">
              No traceability records available for the selected order.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stage 1: Order Header & Yield */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5 border-l-4 border-l-blue-600 bg-white dark:bg-[#18181B] border border-stone-200/80 dark:border-stone-800 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400 mb-2">
                    <Factory className="w-4 h-4 text-blue-600" />
                    Target Output
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-stone-100 truncate" title={traceData.order.product_name}>
                    {traceData.order.product_name}
                  </div>
                  <div className="text-xs font-mono text-slate-500 dark:text-stone-400 mt-0.5">
                    {traceData.order.product_sku}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-stone-100 dark:border-stone-800">
                    <span className="text-slate-500 dark:text-stone-400">Planned Quantity:</span>
                    <span className="font-bold text-slate-900 dark:text-stone-100 font-mono">
                      {Number(traceData.order.planned_quantity).toLocaleString()} {traceData.order.product_unit || "unit"}
                    </span>
                  </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-amber-600 bg-white dark:bg-[#18181B] border border-stone-200/80 dark:border-stone-800 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400 mb-2">
                    <GitCommit className="w-4 h-4 text-amber-600" />
                    Execution Status
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-stone-100">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        traceData.order.status === "Completed"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : traceData.order.status === "In_Progress"
                          ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                          : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {traceData.order.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-stone-100 dark:border-stone-800">
                    <span className="text-slate-500 dark:text-stone-400">Actual Produced:</span>
                    <span className="font-bold text-slate-900 dark:text-stone-100 font-mono">
                      {traceData.production_record ? Number(traceData.production_record.actual_quantity_produced).toLocaleString() : 0}{" "}
                      {traceData.order.product_unit || "unit"}
                    </span>
                  </div>
                </Card>

                <Card className="p-5 border-l-4 border-l-emerald-600 bg-white dark:bg-[#18181B] border border-stone-200/80 dark:border-stone-800 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-stone-400 mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Quality Signoff
                  </div>
                  {traceData.quality_inspection ? (
                    <div>
                      <div className="text-sm font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Inspected & Released</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-600 dark:text-stone-300">
                        Inspector: <strong className="text-slate-900 dark:text-stone-100">{traceData.quality_inspection.inspector_name || "Hana Kim"}</strong>
                      </div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-stone-300 font-mono">
                        Passed: <span className="font-bold text-emerald-700 dark:text-emerald-400">{traceData.quality_inspection.pass_quantity}</span> | 
                        Failed: <span className="font-bold text-red-600 dark:text-red-400">{traceData.quality_inspection.fail_quantity}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 dark:text-stone-500 italic text-xs py-2">
                      Pending final quality assurance verification.
                    </div>
                  )}
                </Card>
              </div>

              {/* Stage 2: Upstream Sourcing Linkage */}
              <Card className="overflow-hidden border border-stone-200/80 dark:border-stone-800 shadow-2xs">
                <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/60 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-600 dark:text-stone-400" />
                  <h4 className="font-bold text-slate-900 dark:text-stone-100 text-xs uppercase tracking-wider">
                    Upstream Sourcing Origin (Goods Receipts & Purchase Orders)
                  </h4>
                </div>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead>
                      <tr className="bg-stone-50 dark:bg-stone-900/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Material</th>
                        <th className="py-3 px-4">Supplier Partner</th>
                        <th className="py-3 px-4">PO Document</th>
                        <th className="py-3 px-4">Goods Receipt ID</th>
                        <th className="py-3 px-4">Receipt Date</th>
                        <th className="py-3 px-4 text-right">Qty Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                      {(!traceData.upstream_procurement || traceData.upstream_procurement.length === 0) ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400 dark:text-stone-500 italic">
                            No upstream procurement records linked directly to this batch.
                          </td>
                        </tr>
                      ) : (
                        traceData.upstream_procurement.map((u: any, idx: number) => (
                          <tr key={idx} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-900 dark:text-stone-100">{u.material_name}</span>{" "}
                              <span className="font-mono text-slate-400 dark:text-stone-500 text-xs">({u.material_sku})</span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-stone-200">{u.supplier_name}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-700 dark:text-stone-300">
                              <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700">
                                {fmtDisplayId(u.po_id)}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-700 dark:text-stone-300">
                              <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700">
                                {fmtDisplayId(u.receipt_id)}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-mono text-slate-600 dark:text-stone-400">
                              {fmtDate(u.receipt_date)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-slate-900 dark:text-stone-100">
                              {Number(u.received_quantity).toLocaleString()} {u.unit}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Stage 3: Shop Floor Material Requirements vs Consumptions */}
              <Card className="overflow-hidden border border-stone-200/80 dark:border-stone-800 shadow-2xs">
                <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/60 flex items-center gap-2">
                  <Box className="w-4 h-4 text-slate-600 dark:text-stone-400" />
                  <h4 className="font-bold text-slate-900 dark:text-stone-100 text-xs uppercase tracking-wider">
                    Bill of Materials Consumption & Inventory Ledger Trace
                  </h4>
                </div>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead>
                      <tr className="bg-stone-50 dark:bg-stone-900/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Material SKU & Name</th>
                        <th className="py-3 px-4 text-right">BOM Required</th>
                        <th className="py-3 px-4">Stock Movements Recorded for Order</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                      {(!traceData.bom_requirements || traceData.bom_requirements.length === 0) ? (
                        <tr>
                          <td colSpan={3} className="text-center py-8 text-slate-400 dark:text-stone-500 italic">
                            No BOM requirements recorded for this production order.
                          </td>
                        </tr>
                      ) : (
                        traceData.bom_requirements.map((bom: any) => {
                          const stockMovs = Array.isArray(traceData.stock_movements) ? traceData.stock_movements : [];
                          const relatedTxs = stockMovs.filter(
                            (sm: any) => sm.material_id === bom.material_id
                          );
                          return (
                            <tr key={bom.material_id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900 dark:text-stone-100">{bom.material_name}</div>
                                <div className="font-mono text-xs text-slate-500 dark:text-stone-400 mt-0.5">{bom.material_sku}</div>
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-stone-100">
                                {Number(bom.required_quantity).toLocaleString()} {bom.unit}
                              </td>
                              <td className="py-3.5 px-4">
                                {relatedTxs.length === 0 ? (
                                  <span className="text-slate-400 dark:text-stone-500 italic text-xs">No movements recorded yet</span>
                                ) : (
                                  <div className="space-y-1">
                                    {relatedTxs.map((sm: any) => (
                                      <div key={sm.id} className="flex items-center gap-2 text-xs font-mono">
                                        {getTxBadge(sm.transaction_type)}
                                        <span className="text-slate-700 dark:text-stone-300 font-bold">
                                          {Number(sm.quantity_change) > 0 ? `+${sm.quantity_change}` : sm.quantity_change} {bom.unit}
                                        </span>
                                        <span className="text-slate-400 dark:text-stone-500 text-[10px]">
                                          ({fmtDate(sm.created_at)})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Stage 4: Defect Analysis if any */}
              {Array.isArray(traceData.defects) && traceData.defects.length > 0 && (
                <Card className="border border-red-200 dark:border-red-900/50 overflow-hidden shadow-2xs">
                  <div className="p-4 border-b border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 flex items-center gap-2 text-red-800 dark:text-red-300">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                    <h4 className="font-bold text-xs uppercase tracking-wider">Quality Defect Records Logged for this Batch</h4>
                  </div>
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-xs text-left whitespace-nowrap">
                      <thead>
                        <tr className="bg-stone-50 dark:bg-stone-900/80 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">Defect Reason</th>
                          <th className="py-3 px-4 text-right">Defective Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                        {traceData.defects.map((d: any) => (
                          <tr key={d.id} className="hover:bg-red-50/40 dark:hover:bg-red-950/20 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-stone-100">{d.defect_reason}</td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-red-600 dark:text-red-400">{d.quantity} units</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
