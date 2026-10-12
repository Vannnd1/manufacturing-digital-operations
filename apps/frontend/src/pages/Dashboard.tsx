import { useEffect, useState } from "react";
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
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader, Card, CardHeader, Table, Th, Td, Badge, Button } from "../components/ui";

export function Dashboard() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showGuide, setShowGuide] = useState(() => {
    return localStorage.getItem("mfg-dashboard-guide") !== "collapsed";
  });

  const toggleGuide = () => {
    const next = !showGuide;
    setShowGuide(next);
    localStorage.setItem("mfg-dashboard-guide", next ? "expanded" : "collapsed");
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setSummary(await getDashboardSummary());
      } catch {
        setError("Failed to load dashboard data");
      }
      setLoading(false);
    };
    fetchSummary();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500 animate-pulse font-medium">
      Loading command center data...
    </div>
  );
  if (error) return (
    <div className="p-4 bg-red-50 text-red-700 text-sm border-l-4 border-red-500 font-medium">{error}</div>
  );
  if (!summary) return null;

  const currentRole = user?.role || "Operator";

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
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader 
          title="Operational Command Center" 
          description="Real-time overview of manufacturing operations and critical alerts."
        />
        <Button 
          variant="secondary" 
          onClick={toggleGuide}
          className="self-start sm:self-auto flex items-center gap-1.5 border-slate-300 bg-white py-1.5 px-3 text-xs"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-600" />
          <span>{showGuide ? "Collapse Demo Guide" : "View Workflow Tour"}</span>
          {showGuide ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </Button>
      </div>

      {/* Interactive Workflow & Demo Onboarding Card */}
      {showGuide && (
        <Card className="border-slate-300 bg-slate-900 text-slate-50 shadow-md">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-sm border border-amber-500/30">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                  End-to-End Manufacturing Workflow Tour
                </h2>
                <p className="text-xs text-slate-400">
                  Strict Segregation of Duties (SoD) enforced across 6 specialized operational roles.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Current Role:</span>
              <Badge variant="warning">{currentRole}</Badge>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {workflowSteps.map((step) => (
              <div 
                key={step.num}
                className={`p-3.5 rounded-sm border flex flex-col justify-between transition-colors ${
                  step.isAllowed 
                    ? "bg-slate-800/80 border-slate-700 hover:border-amber-500/50" 
                    : "bg-slate-950/60 border-slate-800/60 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
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
                <div className="pt-2 border-t border-slate-700/50 mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">{step.role}</span>
                  <Link 
                    to={step.link}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                  >
                    <span>{step.linkText}</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span>
              💡 <strong>Tip for Interviewers:</strong> Switch roles anytime on the Login page using the quick-fill presets to verify server-side authorization enforcement.
            </span>
            <Link 
              to="/audit" 
              className="text-amber-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Explore Multi-Tier Lot Genealogy</span> &rarr;
            </Link>
          </div>
        </Card>
      )}

      {/* KPI Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Inventory Alert */}
        <Card className="flex flex-col relative overflow-hidden group hover:border-amber-400 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <div className="p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">Low Stock</h3>
              <div className="p-2 bg-amber-50 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-4xl font-bold text-slate-900 tracking-tight">{summary.inventory.low_stock_items.length}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Materials below threshold</p>
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 mt-auto group-hover:bg-amber-50/30 transition-colors">
            <Link to="/inventory" className="text-xs font-semibold text-amber-700 uppercase tracking-wider hover:text-amber-800 flex justify-between items-center">
              View Inventory <span>&rarr;</span>
            </Link>
          </div>
        </Card>

        {/* Procurement Alert */}
        <Card className="flex flex-col relative overflow-hidden group hover:border-slate-400 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-400"></div>
          <div className="p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">Purchase Requests</h3>
              <div className="p-2 bg-slate-100 text-slate-600">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <p className="text-4xl font-bold text-slate-900 tracking-tight">{summary.procurement.pr_status_counts['Pending'] || 0}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Awaiting manager approval</p>
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 mt-auto group-hover:bg-slate-100/50 transition-colors">
            <Link to="/procurement" className="text-xs font-semibold text-slate-700 uppercase tracking-wider hover:text-slate-900 flex justify-between items-center">
              Review Requests <span>&rarr;</span>
            </Link>
          </div>
        </Card>

        {/* Production Alert */}
        <Card className="flex flex-col relative overflow-hidden group hover:border-blue-400 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <div className="p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">Production Orders</h3>
              <div className="p-2 bg-blue-50 text-blue-600">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <p className="text-4xl font-bold text-slate-900 tracking-tight">
              {(summary.production.order_status_counts['Ready'] || 0) + (summary.production.order_status_counts['In_Progress'] || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Orders in queue or processing</p>
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 mt-auto group-hover:bg-blue-50/30 transition-colors">
            <Link to="/production" className="text-xs font-semibold text-blue-700 uppercase tracking-wider hover:text-blue-800 flex justify-between items-center">
              Manage Orders <span>&rarr;</span>
            </Link>
          </div>
        </Card>

        {/* Quality Alert */}
        <Card className="flex flex-col relative overflow-hidden group hover:border-red-400 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <div className="p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">QC Defects</h3>
              <div className="p-2 bg-red-50 text-red-600">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <p className="text-4xl font-bold text-slate-900 tracking-tight">{summary.quality.recent_failed_inspections.length}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Recent failed inspections</p>
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 mt-auto group-hover:bg-red-50/30 transition-colors">
            <Link to="/quality" className="text-xs font-semibold text-red-700 uppercase tracking-wider hover:text-red-800 flex justify-between items-center">
              View QC Logs <span>&rarr;</span>
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Detailed List */}
        <Card>
          <CardHeader title="Critical Inventory Shortages" action={<TrendingDown className="w-4 h-4 text-amber-500" />} />
          <Table>
            <thead>
              <tr>
                <Th>Material</Th>
                <Th className="text-right">Available</Th>
                <Th className="text-right">Min Threshold</Th>
                <Th className="text-right">Deficit</Th>
              </tr>
            </thead>
            <tbody>
              {summary.inventory.low_stock_items.length === 0 ? (
                <tr><Td colSpan={4} className="text-center italic">Stock levels are healthy.</Td></tr>
              ) : summary.inventory.low_stock_items.map((item: any) => {
                const deficit = item.min_stock_threshold - item.available_stock;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <Td>
                      <div className="font-medium text-slate-900">{item.name}</div>
                      {item.sku && <div className="font-mono text-xs text-slate-400 mt-0.5">{item.sku}</div>}
                    </Td>
                    <Td className="text-right tabular-nums">
                      <span className="font-bold text-amber-600">{item.available_stock}</span>
                      <span className="text-slate-400 text-xs ml-1">{item.unit}</span>
                    </Td>
                    <Td className="text-right tabular-nums text-slate-400">
                      {item.min_stock_threshold}
                      <span className="text-xs ml-1">{item.unit}</span>
                    </Td>
                    <Td className="text-right tabular-nums">
                      <span className="font-semibold text-red-600">{deficit}</span>
                      <span className="text-slate-400 text-xs ml-1">{item.unit}</span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>

        {/* Recent QC Failures */}
        <Card>
          <CardHeader title="Recent Quality Failures" action={<ShieldAlert className="w-4 h-4 text-red-500" />} />
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Product</Th>
                <Th className="text-right">Failed Qty</Th>
              </tr>
            </thead>
            <tbody>
              {summary.quality.recent_failed_inspections.length === 0 ? (
                <tr><Td colSpan={3} className="text-center italic">No recent failures.</Td></tr>
              ) : summary.quality.recent_failed_inspections.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <Td className="text-slate-500 font-mono text-xs whitespace-nowrap">{new Date(item.inspection_date).toLocaleDateString()}</Td>
                  <Td>
                    <div className="font-medium text-slate-900">{item.product_name}</div>
                    {item.product_sku && <div className="font-mono text-xs text-slate-400 mt-0.5">{item.product_sku}</div>}
                  </Td>
                  <Td className="text-right tabular-nums">
                    <span className="font-bold text-red-600">{item.fail_quantity}</span>
                    <span className="text-slate-400 text-xs ml-1">units</span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
