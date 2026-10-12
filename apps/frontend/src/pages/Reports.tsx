import { useState, useEffect } from "react";
import {
  getReportsSummary,
  getInventoryReport,
  getProcurementReport,
  getProductionReport,
  getQualityReport,
  downloadReportCsv,
  type ReportFilterOptions,
} from "../api/reports";
import {
  PageHeader,
  Card,
  CardHeader,
  Button,
  Badge,
  Input,
  Table,
  Th,
  Td,
} from "../components/ui";
import {
  Download,
  Calendar,
  Layers,
  Archive,
  ShoppingCart,
  Target,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

type ReportTab = "overview" | "inventory" | "procurement" | "production" | "quality";

export function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [range, setRange] = useState<"7d" | "30d" | "all" | "custom">("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Report Data States
  const [summaryData, setSummaryData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [procurementData, setProcurementData] = useState<any>(null);
  const [productionData, setProductionData] = useState<any>(null);
  const [qualityData, setQualityData] = useState<any>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const filterOpts: ReportFilterOptions = {
        range,
        ...(range === "custom" && startDate ? { startDate } : {}),
        ...(range === "custom" && endDate ? { endDate } : {}),
      };

      try {
        if (activeTab === "overview") {
          const data = await getReportsSummary(filterOpts);
          if (active) setSummaryData(data);
        } else if (activeTab === "inventory") {
          const data = await getInventoryReport(filterOpts);
          if (active) setInventoryData(data);
        } else if (activeTab === "procurement") {
          const data = await getProcurementReport(filterOpts);
          if (active) setProcurementData(data);
        } else if (activeTab === "production") {
          const data = await getProductionReport(filterOpts);
          if (active) setProductionData(data);
        } else if (activeTab === "quality") {
          const data = await getQualityReport(filterOpts);
          if (active) setQualityData(data);
        }
      } catch (err: any) {
        if (active) {
          const msg = err.response?.data?.error || "Failed to load report data. Please try again.";
          setError(msg);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [activeTab, range, startDate, endDate, refreshKey]);

  const handleExport = async (type: "inventory" | "procurement" | "production" | "quality") => {
    setExporting(true);
    const filterOpts: ReportFilterOptions = {
      range,
      ...(range === "custom" && startDate ? { startDate } : {}),
      ...(range === "custom" && endDate ? { endDate } : {}),
    };
    try {
      await downloadReportCsv(type, filterOpts);
    } catch (err: any) {
      alert("Export failed: " + (err.response?.data?.error || err.message));
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "HEALTHY":
      case "Completed":
      case "Approved":
      case "Fulfilled":
        return <Badge variant="success">{status}</Badge>;
      case "LOW_STOCK":
      case "In_Progress":
      case "Pending":
      case "Issued":
        return <Badge variant="warning">{status}</Badge>;
      case "OUT_OF_STOCK":
      case "Rejected":
      case "Cancelled":
        return <Badge variant="error">{status}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Operational Reporting & Insights"
          description="Traceable manufacturing performance metrics, inventory balances, procurement spend, production yield, and defect analysis."
        />

        {activeTab !== "overview" && (
          <Button
            variant="secondary"
            onClick={() => handleExport(activeTab)}
            disabled={exporting || loading}
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-slate-500" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        )}
      </div>

      {/* ── Date Range Controls Bar ── */}
      <Card className="p-4 bg-slate-50/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Reporting Period:
            </span>
            {(["7d", "30d", "all", "custom"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  range === r
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {r === "7d" && "Last 7 Days"}
                {r === "30d" && "Last 30 Days"}
                {r === "all" && "All Time"}
                {r === "custom" && "Custom Range"}
              </button>
            ))}
          </div>

          {range === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="py-1 px-2 text-xs"
                placeholder="Start Date"
              />
              <span className="text-slate-400 text-xs">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="py-1 px-2 text-xs"
                placeholder="End Date"
              />
            </div>
          )}

          <Button
            variant="ghost"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="text-xs flex items-center gap-1 ml-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </Card>

      {/* ── Domain Navigation Tabs ── */}
      <div className="border-b border-slate-200 flex space-x-6">
        {[
          { key: "overview", label: "Executive Summary", icon: Layers },
          { key: "inventory", label: "Inventory Movements", icon: Archive },
          { key: "procurement", label: "Procurement & Spend", icon: ShoppingCart },
          { key: "production", label: "Production Yield", icon: Target },
          { key: "quality", label: "Quality & Defects", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ReportTab)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                isActive
                  ? "border-amber-600 text-slate-900 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-amber-600" : "text-slate-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" onClick={() => setRefreshKey((k) => k + 1)} className="text-xs py-1 px-2">
            Retry
          </Button>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {loading && !error && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-100 animate-pulse border border-slate-200"></div>
            ))}
          </div>
          <div className="h-64 bg-slate-100 animate-pulse border border-slate-200"></div>
        </div>
      )}

      {/* ── TAB 1: EXECUTIVE SUMMARY ── */}
      {!loading && !error && activeTab === "overview" && summaryData && (
        <div className="space-y-8">
          {/* Top 4 Domain Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Inventory KPI */}
            <Card className="p-5 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inventory Health</span>
                <Archive className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">
                {summaryData.inventory.total_materials}
                <span className="text-xs font-normal text-slate-400 ml-1">materials</span>
              </div>
              <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                <span className="font-semibold text-amber-600">{summaryData.inventory.low_stock_count} Low</span>
                <span>•</span>
                <span className="font-semibold text-red-600">{summaryData.inventory.out_of_stock_count} Empty</span>
              </div>
            </Card>

            {/* Procurement KPI */}
            <Card className="p-5 border-l-4 border-l-slate-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Procurement Spend</span>
                <ShoppingCart className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">
                ${summaryData.procurement.total_spend_commitment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                <span>{summaryData.procurement.total_pos} POs issued</span>
                <span>•</span>
                <span className="text-amber-600 font-medium">{summaryData.procurement.pending_prs} PRs pending</span>
              </div>
            </Card>

            {/* Production KPI */}
            <Card className="p-5 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Production Output</span>
                <Target className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">
                {summaryData.production.yield_rate_percent}%
                <span className="text-xs font-normal text-slate-400 ml-1">yield</span>
              </div>
              <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                <span className="font-medium text-slate-700">{summaryData.production.total_actual_quantity} / {summaryData.production.total_planned_quantity} units</span>
                <span>•</span>
                <span>{summaryData.production.completed_orders} orders</span>
              </div>
            </Card>

            {/* Quality KPI */}
            <Card className="p-5 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quality Defect Rate</span>
                <ShieldCheck className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">
                {summaryData.quality.defect_rate_percent}%
              </div>
              <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                <span className="text-red-600 font-semibold">{summaryData.quality.total_failed_quantity} failed</span>
                <span>/</span>
                <span>{summaryData.quality.total_inspected_quantity} inspected</span>
              </div>
            </Card>
          </div>

          {/* Quick Actions / Jump to Detail */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Operational Focus Areas" />
              <div className="p-5 space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-900">Inventory Threshold Alerts</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {summaryData.inventory.low_stock_count} materials currently below safety stock levels. Review reorder status in Inventory Movements.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-900">Active Production Batches</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {summaryData.production.active_orders} orders currently ready or in progress on shop floor with {summaryData.production.yield_rate_percent}% recorded yield.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Period Parameters" />
              <div className="p-5 space-y-3 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Selected Period Range:</span>
                  <span className="font-mono font-semibold uppercase">{summaryData.period.range}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Window Start Date:</span>
                  <span className="font-mono">{summaryData.period.start_date || "All History"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Window End Date:</span>
                  <span className="font-mono">{summaryData.period.end_date || "Present"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Data Integrity Mode:</span>
                  <span className="font-medium text-emerald-700">Strict Database Ledger Persistence</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 2: INVENTORY MOVEMENTS ── */}
      {!loading && !error && activeTab === "inventory" && inventoryData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tracked</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{inventoryData.summary.total_materials}</div>
            </Card>
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low / Out of Stock</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {inventoryData.summary.low_stock_count + inventoryData.summary.out_of_stock_count}
              </div>
            </Card>
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Period Receipts</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">+{inventoryData.summary.total_receipts_qty}</div>
            </Card>
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Period Consumption</span>
              <div className="text-2xl font-bold text-slate-700 mt-1">-{inventoryData.summary.total_consumptions_qty}</div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Current Material Stock Balances & Safety Margins" />
            <Table>
              <thead>
                <tr>
                  <Th>SKU</Th>
                  <Th>Material Name</Th>
                  <Th className="text-right">Available</Th>
                  <Th className="text-right">Reserved</Th>
                  <Th className="text-right">Total On-Hand</Th>
                  <Th className="text-right">Safety Threshold</Th>
                  <Th className="text-center">Health Status</Th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.stock_levels.length === 0 ? (
                  <tr>
                    <Td colSpan={7} className="text-center text-slate-400 italic py-8">
                      No materials cataloged in system.
                    </Td>
                  </tr>
                ) : (
                  inventoryData.stock_levels.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <Td className="font-mono text-xs text-slate-500">{item.sku}</Td>
                      <Td className="font-medium text-slate-900">{item.name}</Td>
                      <Td className="text-right tabular-nums font-semibold text-slate-900">
                        {item.available_stock} <span className="text-slate-400 font-normal text-xs">{item.unit}</span>
                      </Td>
                      <Td className="text-right tabular-nums text-slate-500">
                        {item.reserved_stock} <span className="text-slate-400 font-normal text-xs">{item.unit}</span>
                      </Td>
                      <Td className="text-right tabular-nums font-bold text-slate-900">
                        {item.total_stock} <span className="text-slate-400 font-normal text-xs">{item.unit}</span>
                      </Td>
                      <Td className="text-right tabular-nums text-slate-400">
                        {item.min_stock_threshold} <span className="text-slate-400 font-normal text-xs">{item.unit}</span>
                      </Td>
                      <Td className="text-center">{getStatusBadge(item.status)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ── TAB 3: PROCUREMENT & SPEND ── */}
      {!loading && !error && activeTab === "procurement" && procurementData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{procurementData.summary.total_pos}</div>
            </Card>
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total PO Spend</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                ${procurementData.summary.total_procurement_spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </Card>
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending PRs</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">{procurementData.summary.pending_prs}</div>
            </Card>
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Goods Receipts</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{procurementData.summary.total_goods_receipts}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supplier Spend Ranking */}
            <Card>
              <CardHeader title="Supplier Spend Commitments" />
              <Table>
                <thead>
                  <tr>
                    <Th>Supplier Name</Th>
                    <Th className="text-right">Orders</Th>
                    <Th className="text-right">Total Committed</Th>
                  </tr>
                </thead>
                <tbody>
                  {procurementData.supplier_spend.length === 0 ? (
                    <tr>
                      <Td colSpan={3} className="text-center text-slate-400 italic py-6">
                        No purchase orders in this period.
                      </Td>
                    </tr>
                  ) : (
                    procurementData.supplier_spend.map((sup: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <Td className="font-medium text-slate-900">{sup.supplier_name}</Td>
                        <Td className="text-right tabular-nums text-slate-600">{sup.po_count}</Td>
                        <Td className="text-right tabular-nums font-bold text-slate-900">
                          ${sup.total_spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card>

            {/* Purchase Requests Funnel */}
            <Card>
              <CardHeader title="Purchase Request Status Breakdown" />
              <div className="p-5 space-y-4">
                {Object.entries(procurementData.pr_status_breakdown).map(([status, count]: [string, any]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(status)}
                    </div>
                    <span className="font-mono font-bold text-slate-800">{count} requests</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 4: PRODUCTION YIELD ── */}
      {!loading && !error && activeTab === "production" && productionData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Work Orders</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{productionData.summary.total_orders}</div>
            </Card>
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Yield Rate</span>
              <div className="text-2xl font-bold text-blue-600 mt-1">{productionData.summary.yield_rate_percent}%</div>
            </Card>
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Planned Units</span>
              <div className="text-2xl font-bold text-slate-700 mt-1">{productionData.summary.total_planned_quantity}</div>
            </Card>
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recorded Output</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{productionData.summary.total_actual_quantity}</div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Production Orders & Output Yield Analysis" />
            <Table>
              <thead>
                <tr>
                  <Th>Product SKU</Th>
                  <Th>Product Name</Th>
                  <Th className="text-right">Planned Qty</Th>
                  <Th className="text-right">Actual Output</Th>
                  <Th className="text-center">Status</Th>
                  <Th>Completion Date</Th>
                </tr>
              </thead>
              <tbody>
                {productionData.orders.length === 0 ? (
                  <tr>
                    <Td colSpan={6} className="text-center text-slate-400 italic py-8">
                      No production orders found for the selected period.
                    </Td>
                  </tr>
                ) : (
                  productionData.orders.map((o: any) => (
                    <tr key={o.prodo_id} className="hover:bg-slate-50/50">
                      <Td className="font-mono text-xs text-slate-500">{o.product_sku}</Td>
                      <Td className="font-medium text-slate-900">{o.product_name}</Td>
                      <Td className="text-right tabular-nums text-slate-600">
                        {o.planned_quantity} <span className="text-slate-400 text-xs font-normal">{o.product_unit}</span>
                      </Td>
                      <Td className="text-right tabular-nums font-bold text-slate-900">
                        {o.actual_quantity_produced ?? "—"}{" "}
                        {o.actual_quantity_produced !== null && (
                          <span className="text-slate-400 text-xs font-normal">{o.product_unit}</span>
                        )}
                      </Td>
                      <Td className="text-center">{getStatusBadge(o.status)}</Td>
                      <Td className="font-mono text-xs text-slate-500">
                        {o.completion_date ? new Date(o.completion_date).toLocaleDateString() : "Pending"}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ── TAB 5: QUALITY & DEFECTS ── */}
      {!loading && !error && activeTab === "quality" && qualityData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Inspections</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{qualityData.summary.total_inspections}</div>
            </Card>
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Defect Rate</span>
              <div className="text-2xl font-bold text-red-600 mt-1">{qualityData.summary.defect_rate_percent}%</div>
            </Card>
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Passed Units</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{qualityData.summary.total_passed_quantity}</div>
            </Card>
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Failed Units</span>
              <div className="text-2xl font-bold text-red-600 mt-1">{qualityData.summary.total_failed_quantity}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Defect Reasons Breakdown */}
            <Card>
              <CardHeader title="Defect Root-Cause Distribution" />
              <Table>
                <thead>
                  <tr>
                    <Th>Defect Reason</Th>
                    <Th className="text-right">Defective Units</Th>
                    <Th className="text-right">Share (%)</Th>
                  </tr>
                </thead>
                <tbody>
                  {qualityData.defect_breakdown.length === 0 ? (
                    <tr>
                      <Td colSpan={3} className="text-center text-slate-400 italic py-6">
                        No defects logged in this period.
                      </Td>
                    </tr>
                  ) : (
                    qualityData.defect_breakdown.map((d: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <Td className="font-medium text-slate-900">{d.reason}</Td>
                        <Td className="text-right tabular-nums font-semibold text-red-600">{d.quantity}</Td>
                        <Td className="text-right tabular-nums font-mono text-slate-600">{d.share_percent}%</Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card>

            {/* Recent Inspections Log */}
            <Card>
              <CardHeader title="Recent Inspection Records" />
              <Table>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Product</Th>
                    <Th className="text-right">Passed</Th>
                    <Th className="text-right">Failed</Th>
                  </tr>
                </thead>
                <tbody>
                  {qualityData.inspections.length === 0 ? (
                    <tr>
                      <Td colSpan={4} className="text-center text-slate-400 italic py-6">
                        No inspection records in this period.
                      </Td>
                    </tr>
                  ) : (
                    qualityData.inspections.map((i: any) => (
                      <tr key={i.id} className="hover:bg-slate-50/50">
                        <Td className="font-mono text-xs text-slate-500 whitespace-nowrap">
                          {new Date(i.inspection_date).toLocaleDateString()}
                        </Td>
                        <Td>
                          <div className="font-medium text-slate-900">{i.product_name}</div>
                          <div className="font-mono text-xs text-slate-400">{i.product_sku}</div>
                        </Td>
                        <Td className="text-right tabular-nums text-emerald-600 font-semibold">{i.pass_quantity}</Td>
                        <Td className="text-right tabular-nums text-red-600 font-semibold">{i.fail_quantity}</Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
