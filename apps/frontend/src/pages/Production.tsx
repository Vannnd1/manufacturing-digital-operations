import { useEffect, useState, useCallback } from "react";
import { 
  getProductionOrders, 
  createProductionOrder, 
  reserveMaterials, 
  recordProduction, 
  checkAvailability, 
  cancelProductionOrder 
} from "../api/production";
import { 
  getInspections, 
  getPendingInspections, 
  getInspectionDetails, 
  createInspection 
} from "../api/quality";
import { getProducts } from "../api/product";
import { getMaterials } from "../api/inventory";
import { useAuthStore } from "../store/useAuthStore";
import { 
  X, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Target, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Download,
  CheckCircle
} from "lucide-react";
import { PageHeader, Card, Table, Th, Td, Button, Input, Label, RoutePipeline } from "../components/ui";
import { sanitizeNumberInput } from "../utils/number";
import { InteractiveGanttSchedule } from "../components/InteractiveGanttSchedule";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  sku: string;
  name: string;
  unit: string;
}

interface Material {
  id: string;
  sku: string;
  name: string;
  unit: string;
}

interface BomItem {
  material_id: string;
  required_quantity: string;
}

interface ProductionProps {
  defaultTab?: "scheduling" | "orders" | "quality";
}

export function Production({ defaultTab = "scheduling" }: ProductionProps) {
  const { user } = useAuthStore();

  // ── Sub-Page Navigation State ───────────────────────────────────────────
  const [activeSubPage, setActiveSubPage] = useState<"scheduling" | "orders" | "quality">(defaultTab);

  // Keep in sync if defaultTab prop changes (e.g. route change between /production and /quality)
  useEffect(() => {
    setActiveSubPage(defaultTab);
  }, [defaultTab]);

  // ── Production Orders State ────────────────────────────────────────────
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const [activeModal, setActiveModal] = useState<"check" | "record" | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [availabilityCheck, setAvailabilityCheck] = useState<any>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [reserveLoading, setReserveLoading] = useState(false);
  const [reserveError, setReserveError] = useState("");

  const [actualQty, setActualQty] = useState<string | number>(0);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState("");

  // Create Production Order form state
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [orderProductId, setOrderProductId] = useState("");
  const [orderPlannedQty, setOrderPlannedQty] = useState("");
  const [bomItems, setBomItems] = useState<BomItem[]>([{ material_id: "", required_quantity: "" }]);
  const [createFormError, setCreateFormError] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Status Filter
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // ── Quality Control State ──────────────────────────────────────────────
  const [qualityTab, setQualityTab] = useState<"Pending" | "Inspections">("Pending");
  const [pendingInspections, setPendingInspections] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [qualityError, setQualityError] = useState("");

  const [activeQualityModal, setActiveQualityModal] = useState<"inspect" | "details" | null>(null);
  const [selectedInspectionRecord, setSelectedInspectionRecord] = useState<any>(null);
  const [inspectionDetails, setInspectionDetails] = useState<any>(null);

  const [passQty, setPassQty] = useState<string | number>(0);
  const [failQty, setFailQty] = useState<string | number>(0);
  const [defectReason, setDefectReason] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [detailsError, setDetailsError] = useState("");

  // Fetch master data once
  useEffect(() => {
    getProducts().then((d: Product[]) => setProducts(d)).catch(() => {});
    getMaterials().then((d: Material[]) => setMaterials(d)).catch(() => {});
  }, []);

  // Fetch production orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setOrders(await getProductionOrders());
      } catch {
        setError("Failed to load production orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [refresh]);

  // Fetch quality records
  useEffect(() => {
    if (activeSubPage !== "quality") return;
    const fetchQuality = async () => {
      setQualityLoading(true);
      setQualityError("");
      try {
        if (qualityTab === "Inspections") setInspections(await getInspections());
        if (qualityTab === "Pending") setPendingInspections(await getPendingInspections());
      } catch {
        setQualityError("Failed to load quality control data");
      }
      setQualityLoading(false);
    };
    fetchQuality();
  }, [activeSubPage, qualityTab, refresh]);

  // ── Create Production Order Handlers ───────────────────────────────────

  const openCreateOrder = useCallback(() => {
    setOrderProductId("");
    setOrderPlannedQty("");
    setBomItems([{ material_id: "", required_quantity: "" }]);
    setCreateFormError("");
    setShowCreateOrder(true);
  }, []);

  const closeCreateOrder = useCallback(() => {
    setShowCreateOrder(false);
  }, []);

  const updateBomItem = (index: number, field: keyof BomItem, value: string) => {
    setBomItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addBomItem = () => setBomItems(prev => [...prev, { material_id: "", required_quantity: "" }]);
  const removeBomItem = (index: number) => setBomItems(prev => prev.filter((_, i) => i !== index));

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormError("");

    if (!orderProductId) { setCreateFormError("Please select a product."); return; }
    const qty = Number(orderPlannedQty);
    if (!orderPlannedQty || isNaN(qty) || qty <= 0) { setCreateFormError("Planned quantity must be a positive number."); return; }

    for (let i = 0; i < bomItems.length; i++) {
      const item = bomItems[i];
      if (!item.material_id) { setCreateFormError(`BOM row ${i + 1}: please select a material.`); return; }
      const rq = Number(item.required_quantity);
      if (!item.required_quantity || isNaN(rq) || rq <= 0) { setCreateFormError(`BOM row ${i + 1}: required quantity must be a positive number.`); return; }
    }

    const matIds = bomItems.map(it => it.material_id);
    if (new Set(matIds).size !== matIds.length) { setCreateFormError("Each material may only appear once in the BOM. Remove the duplicate."); return; }

    setCreateSubmitting(true);
    try {
      await createProductionOrder({
        product_id: orderProductId,
        planned_quantity: qty,
        materials: bomItems.map(it => ({
          material_id: it.material_id,
          required_quantity: Number(it.required_quantity),
        })),
      });
      closeCreateOrder();
      setRefresh(r => r + 1);
    } catch (err: any) {
      setCreateFormError(err.response?.data?.error || "Failed to create production order. Please try again.");
    }
    setCreateSubmitting(false);
  };

  const openCheck = async (order: any) => {
    setSelectedOrder(order);
    setAvailabilityCheck(null);
    setCheckError("");
    setReserveError("");
    setActiveModal("check");
    setCheckLoading(true);
    try {
      setAvailabilityCheck(await checkAvailability(order.id));
    } catch {
      setCheckError("Failed to check material availability. Please try again.");
    }
    setCheckLoading(false);
  };

  const handleReserve = async () => {
    setReserveLoading(true);
    setReserveError("");
    try {
      await reserveMaterials(selectedOrder.id);
      setActiveModal(null);
      setRefresh(r => r + 1);
    } catch (err: any) {
      setReserveError(err.response?.data?.error || "Failed to reserve materials. Please try again.");
    }
    setReserveLoading(false);
  };

  const openRecord = (order: any) => {
    setSelectedOrder(order);
    setActualQty(Number(order.planned_quantity));
    setRecordError("");
    setActiveModal("record");
  };

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordLoading(true);
    setRecordError("");
    try {
      await recordProduction(selectedOrder.id, Number(actualQty));
      setActiveModal(null);
      setRefresh(r => r + 1);
    } catch (err: any) {
      setRecordError(err.response?.data?.error || "Failed to record production output. Please try again.");
    }
    setRecordLoading(false);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order? Any reserved materials will be released back to available inventory.")) {
      return;
    }
    try {
      await cancelProductionOrder(orderId);
      setRefresh(r => r + 1);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to cancel production order.");
    }
  };

  // ── Quality Handlers ───────────────────────────────────────────────────

  const openInspect = (record: any) => {
    setSelectedInspectionRecord(record);
    setPassQty(Number(record.actual_quantity_produced));
    setFailQty(0);
    setDefectReason("");
    setFormError("");
    setActiveQualityModal("inspect");
  };

  const openDetails = async (inspection: any) => {
    setActiveQualityModal("details");
    setInspectionDetails(null);
    setDetailsError("");
    try {
      setInspectionDetails(await getInspectionDetails(inspection.id));
    } catch {
      setDetailsError("Failed to load inspection details. Please try again.");
    }
  };

  const handleInspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      const numPass = Number(passQty) || 0;
      const numFail = Number(failQty) || 0;
      const payload: any = {
        production_record_id: selectedInspectionRecord.id,
        pass_quantity: numPass,
        fail_quantity: numFail,
      };
      if (numFail > 0) {
        payload.defects = [{ defect_reason: defectReason, quantity: numFail }];
      }
      await createInspection(payload);
      setActiveQualityModal(null);
      setRefresh(r => r + 1);
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to create inspection record. Please try again.");
    }
    setFormLoading(false);
  };

  // ── Export CSV Handler ─────────────────────────────────────────────────
  const handleExport = () => {
    let csv = "";
    if (activeSubPage === "orders" || activeSubPage === "scheduling") {
      csv = "Order ID,Product,Planned Qty,Status,Created At\n" +
        orders.map(o => `"${o.id}","${o.product_name || o.product_id}","${o.planned_quantity}","${o.status}","${o.created_at}"`).join("\n");
    } else {
      csv = "Inspection ID,Production Record,Date,Pass Qty,Fail Qty\n" +
        inspections.map(i => `"${i.id}","${i.prodo_id}","${i.inspection_date}","${i.pass_quantity}","${i.fail_quantity}"`).join("\n");
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `mfg_${activeSubPage}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Calculations ───────────────────────────────────────────────────────
  const inProductionCount = orders.filter(o => o.status === "Ready" || o.status === "In_Progress").length;
  const plannedCount = orders.filter(o => o.status === "Planned").length;
  const completedCount = orders.filter(o => o.status === "Completed").length;

  const filteredOrders = orders.filter(o => {
    if (filterStatus === "all") return true;
    if (filterStatus === "in_production") return o.status === "Ready" || o.status === "In_Progress";
    return o.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const canCreate = user?.role === "Admin" || user?.role === "Manager" || user?.role === "Production";

  const subPageTitles = {
    scheduling: "Production Scheduling",
    orders: "Work Orders Execution",
    quality: "Quality Control Inspections",
  };

  const subPageDescriptions = {
    scheduling: "Interactive Gantt timeline, machine capacity planning, and operational shift sequencing.",
    orders: "Execute shop floor production orders, bill of materials reservations, and output tracking.",
    quality: "Quality assurance inspections, pass/fail thresholds, and non-conformance quarantine signoffs.",
  };

  return (
    <div className="space-y-6 max-w-7xl">
      
      {/* ── Page Header with Title, Description, and Actions ── */}
      <PageHeader
        title={subPageTitles[activeSubPage]}
        description={subPageDescriptions[activeSubPage]}
        action={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={handleExport}
              className="gap-1.5 text-xs font-semibold"
              title="Export CSV data"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </Button>

            {canCreate && (
              <Button
                type="button"
                variant="primary"
                onClick={openCreateOrder}
                className="gap-1.5 text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>New Work Order</span>
              </Button>
            )}
          </>
        }
      />

      {/* ── Sub-Navigation Capsule Bar ── */}
      <div className="flex items-center p-1 bg-[#EBEAE5] dark:bg-stone-900 rounded-full border border-stone-300/80 dark:border-stone-800 shadow-2xs w-fit">
        <button
          type="button"
          onClick={() => setActiveSubPage("scheduling")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeSubPage === "scheduling"
              ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs font-bold border border-transparent dark:border-stone-700"
              : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Scheduling
        </button>
        <button
          type="button"
          onClick={() => setActiveSubPage("orders")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeSubPage === "orders"
              ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs font-bold border border-transparent dark:border-stone-700"
              : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <span>Work orders</span>
          <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.2 ${
            activeSubPage === "orders" ? "bg-amber-600 text-white" : "bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-200"
          }`}>
            {orders.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubPage("quality")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeSubPage === "quality"
              ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs font-bold border border-transparent dark:border-stone-700"
              : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <span>Quality control</span>
          <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.2 ${
            activeSubPage === "quality" ? "bg-emerald-600 text-white" : "bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-200"
          }`}>
            Gate
          </span>
        </button>
      </div>

      {/* ── Sub-Page 1: Scheduling (Interactive Visual Timeline Gantt Board) ── */}
      {activeSubPage === "scheduling" && (
        <InteractiveGanttSchedule 
          orders={orders}
          onNavigateToOrders={() => setActiveSubPage("orders")} 
        />
      )}

      {/* ── Sub-Page 2: Work Orders (Production Operations View) ── */}
      {activeSubPage === "orders" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* 4 Hero Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#E0EDFD] rounded-2xl p-5 border border-blue-200/60 shadow-xs flex flex-col justify-between h-32 text-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900">In Production</span>
                <Target className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-blue-950">
                  {inProductionCount}
                </div>
                <p className="text-[11px] text-blue-800 mt-0.5 font-medium">Shop floor machining active</p>
              </div>
            </div>

            <div className="bg-[#FEF5E7] rounded-2xl p-5 border border-amber-200/70 shadow-xs flex flex-col justify-between h-32 text-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Awaiting Allocation</span>
                <Clock className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-amber-950">
                  {plannedCount}
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5 font-medium">BOM check & reserve required</p>
              </div>
            </div>

            <div className="bg-[#E6F7EC] rounded-2xl p-5 border border-emerald-200/60 shadow-xs flex flex-col justify-between h-32 text-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">Completed Orders</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-emerald-950">
                  {completedCount}
                </div>
                <p className="text-[11px] text-emerald-800 mt-0.5 font-medium">Passed through QC verification</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Lines</span>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900">
                  4 Work Centers
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Operating at 88.4% capacity</p>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-full border border-stone-200 w-fit">
            {(["all", "in_production", "planned", "completed"] as const).map(statusKey => (
              <button
                key={statusKey}
                type="button"
                onClick={() => setFilterStatus(statusKey)}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer capitalize ${
                  filterStatus === statusKey
                    ? "bg-slate-900 text-white shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-stone-200/60"
                }`}
              >
                {statusKey.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Orders Table */}
          {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs">{error}</div>}
          {loading && <div className="p-8 text-slate-500 animate-pulse text-xs">Loading production orders...</div>}
          <Card>
            <Table>
              <thead>
                <tr>
                  <Th>Order ID</Th>
                  <Th>Product</Th>
                  <Th className="text-right">Planned Qty</Th>
                  <Th className="text-right">Actual Qty</Th>
                  <Th>Status</Th>
                  <Th>Production Route</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <Td colSpan={7} className="text-center py-8 text-slate-500 italic">
                      No production orders found matching the filter.
                    </Td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <Td className="font-mono text-xs text-slate-500 font-medium">
                        {order.id.slice(0, 8)}...
                      </Td>
                      <Td>
                        <div className="font-medium text-slate-900">{order.product_name || order.product_id}</div>
                      </Td>
                      <Td className="text-right font-mono font-medium">{order.planned_quantity}</Td>
                      <Td className="text-right font-mono font-medium">
                        {order.actual_quantity !== null && order.actual_quantity !== undefined ? order.actual_quantity : "—"}
                      </Td>
                      <Td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          order.status === "Completed" ? "bg-emerald-100 text-emerald-800" :
                          order.status === "In_Progress" ? "bg-amber-100 text-amber-800" :
                          order.status === "Ready" ? "bg-blue-100 text-blue-800" :
                          "bg-stone-100 text-stone-700"
                        }`}>
                          {order.status}
                        </span>
                      </Td>
                      <Td>
                        <RoutePipeline 
                          steps={[
                            { name: "BOM Check", status: order.status === "Planned" ? "current" : "completed" },
                            { name: "Reserve", status: order.status === "Planned" ? "pending" : "completed" },
                            { name: "Assembly", status: order.status === "In_Progress" ? "current" : order.status === "Completed" ? "completed" : "pending" },
                            { name: "QC Gate", status: order.status === "Completed" ? "completed" : "pending" },
                          ]} 
                        />
                      </Td>
                      <Td className="text-right space-x-1.5 whitespace-nowrap">
                        {order.status === "Planned" && canCreate && (
                          <Button onClick={() => openCheck(order)} variant="secondary" className="py-1 px-2.5 text-xs">
                            Check BOM
                          </Button>
                        )}
                        {order.status === "Ready" && canCreate && (
                          <Button onClick={() => openRecord(order)} variant="primary" className="py-1 px-2.5 text-xs">
                            Record Output
                          </Button>
                        )}
                        {order.status === "In_Progress" && canCreate && (
                          <Button onClick={() => openRecord(order)} variant="primary" className="py-1 px-2.5 text-xs">
                            Complete Order
                          </Button>
                        )}
                        {(order.status === "Planned" || order.status === "Ready") && canCreate && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(order.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                            title="Cancel Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card>
        </div>
      )}

      {/* ── Sub-Page 3: Quality Control (Integrated Inspection Gate) ── */}
      {activeSubPage === "quality" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Quality Sub-Tabs (Pending vs Inspection Records) */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-full border border-stone-200/80 w-fit shadow-2xs">
            <button 
              type="button"
              onClick={() => setQualityTab("Pending")} 
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                qualityTab === "Pending" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Pending Inspections
            </button>
            <button 
              type="button"
              onClick={() => setQualityTab("Inspections")} 
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                qualityTab === "Inspections" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Inspection Records
            </button>
          </div>

          {qualityLoading && <div className="p-8 text-slate-500 animate-pulse text-xs">Loading quality control records...</div>}
          {qualityError && <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">{qualityError}</div>}

          {/* Pending Inspections View */}
          {!qualityLoading && !qualityError && qualityTab === "Pending" && (
            <Card>
              <Table>
                <thead>
                  <tr>
                    <Th>Record ID</Th>
                    <Th>Product</Th>
                    <Th>Date</Th>
                    <Th className="text-right">Produced Qty</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingInspections.length === 0 ? (
                    <tr>
                      <Td colSpan={5} className="text-center py-8 text-slate-500 italic">
                        No pending inspections. All shop floor production lots have been released.
                      </Td>
                    </tr>
                  ) : (
                    pendingInspections.map(record => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <Td className="font-mono text-xs text-slate-500">{record.id.slice(0, 8)}...</Td>
                        <Td>
                          <div className="font-medium text-slate-900">{record.product_name}</div>
                          <div className="font-mono text-xs text-slate-500 mt-0.5">{record.product_sku}</div>
                        </Td>
                        <Td className="text-slate-700">{new Date(record.completion_date).toLocaleDateString()}</Td>
                        <Td className="text-right font-mono font-bold text-slate-900">{record.actual_quantity_produced}</Td>
                        <Td className="text-right">
                          <button 
                            type="button"
                            onClick={() => openInspect(record)} 
                            className="py-1.5 px-4 text-xs font-semibold rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                          >
                            Inspect
                          </button>
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card>
          )}

          {/* Completed Inspections View */}
          {!qualityLoading && !qualityError && qualityTab === "Inspections" && (
            <Card>
              <Table>
                <thead>
                  <tr>
                    <Th>Inspection ID</Th>
                    <Th>Prodo ID</Th>
                    <Th>Date</Th>
                    <Th>Inspector</Th>
                    <Th className="text-right">Pass Qty</Th>
                    <Th className="text-right">Fail Qty</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspections.length === 0 ? (
                    <tr>
                      <Td colSpan={7} className="text-center py-8 text-slate-500 italic">
                        No inspection records found.
                      </Td>
                    </tr>
                  ) : (
                    inspections.map(i => (
                      <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                        <Td className="font-mono text-xs text-slate-500 font-medium">{i.id.slice(0, 8)}...</Td>
                        <Td className="font-mono text-xs text-slate-500">{i.prodo_id.slice(0, 8)}...</Td>
                        <Td className="text-slate-700">{new Date(i.inspection_date).toLocaleDateString()}</Td>
                        <Td className="font-medium text-slate-900">{i.inspector_name}</Td>
                        <Td className="text-right font-mono font-bold text-emerald-600">{i.pass_quantity}</Td>
                        <Td className="text-right font-mono font-bold text-red-600">{i.fail_quantity}</Td>
                        <Td className="text-right">
                          <button 
                            type="button"
                            onClick={() => openDetails(i)} 
                            className="py-1 px-3 text-xs font-semibold rounded-full bg-stone-100 hover:bg-stone-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            View
                          </button>
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card>
          )}
        </div>
      )}

      {/* ── Modals & Overlays ────────────────────────────────────────────── */}

      {/* 1. Create Work Order Modal */}
      {showCreateOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-base text-slate-900">New Production Work Order</h3>
              <button onClick={closeCreateOrder} className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              {createFormError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {createFormError}
                </div>
              )}

              <div>
                <Label htmlFor="order-product">Target Assembly / Product</Label>
                <select
                  id="order-product"
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  value={orderProductId}
                  onChange={(e) => setOrderProductId(e.target.value)}
                >
                  <option value="">Select product to manufacture...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="order-qty">Planned Build Quantity</Label>
                <Input
                  id="order-qty"
                  type="number"
                  min="1"
                  placeholder="e.g. 50"
                  value={orderPlannedQty}
                  onChange={(e) => setOrderPlannedQty(sanitizeNumberInput(e.target.value))}
                  className="mt-1 rounded-xl"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Bill of Materials (BOM Requirements)</Label>
                  <button
                    type="button"
                    onClick={addBomItem}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {bomItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        className="flex-1 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs text-slate-900"
                        value={item.material_id}
                        onChange={(e) => updateBomItem(idx, "material_id", e.target.value)}
                      >
                        <option value="">Select raw material...</option>
                        {materials.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>
                        ))}
                      </select>

                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Qty"
                        value={item.required_quantity}
                        onChange={(e) => updateBomItem(idx, "required_quantity", sanitizeNumberInput(e.target.value))}
                        className="w-24 rounded-xl text-xs py-2"
                      />

                      {bomItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBomItem(idx)}
                          className="p-2 text-stone-400 hover:text-red-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
                <Button type="button" onClick={closeCreateOrder} variant="ghost" className="rounded-full text-xs">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={createSubmitting} className="rounded-full text-xs px-5">
                  {createSubmitting ? "Creating..." : "Create Work Order"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. BOM Check & Allocation Modal */}
      {activeModal === "check" && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-base text-slate-900">BOM Material Allocation Check</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full hover:bg-stone-100 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkLoading && <div className="p-6 text-center text-xs text-slate-500 animate-pulse">Checking warehouse stocks...</div>}
            {checkError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">{checkError}</div>}
            {reserveError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">{reserveError}</div>}

            {availabilityCheck && (
              <div className="space-y-4 text-xs">
                <div className={`p-3.5 rounded-2xl flex items-center gap-2.5 ${
                  availabilityCheck.all_available ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-amber-50 text-amber-900 border border-amber-200"
                }`}>
                  {availabilityCheck.all_available ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span className="font-medium">
                    {availabilityCheck.all_available
                      ? "All required BOM materials are in stock and ready to be reserved."
                      : "Insufficient stock for one or more BOM items. Procurement required."}
                  </span>
                </div>

                <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 max-h-48 overflow-y-auto">
                  {availabilityCheck.items?.map((it: any) => (
                    <div key={it.material_id} className="p-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800">{it.material_name}</div>
                        <div className="text-[11px] text-stone-400">Req: {it.required_quantity} · Avail: {it.available_quantity}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        it.is_available ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}>
                        {it.is_available ? "In Stock" : "Shortage"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <Button onClick={() => setActiveModal(null)} variant="ghost" className="rounded-full text-xs">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReserve}
                    disabled={reserveLoading || !availabilityCheck.all_available}
                    variant="primary"
                    className="rounded-full text-xs px-5"
                  >
                    {reserveLoading ? "Reserving..." : "Reserve Materials"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Record Output Modal */}
      {activeModal === "record" && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-base text-slate-900">Record Production Output</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full hover:bg-stone-100 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecord} className="space-y-4">
              {recordError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">{recordError}</div>}

              <div>
                <Label htmlFor="actual-qty">Actual Produced Units</Label>
                <Input
                  id="actual-qty"
                  type="number"
                  min="1"
                  value={actualQty}
                  onChange={(e) => setActualQty(sanitizeNumberInput(e.target.value))}
                  className="mt-1 rounded-xl"
                  required
                />
                <p className="text-[11px] text-stone-400 mt-1">Planned: {selectedOrder.planned_quantity} units</p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" onClick={() => setActiveModal(null)} variant="ghost" className="rounded-full text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={recordLoading} variant="primary" className="rounded-full text-xs px-5">
                  {recordLoading ? "Saving..." : "Log Output & Send to QC"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Quality Inspection Modal */}
      {activeQualityModal === "inspect" && selectedInspectionRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-base text-slate-900">QC Gate Inspection</h3>
              <button onClick={() => setActiveQualityModal(null)} className="p-1 rounded-full hover:bg-stone-100 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <p className="text-stone-500">Product: <strong className="text-slate-900">{selectedInspectionRecord.product_name}</strong></p>
              <p className="text-stone-500 mt-0.5">Total Produced: <strong className="text-slate-900">{selectedInspectionRecord.actual_quantity_produced} units</strong></p>
            </div>

            <form onSubmit={handleInspectSubmit} className="space-y-4 text-xs">
              {formError && <div className="p-3 bg-red-50 text-red-700 rounded-xl">{formError}</div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pass-qty">Pass Qty</Label>
                  <Input
                    id="pass-qty"
                    type="number"
                    min="0"
                    value={passQty}
                    onChange={(e) => {
                      const sanitized = sanitizeNumberInput(e.target.value);
                      setPassQty(sanitized);
                      const total = Number(selectedInspectionRecord.actual_quantity_produced) || 0;
                      if (sanitized !== "") {
                        setFailQty(Math.max(0, total - Number(sanitized)));
                      }
                    }}
                    className="mt-1 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fail-qty">Fail Qty</Label>
                  <Input
                    id="fail-qty"
                    type="number"
                    min="0"
                    value={failQty}
                    onChange={(e) => {
                      const sanitized = sanitizeNumberInput(e.target.value);
                      setFailQty(sanitized);
                      const total = Number(selectedInspectionRecord.actual_quantity_produced) || 0;
                      if (sanitized !== "") {
                        setPassQty(Math.max(0, total - Number(sanitized)));
                      }
                    }}
                    className="mt-1 rounded-xl"
                    required
                  />
                </div>
              </div>

              {Number(failQty) > 0 && (
                <div>
                  <Label htmlFor="defect-reason">Defect Reason Classification</Label>
                  <select
                    id="defect-reason"
                    required
                    value={defectReason}
                    onChange={(e) => setDefectReason(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-xl bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select defect classification...</option>
                    <option value="Scratch/Cosmetic">Scratch / Cosmetic Defect</option>
                    <option value="Assembly Error">Assembly / Placement Error</option>
                    <option value="Material Failure">Material Fatigue / Solder Void</option>
                    <option value="Dimensional Out of Spec">Dimensional Out of Spec</option>
                    <option value="Other">Other Floor Anomaly</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" onClick={() => setActiveQualityModal(null)} variant="ghost" className="rounded-full text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading} variant="primary" className="rounded-full text-xs px-5">
                  {formLoading ? "Recording..." : "Release Batch"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Quality Details Modal */}
      {activeQualityModal === "details" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-base text-slate-900">Inspection Digital Genealogy</h3>
              <button onClick={() => setActiveQualityModal(null)} className="p-1 rounded-full hover:bg-stone-100 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailsError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">{detailsError}</div>}
            
            {inspectionDetails ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-2xl space-y-1">
                  <p><strong className="text-slate-900">Product:</strong> {inspectionDetails.product_name}</p>
                  <p><strong className="text-slate-900">Inspector:</strong> {inspectionDetails.inspector_name}</p>
                  <p><strong className="text-slate-900">Date:</strong> {new Date(inspectionDetails.inspection_date).toLocaleString()}</p>
                  <p><strong className="text-slate-900">Digital Seal:</strong> <span className="font-mono text-[10px] text-emerald-700">SHA256-AUTHENTICATED</span></p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl font-bold font-mono">
                    {inspectionDetails.pass_quantity} Passed
                  </div>
                  <div className="p-2.5 bg-red-50 text-red-800 rounded-xl font-bold font-mono">
                    {inspectionDetails.fail_quantity} Defective
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 animate-pulse">Loading genealogy stamp...</div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setActiveQualityModal(null)} variant="secondary" className="rounded-full text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export default Production;
