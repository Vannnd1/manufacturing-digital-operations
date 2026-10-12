import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardSummary } from "../api/dashboard";
import { useAuthStore } from "../store/useAuthStore";
import { 
  AlertTriangle, 
  ShoppingCart, 
  Target, 
  ShieldAlert, 
  TrendingDown, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { PageHeader, Card, CardHeader, Table, Th, Td, Badge, Button } from "../components/ui";

/**
 * Standardized numerical formatter for industrial metrics:
 * - Integer quantities display with standard thousands separators without decimals (e.g. "1,000")
 * - Decimal quantities preserve up to 2 fractional places (e.g. "10.25")
 */
function formatNumber(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === "") return "—";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return Number.isInteger(num)
    ? num.toLocaleString("en-US")
    : num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function Dashboard() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [showGuide, setShowGuide] = useState(() => {
    return localStorage.getItem("mfg-dashboard-guide") === "expanded";
  });

  const toggleGuide = () => {
    const next = !showGuide;
    setShowGuide(next);
    localStorage.setItem("mfg-dashboard-guide", next ? "expanded" : "collapsed");
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await getDashboardSummary();
        if (!ignore) {
          setSummary(data);
          setError("");
          setLastUpdated(new Date());
        }
      } catch {
        if (!ignore) {
          setError("Unable to load operational metrics. Please verify network connection or server status.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getDashboardSummary();
      setSummary(data);
      setError("");
      setLastUpdated(new Date());
    } catch {
      setError("Unable to load operational metrics. Please verify network connection or server status.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDashboardSummary();
      setSummary(data);
      setLastUpdated(new Date());
    } catch {
      setError("Unable to load operational metrics. Please verify network connection or server status.");
    } finally {
      setLoading(false);
    }
  };

  // Loading Skeleton State — eliminates layout shift by mimicking the dashboard layout
  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-64 bg-slate-200 rounded-none"></div>
            <div className="h-4 w-96 bg-slate-100 rounded-none"></div>
          </div>
          <div className="h-8 w-36 bg-slate-200 rounded-none self-start sm:self-auto"></div>
        </div>

        {/* Skeleton KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white border border-slate-200 p-5 flex flex-col justify-between">
              <div className="h-4 w-28 bg-slate-200"></div>
              <div className="h-8 w-16 bg-slate-300"></div>
              <div className="h-3 w-36 bg-slate-100"></div>
            </div>
          ))}
        </div>

        {/* Skeleton Detail Tables row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-white border border-slate-200 p-4"></div>
          <div className="h-72 bg-white border border-slate-200 p-4"></div>
        </div>
      </div>
    );
  }

  // Error State with Retry Action
  if (error) {
    return (
      <div className="space-y-6 max-w-7xl">
        <PageHeader 
          title="Operational Command Center" 
          description="Real-time manufacturing operations status, inventory deficit alerts, and critical quality gate events."
        />
        <Card className="p-8 text-center max-w-xl mx-auto border-red-200 bg-red-50/40">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-2">Failed to Load Dashboard Data</h2>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <Button 
            onClick={handleRetry} 
            variant="primary"
            className="inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </Button>
        </Card>
      </div>
    );
  }

  if (!summary) return null;

  const currentRole = user?.role || "Operator";

  // ── 1. KPI Calculations (Exact, Traceable, and Defensible) ────────────────
  const lowStockItems = summary.inventory?.low_stock_items ?? [];
  const lowStockCount = lowStockItems.length;

  const prCounts = summary.procurement?.pr_status_counts ?? {};
  const pendingPRs = Number(prCounts["Pending"] || 0);
  const approvedPRs = Number(prCounts["Approved"] || 0);
  const fulfilledPRs = Number(prCounts["Fulfilled"] || 0);
  const rejectedPRs = Number(prCounts["Rejected"] || 0);
  const totalPRs = pendingPRs + approvedPRs + fulfilledPRs + rejectedPRs;

  const prodoCounts = summary.production?.order_status_counts ?? {};
  const readyOrders = Number(prodoCounts["Ready"] || 0);
  const inProgressOrders = Number(prodoCounts["In_Progress"] || 0);
  const plannedOrders = Number(prodoCounts["Planned"] || 0);
  const completedOrders = Number(prodoCounts["Completed"] || 0);
  const activeOrders = readyOrders + inProgressOrders;
  const totalProdOrders = plannedOrders + readyOrders + inProgressOrders + completedOrders;

  const recentFailedInspections = summary.quality?.recent_failed_inspections ?? [];
  const failedIncidentCount = recentFailedInspections.length;
  const totalDefectUnits = recentFailedInspections.reduce(
    (sum: number, it: any) => sum + (Number(it.fail_quantity) || 0),
    0
  );

  // ── 2. End-to-End Workflow Steps ──────────────────────────────────────────
  const workflowSteps = [
    {
      num: "01",
      title: "Material Sourcing & Requisitions",
      role: "Purchasing & Manager",
      action: "Create PR (Purchasing), approve requisition (Manager)",
      link: "/procurement",
      linkText: "Procurement",
      isAllowed: currentRole === "Purchasing" || currentRole === "Manager" || currentRole === "Admin",
    },
    {
      num: "02",
      title: "PO Issuance & Goods Receipt",
      role: "Purchasing & Warehouse",
      action: "Issue PO (Purchasing), physically receive stock into ledger (Warehouse)",
      link: "/procurement",
      linkText: "Goods Receipt",
      isAllowed: currentRole === "Purchasing" || currentRole === "Warehouse" || currentRole === "Admin",
    },
    {
      num: "03",
      title: "Production Order & BOM Reservation",
      role: "Production Staff",
      action: "Schedule work order, check stock, atomically reserve materials",
      link: "/production",
      linkText: "Production",
      isAllowed: currentRole === "Production" || currentRole === "Admin",
    },
    {
      num: "04",
      title: "Factory Yield & Quality Gate",
      role: "Production & QC",
      action: "Record output (Production), verify defects & release FG (QC)",
      link: "/quality",
      linkText: "Quality Control",
      isAllowed: currentRole === "Production" || currentRole === "QC" || currentRole === "Admin",
    },
    {
      num: "05",
      title: "Operational Insights & Audit Trail",
      role: "All Roles / Auditors",
      action: "Track lot genealogy, stock movements, and operational metrics",
      link: "/reports",
      linkText: "Reports & Insights",
      isAllowed: true,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Top Header & Operational Actions Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-slate-200/80">
        <div>
          <PageHeader 
            title="Operational Command Center" 
            description="Real-time manufacturing operations status, inventory deficit alerts, and critical quality gate events."
          />
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 mb-4 sm:mb-0">
          {/* Active status indicator */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true"></span>
            <span>Live System</span>
          </div>

          {/* Quick refresh button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-300 rounded-none transition-colors disabled:opacity-50"
            title="Refresh operational data"
            aria-label="Refresh operational data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-amber-600" : ""}`} />
          </button>

          {/* Collapsible Tour Button */}
          <Button 
            variant="secondary" 
            onClick={toggleGuide}
            className="flex items-center gap-1.5 border-slate-300 bg-white py-1 px-2.5 text-xs font-medium"
            aria-expanded={showGuide}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>{showGuide ? "Hide Tour" : "Workflow Tour"}</span>
            {showGuide ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
          </Button>
        </div>
      </div>

      {/* ── Collapsible Workflow Tour (Tightly Structured) ── */}
      {showGuide && (
        <Card className="border-slate-800 bg-slate-950 text-slate-50 shadow-md">
          <div className="px-5 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="p-1 bg-amber-500/20 text-amber-400 rounded-none border border-amber-500/30">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  End-to-End Manufacturing Workflow Tour
                </h2>
                <p className="text-[11px] text-slate-400">
                  Strict Segregation of Duties (SoD) enforced across 6 operational roles.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Active Role:</span>
              <Badge variant="warning">{currentRole}</Badge>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {workflowSteps.map((step) => (
              <div 
                key={step.num}
                className={`p-3 rounded-none border flex flex-col justify-between transition-colors ${
                  step.isAllowed 
                    ? "bg-slate-900/90 border-slate-700 hover:border-amber-500/50" 
                    : "bg-slate-950/70 border-slate-800/80 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-amber-500">{step.num}</span>
                    {step.isAllowed && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-slate-200 mb-1 leading-snug">{step.title}</h3>
                  <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">{step.action}</p>
                </div>
                <div className="pt-2 border-t border-slate-800 mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[90px]">{step.role}</span>
                  <Link 
                    to={step.link}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-0.5"
                  >
                    <span>{step.linkText}</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-2 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              💡 <strong>Demo Guidance:</strong> Switch roles anytime on the Login page using the quick-fill buttons to test authorization enforcement.
            </span>
            <Link 
              to="/reports" 
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium text-xs"
            >
              <span>Explore Reports & Insights</span> &rarr;
            </Link>
          </div>
        </Card>
      )}

      {/* ── KPI Alert Cards Grid (Status-Driven Visual Hierarchy) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Low Stock Alerts (Amber Status) */}
        <Card className="flex flex-col relative overflow-hidden group hover:border-amber-400 transition-colors border-l-4 border-l-amber-500">
          <div className="p-4 sm:p-5 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-xs text-slate-600 uppercase tracking-wider">Low Stock Alerts</h3>
              <div className="p-1.5 bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight font-mono">
                {formatNumber(lowStockCount)}
              </p>
              {lowStockCount > 0 ? (
                <Badge variant="warning">Action Needed</Badge>
              ) : (
                <Badge variant="success">Optimal</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Materials below threshold</p>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
              {lowStockCount > 0 ? (
                <span className="text-amber-700 font-medium">
                  {lowStockCount} {lowStockCount === 1 ? "item requires" : "items require"} replenishment
                </span>
              ) : (
                <span className="text-emerald-700 font-medium">All items meet stock thresholds</span>
              )}
            </div>
          </div>
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 mt-auto group-hover:bg-amber-50/20 transition-colors">
            <Link to="/inventory" className="text-xs font-semibold text-amber-700 uppercase tracking-wider hover:text-amber-800 flex justify-between items-center">
              <span>View Inventory</span> <span>&rarr;</span>
            </Link>
          </div>
        </Card>

        {/* Card 2: Purchase Requisitions (Neutral/Warning Status) */}
        <Card className="flex flex-col relative overflow-hidden group hover:border-slate-400 transition-colors border-l-4 border-l-slate-500">
          <div className="p-4 sm:p-5 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-xs text-slate-600 uppercase tracking-wider">Purchase Requests</h3>
              <div className="p-1.5 bg-slate-100 text-slate-700 border border-slate-200">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight font-mono">
                {formatNumber(pendingPRs)}
              </p>
              {pendingPRs > 0 ? (
                <Badge variant="warning">Pending Review</Badge>
              ) : (
                <Badge variant="default">All Processed</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Awaiting manager approval</p>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Total PRs: {formatNumber(totalPRs)}</span>
              <span className="text-slate-400 font-mono">({formatNumber(approvedPRs)} approved)</span>
            </div>
          </div>
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 mt-auto group-hover:bg-slate-100/60 transition-colors">
            <Link to="/procurement" className="text-xs font-semibold text-slate-700 uppercase tracking-wider hover:text-slate-900 flex justify-between items-center">
              <span>Review Requests</span> <span>&rarr;</span>
            </Link>
          </div>
        </Card>

        {/* Card 3: Active Production Orders (Blue Status) */}
        <Card className="flex flex-col relative overflow-hidden group hover:border-blue-400 transition-colors border-l-4 border-l-blue-600">
          <div className="p-4 sm:p-5 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-xs text-slate-600 uppercase tracking-wider">Active Production</h3>
              <div className="p-1.5 bg-blue-50 text-blue-700 border border-blue-200">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight font-mono">
                {formatNumber(activeOrders)}
              </p>
              {activeOrders > 0 ? (
                <Badge variant="info">In Queue</Badge>
              ) : (
                <Badge variant="default">Idle</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Orders in queue or processing</p>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-mono">
              <span>{formatNumber(readyOrders)} ready</span>
              <span>{formatNumber(inProgressOrders)} running</span>
              <span className="text-slate-400">({formatNumber(totalProdOrders)} total)</span>
            </div>
          </div>
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 mt-auto group-hover:bg-blue-50/20 transition-colors">
            <Link to="/production" className="text-xs font-semibold text-blue-700 uppercase tracking-wider hover:text-blue-800 flex justify-between items-center">
              <span>Manage Orders</span> <span>&rarr;</span>
            </Link>
          </div>
        </Card>

        {/* Card 4: Quality Defect Alerts (Red Status) */}
        <Card className="flex flex-col relative overflow-hidden group hover:border-red-400 transition-colors border-l-4 border-l-red-600">
          <div className="p-4 sm:p-5 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-xs text-slate-600 uppercase tracking-wider">QC Defect Alerts</h3>
              <div className="p-1.5 bg-red-50 text-red-700 border border-red-200">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight font-mono">
                {formatNumber(failedIncidentCount)}
              </p>
              {failedIncidentCount > 0 ? (
                <Badge variant="error">Defects Logged</Badge>
              ) : (
                <Badge variant="success">Pass Rate 100%</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Recent failed inspection events</p>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1 font-mono">
              {failedIncidentCount > 0 ? (
                <span className="text-red-700 font-medium">
                  {formatNumber(totalDefectUnits)} total defective units recorded
                </span>
              ) : (
                <span className="text-emerald-700 font-medium">Zero defects in recent runs</span>
              )}
            </div>
          </div>
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 mt-auto group-hover:bg-red-50/20 transition-colors">
            <Link to="/quality" className="text-xs font-semibold text-red-700 uppercase tracking-wider hover:text-red-800 flex justify-between items-center">
              <span>View QC Logs</span> <span>&rarr;</span>
            </Link>
          </div>
        </Card>
      </div>

      {/* ── Operational Detail Tables (2-Column Grid) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Table 1: Critical Inventory Shortages */}
        <Card className="flex flex-col">
          <CardHeader 
            title="Critical Inventory Shortages" 
            action={
              <div className="flex items-center gap-2">
                <Badge variant={lowStockCount > 0 ? "warning" : "success"}>
                  {lowStockCount} {lowStockCount === 1 ? "Item" : "Items"}
                </Badge>
                <TrendingDown className="w-4 h-4 text-amber-500" aria-hidden="true" />
              </div>
            } 
          />
          <div className="flex-1 overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th className="text-left">Material</Th>
                  <Th className="text-right">Available</Th>
                  <Th className="text-right">Min Threshold</Th>
                  <Th className="text-right">Deficit</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockItems.length === 0 ? (
                  <tr>
                    <Td colSpan={5} className="text-center py-10 text-slate-500 italic">
                      Stock levels are healthy. No materials are currently below their safety threshold.
                    </Td>
                  </tr>
                ) : (
                  lowStockItems.map((item: any) => {
                    const available = Number(item.available_stock) || 0;
                    const threshold = Number(item.min_stock_threshold) || 0;
                    const deficit = Math.max(0, threshold - available);
                    const unit = item.unit || "units";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <Td>
                          <div className="font-medium text-slate-900 leading-snug">{item.name}</div>
                          {item.sku && (
                            <div className="font-mono text-xs text-slate-500 mt-0.5 tracking-tight">
                              {item.sku}
                            </div>
                          )}
                        </Td>
                        <Td className="text-right tabular-nums">
                          <span className="font-bold text-amber-700">{formatNumber(available)}</span>
                          <span className="text-slate-400 text-xs ml-1 font-mono">{unit}</span>
                        </Td>
                        <Td className="text-right tabular-nums text-slate-600 font-mono text-xs">
                          {formatNumber(threshold)}
                          <span className="text-slate-400 ml-1">{unit}</span>
                        </Td>
                        <Td className="text-right tabular-nums">
                          <span className="font-semibold text-red-600">{formatNumber(deficit)}</span>
                          <span className="text-slate-400 text-xs ml-1 font-mono">{unit}</span>
                        </Td>
                        <Td className="text-right">
                          <Link
                            to="/procurement"
                            className="inline-flex items-center text-xs font-semibold text-amber-700 hover:text-amber-900 hover:underline"
                            title={`Requisition ${item.name}`}
                          >
                            <span>Requisition</span>
                            <ArrowRight className="w-3 h-3 ml-0.5" />
                          </Link>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
          <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-auto">
            <span>Thresholds configured in Material Master</span>
            <Link to="/inventory" className="text-amber-700 hover:underline font-medium">
              Open Inventory Master &rarr;
            </Link>
          </div>
        </Card>

        {/* Table 2: Recent Quality Failures */}
        <Card className="flex flex-col">
          <CardHeader 
            title="Recent Quality Failures" 
            action={
              <div className="flex items-center gap-2">
                <Badge variant={failedIncidentCount > 0 ? "error" : "success"}>
                  {failedIncidentCount} {failedIncidentCount === 1 ? "Incident" : "Incidents"}
                </Badge>
                <ShieldAlert className="w-4 h-4 text-red-500" aria-hidden="true" />
              </div>
            } 
          />
          <div className="flex-1 overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th className="text-left">Date</Th>
                  <Th className="text-left">Product</Th>
                  <Th className="text-right">Failed Qty</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentFailedInspections.length === 0 ? (
                  <tr>
                    <Td colSpan={4} className="text-center py-10 text-slate-500 italic">
                      No recent quality inspection failures. All production lots met inspection criteria.
                    </Td>
                  </tr>
                ) : (
                  recentFailedInspections.map((item: any) => {
                    const failQty = Number(item.fail_quantity) || 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <Td className="text-slate-500 font-mono text-xs whitespace-nowrap">
                          {item.inspection_date ? new Date(item.inspection_date).toLocaleDateString() : "—"}
                        </Td>
                        <Td>
                          <div className="font-medium text-slate-900 leading-snug">{item.product_name}</div>
                          {item.product_sku && (
                            <div className="font-mono text-xs text-slate-500 mt-0.5 tracking-tight">
                              {item.product_sku}
                            </div>
                          )}
                        </Td>
                        <Td className="text-right tabular-nums">
                          <span className="font-bold text-red-600">{formatNumber(failQty)}</span>
                          <span className="text-slate-400 text-xs ml-1 font-mono">units</span>
                        </Td>
                        <Td className="text-right">
                          <Link
                            to="/quality"
                            className="inline-flex items-center text-xs font-semibold text-red-700 hover:text-red-900 hover:underline"
                            title={`Inspect ${item.product_name}`}
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3 ml-0.5" />
                          </Link>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
          <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-auto">
            <span>Quality gates prevent non-conforming lots from release</span>
            <Link to="/quality" className="text-red-700 hover:underline font-medium">
              Open Quality Module &rarr;
            </Link>
          </div>
        </Card>
      </div>

      {/* ── Operational Footnote ── */}
      {lastUpdated && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200">
          <span>Command Center auto-synchronizes with Postgres transactional state.</span>
          <span className="font-mono">Last updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}
