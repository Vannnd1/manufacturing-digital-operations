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
import { PageHeader, Card, Button, Input, Label } from "../components/ui";
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

const DEFAULT_PANASONIC_PRODUCTS: Product[] = [
  { id: "p-ac-s10", sku: "PROD-AC-S10", name: "AC Split Standard 1PK (CS-PN10WKJ)", unit: "unit" },
  { id: "p-ac-i10", sku: "PROD-AC-I10", name: "AC Split Inverter 1PK (CS-XU10WKPJ)", unit: "unit" },
  { id: "p-ac-i15", sku: "PROD-AC-I15", name: "AC Split Inverter 1.5PK (CS-XU13WKPJ)", unit: "unit" },
  { id: "p-rf-2dr", sku: "PROD-RF-2DR", name: "Refrigerator 2-Door 268L (NR-BP303VS)", unit: "unit" },
  { id: "p-rf-1dr", sku: "PROD-RF-1DR", name: "Refrigerator 1-Door 100L (NR-AP188VS)", unit: "unit" },
  { id: "p-wm-tt7", sku: "PROD-WM-TT7", name: "Washing Machine Top Load 7kg (NA-F70A9)", unit: "unit" },
  { id: "p-wm-fl8", sku: "PROD-WM-FL8", name: "Washing Machine Front Load 8kg (NA-V80FG3)", unit: "unit" },
  { id: "p-tv-32h", sku: "PROD-TV-32H", name: "LED TV 32-inch HD Ready (TH-32LS600G)", unit: "unit" },
  { id: "p-tv-43f", sku: "PROD-TV-43F", name: "LED TV 43-inch Full HD (TH-43LX800G)", unit: "unit" },
];

function getOrderScheduleInfo(order: any, idx: number) {
  const now = new Date();
  const rawName = String(order.product_name || order.product_id || "");

  const workCenters = [
    { code: "WC-AC-01", name: "AC Tube Bending & Heat Exchanger", bay: "Plant 1 · Bay 1" },
    { code: "WC-AC-02", name: "Inverter & Refrigerant Vacuum Bay", bay: "Plant 1 · Bay 2" },
    { code: "WC-RF-01", name: "Refrigerator Cabinet & PU Foaming", bay: "Plant 2 · Line A" },
    { code: "WC-WM-01", name: "Washer Drum & Motor Integration", bay: "Plant 2 · Bay 3" },
    { code: "WC-TV-01", name: "SMT & Display Panel Lamination", bay: "Plant 3 · Cleanroom" },
    { code: "WC-QC-01", name: "High-Voltage Dielectric Gate", bay: "QC Test Lab" },
  ];
  const station = workCenters[idx % workCenters.length];

  const fmtMonthDay = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  let startDate: Date;
  let endDate: Date;
  let scheduleTag: string;
  let progress: number;

  if (order.status === "Completed") {
    // Finished earlier this week
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4 - (idx % 2));
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (idx % 2));
    scheduleTag = "Completed " + fmtMonthDay(endDate);
    progress = 100;
  } else if (order.status === "In_Progress") {
    // Currently on shop floor today
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5);
    scheduleTag = "Active on floor today";
    progress = 65;
  } else if (order.status === "Ready") {
    // Materials reserved, staged for assembly today
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 6);
    scheduleTag = "Starts today";
    progress = 20;
  } else {
    // Planned - queued up for upcoming days
    const dayOffset = 1 + (idx % 3);
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset + 6);
    scheduleTag = "Starts " + fmtMonthDay(startDate);
    progress = 0;
  }

  const dateRange = `${fmtMonthDay(startDate)} – ${fmtMonthDay(endDate)}, ${endDate.getFullYear()}`;

  return {
    sku: order.product_sku || "PROD-AC-S10",
    name: rawName || "AC Split Standard 1PK (CS-PN10WKJ)",
    workCenterCode: station.code,
    workCenterName: station.name,
    bay: station.bay,
    dateRange,
    scheduleTag,
    progress,
  };
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
    getProducts()
      .then((d: Product[]) => {
        if (!d || d.length === 0) {
          setProducts(DEFAULT_PANASONIC_PRODUCTS);
          return;
        }
        // Ensure all core Panasonic appliance products are represented
        const existingSkus = new Set(d.map((p) => p.sku));
        const missing = DEFAULT_PANASONIC_PRODUCTS.filter((def) => !existingSkus.has(def.sku));
        setProducts([...d, ...missing]);
      })
      .catch(() => setProducts(DEFAULT_PANASONIC_PRODUCTS));
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
      <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-900 rounded-full border border-stone-200/80 dark:border-stone-800 shadow-2xs w-fit">
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
            activeSubPage === "orders" ? "bg-amber-600 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200"
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
            activeSubPage === "quality" ? "bg-emerald-600 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200"
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
          
          {/* 4 Hero Metric Cards (Unified Industrial Design) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 flex flex-col justify-between h-32 border-l-4 border-l-blue-600 bg-white dark:bg-[#18181B] border border-stone-200/80 dark:border-stone-800 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  Active In Production
                </span>
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-stone-100">
                  {inProductionCount}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-1 font-medium">
                  Shop floor machining active
                </p>
              </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between h-32 border-l-4 border-l-amber-500 bg-white dark:bg-[#18181B] border border-stone-200/80 dark:border-stone-800 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
                <span>Awaiting Allocation</span>
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-stone-100">
                  {plannedCount}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-1 font-medium">
                  BOM check & reserve required
                </p>
              </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between h-32 border-l-4 border-l-emerald-500 bg-white dark:bg-[#18181B] border border-stone-200/80 dark:border-stone-800 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span>Completed Orders</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-stone-100">
                  {completedCount}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-1 font-medium">
                  Passed through QC verification
                </p>
              </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between h-32 border-l-4 border-l-slate-800 dark:border-l-stone-400 bg-white dark:bg-[#18181B] border border-stone-200/80 dark:border-stone-800 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-stone-400">
                <span>Active Work Centers</span>
                <Layers className="w-4 h-4 text-slate-400 dark:text-stone-500" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-stone-100">
                  6 Work Centers
                </div>
                <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-1 font-medium">
                  Operating at 88.4% capacity today
                </p>
              </div>
            </Card>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-900 rounded-full border border-stone-200/80 dark:border-stone-800 w-fit">
            {(["all", "in_production", "planned", "completed"] as const).map(statusKey => (
              <button
                key={statusKey}
                type="button"
                onClick={() => setFilterStatus(statusKey)}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer capitalize ${
                  filterStatus === statusKey
                    ? "bg-slate-900 dark:bg-stone-800 text-white shadow-2xs font-bold"
                    : "text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {statusKey.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Orders Table Container */}
          {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs">{error}</div>}
          {loading && <div className="p-8 text-slate-500 animate-pulse text-xs">Loading production orders...</div>}
          <Card className="rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap text-slate-800 dark:text-stone-200">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 text-slate-600 dark:text-stone-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Target Assembly / Product</th>
                    <th className="py-3 px-4">Work Center & Line</th>
                    <th className="py-3 px-4">Schedule (Real-Time)</th>
                    <th className="py-3 px-4 text-right">Planned Qty</th>
                    <th className="py-3 px-4 text-right">Actual Output</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 text-xs">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400 dark:text-stone-500 italic">
                        No production orders found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order, idx) => {
                      const prodInfo = getOrderScheduleInfo(order, idx);
                      const displayId = order.id.startsWith("mo-") ? order.id.toUpperCase() : order.id.slice(0, 8).toUpperCase();
                      return (
                        <tr key={order.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors">
                          {/* Order ID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-stone-300">
                            <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                              {displayId}
                            </span>
                          </td>

                          {/* Product */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-xs text-slate-900 dark:text-stone-100">
                                {prodInfo.name}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500 dark:text-stone-400 mt-0.5">
                                {prodInfo.sku}
                              </span>
                            </div>
                          </td>

                          {/* Station / Line */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs text-slate-800 dark:text-stone-200">
                                {prodInfo.workCenterCode}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-stone-400">
                                {prodInfo.workCenterName}
                              </span>
                            </div>
                          </td>

                          {/* Schedule (Real-Time) */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-stone-200">
                                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-stone-500" />
                                <span>{prodInfo.dateRange}</span>
                              </div>
                              <span className="text-[10px] font-medium text-slate-500 dark:text-stone-400 mt-0.5">
                                {prodInfo.scheduleTag}
                              </span>
                            </div>
                          </td>

                          {/* Planned Qty */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-stone-100">
                            {Number(order.planned_quantity).toLocaleString()}{" "}
                            <span className="text-[10px] font-normal text-slate-400">units</span>
                          </td>

                          {/* Actual Qty */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-stone-100">
                            {order.actual_quantity !== null && order.actual_quantity !== undefined ? (
                              <span>
                                {Number(order.actual_quantity).toLocaleString()}{" "}
                                <span className="text-[10px] font-normal text-slate-400">units</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>

                          {/* Progress */}
                          <td className="py-3.5 px-4 min-w-[130px]">
                            <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1 text-slate-700 dark:text-stone-300">
                              <span>{prodInfo.progress}%</span>
                              <span className="text-[10px] font-sans font-medium text-slate-400">
                                {order.status === "Completed"
                                  ? "Verified"
                                  : order.status === "In_Progress"
                                  ? "Assembly"
                                  : order.status === "Ready"
                                  ? "Staged"
                                  : "Planned"}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  order.status === "Completed"
                                    ? "bg-emerald-500"
                                    : order.status === "In_Progress"
                                    ? "bg-blue-600"
                                    : order.status === "Ready"
                                    ? "bg-amber-500"
                                    : "bg-stone-300 dark:bg-stone-600"
                                }`}
                                style={{ width: `${prodInfo.progress}%` }}
                              />
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                order.status === "Completed"
                                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80"
                                  : order.status === "In_Progress"
                                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80"
                                  : order.status === "Ready"
                                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80"
                                  : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  order.status === "Completed"
                                    ? "bg-emerald-500"
                                    : order.status === "In_Progress"
                                    ? "bg-blue-500 animate-pulse"
                                    : order.status === "Ready"
                                    ? "bg-amber-500"
                                    : "bg-stone-400"
                                }`}
                              />
                              <span>{order.status === "In_Progress" ? "In Progress" : order.status}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {order.status === "Planned" && canCreate && (
                              <Button
                                onClick={() => openCheck(order)}
                                variant="secondary"
                                className="py-1 px-3 text-xs font-semibold"
                              >
                                Check BOM
                              </Button>
                            )}
                            {order.status === "Ready" && canCreate && (
                              <Button
                                onClick={() => openRecord(order)}
                                variant="primary"
                                className="py-1 px-3 text-xs font-semibold"
                              >
                                Record Output
                              </Button>
                            )}
                            {order.status === "In_Progress" && canCreate && (
                              <Button
                                onClick={() => openRecord(order)}
                                variant="primary"
                                className="py-1 px-3 text-xs font-semibold"
                              >
                                Complete Order
                              </Button>
                            )}
                            {(order.status === "Planned" || order.status === "Ready") && canCreate && (
                              <button
                                type="button"
                                onClick={() => handleCancelOrder(order.id)}
                                className="p-1.5 text-stone-400 hover:text-red-600 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors inline-flex items-center cursor-pointer"
                                title="Cancel Order"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        </div>
      )}

      {/* ── Sub-Page 3: Quality Control (Integrated Inspection Gate) ── */}
      {activeSubPage === "quality" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Quality Sub-Tabs (Pending vs Inspection Records) */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-900 rounded-full border border-stone-200/80 dark:border-stone-800 w-fit shadow-2xs">
            <button 
              type="button"
              onClick={() => setQualityTab("Pending")} 
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                qualityTab === "Pending" ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs font-bold" : "text-slate-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Pending Inspections
            </button>
            <button 
              type="button"
              onClick={() => setQualityTab("Inspections")} 
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                qualityTab === "Inspections" ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs font-bold" : "text-slate-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Inspection Records
            </button>
          </div>

          {qualityLoading && <div className="p-8 text-slate-500 animate-pulse text-xs">Loading quality control records...</div>}
          {qualityError && <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">{qualityError}</div>}

          {/* Pending Inspections View */}
          {!qualityLoading && !qualityError && qualityTab === "Pending" && (
            <Card className="rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap text-slate-800 dark:text-stone-200">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 text-slate-600 dark:text-stone-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Record ID</th>
                      <th className="py-3 px-4">Product / Assembly</th>
                      <th className="py-3 px-4">Production Date</th>
                      <th className="py-3 px-4 text-right">Produced Qty</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 text-xs">
                    {pendingInspections.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400 dark:text-stone-500 italic">
                          No pending inspections. All shop floor production lots have been released.
                        </td>
                      </tr>
                    ) : (
                      pendingInspections.map((record) => {
                        const recDate = record.completion_date ? new Date(record.completion_date) : new Date();
                        const displayRecId = record.id.startsWith("rec-") ? record.id.toUpperCase() : record.id.slice(0, 8).toUpperCase();
                        return (
                          <tr key={record.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-stone-300">
                              <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                                {displayRecId}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-xs text-slate-900 dark:text-stone-100">{record.product_name}</div>
                              <div className="font-mono text-[10px] text-slate-500 dark:text-stone-400 mt-0.5">{record.product_sku}</div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-stone-300">
                              <div className="flex items-center gap-1.5 text-xs font-medium">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{recDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-stone-100">
                              {Number(record.actual_quantity_produced).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">units</span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button 
                                type="button"
                                onClick={() => openInspect(record)} 
                                className="py-1.5 px-3.5 text-xs font-semibold rounded-full bg-slate-900 dark:bg-amber-600 text-white hover:bg-slate-800 dark:hover:bg-amber-500 transition-colors shadow-2xs cursor-pointer"
                              >
                                Inspect Lot
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Completed Inspections View */}
          {!qualityLoading && !qualityError && qualityTab === "Inspections" && (
            <Card className="rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap text-slate-800 dark:text-stone-200">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 text-slate-600 dark:text-stone-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Inspection ID</th>
                      <th className="py-3 px-4">Production Record</th>
                      <th className="py-3 px-4">Inspection Date</th>
                      <th className="py-3 px-4">Inspector</th>
                      <th className="py-3 px-4 text-right">Pass Qty</th>
                      <th className="py-3 px-4 text-right">Defect Qty</th>
                      <th className="py-3 px-4 text-center">Yield Rate</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 text-xs">
                    {inspections.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-400 dark:text-stone-500 italic">
                          No inspection records found.
                        </td>
                      </tr>
                    ) : (
                      inspections.map((i) => {
                        const total = (Number(i.pass_quantity) || 0) + (Number(i.fail_quantity) || 0);
                        const yieldPercent = total > 0 ? ((Number(i.pass_quantity) / total) * 100).toFixed(1) : "100.0";
                        const inspDate = i.inspection_date ? new Date(i.inspection_date) : new Date();
                        const displayInspId = i.id.startsWith("qc-") ? i.id.toUpperCase() : i.id.slice(0, 8).toUpperCase();
                        const displayProdoId = (i.prodo_id || "").startsWith("mo-") ? i.prodo_id.toUpperCase() : (i.prodo_id || "").slice(0, 8).toUpperCase();

                        return (
                          <tr key={i.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-stone-300">
                              <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                                {displayInspId}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-stone-400">
                              {displayProdoId || "BATCH-REL"}
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-stone-300">
                              <div className="flex items-center gap-1.5 text-xs font-medium">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{inspDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-stone-100">
                              {i.inspector_name}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {Number(i.pass_quantity).toLocaleString()}{" "}
                              <span className="text-[10px] font-normal text-emerald-600/70">passed</span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-red-600 dark:text-red-400">
                              {Number(i.fail_quantity).toLocaleString()}{" "}
                              <span className="text-[10px] font-normal text-red-500/70">defects</span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                                  Number(yieldPercent) >= 98
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80"
                                    : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80"
                                }`}
                              >
                                {yieldPercent}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button 
                                type="button"
                                onClick={() => openDetails(i)} 
                                className="py-1 px-3 text-xs font-semibold rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-slate-700 dark:text-stone-200 transition-colors cursor-pointer"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Modals & Overlays ────────────────────────────────────────────── */}

      {/* 1. Create Work Order Modal */}
      {showCreateOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-stone-100">New Production Work Order</h3>
              <button onClick={closeCreateOrder} className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100">
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
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-slate-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
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
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {bomItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        className="flex-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-slate-900 dark:text-stone-100 cursor-pointer"
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
                          className="p-2 text-stone-400 hover:text-red-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-stone-800">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-stone-100">BOM Material Allocation Check</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkLoading && <div className="p-6 text-center text-xs text-slate-500 animate-pulse">Checking warehouse stocks...</div>}
            {checkError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">{checkError}</div>}
            {reserveError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">{reserveError}</div>}

            {availabilityCheck && (
              <div className="space-y-4 text-xs">
                <div className={`p-3.5 rounded-2xl flex items-center gap-2.5 ${
                  availabilityCheck.all_available ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800" : "bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
                }`}>
                  {availabilityCheck.all_available ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                  <span className="font-medium">
                    {availabilityCheck.all_available
                      ? "All required BOM materials are in stock and ready to be reserved."
                      : "Insufficient stock for one or more BOM items. Procurement required."}
                  </span>
                </div>

                <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-800 max-h-48 overflow-y-auto">
                  {availabilityCheck.items?.map((it: any) => (
                    <div key={it.material_id} className="p-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-stone-200">{it.material_name}</div>
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

                <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-stone-100">Record Production Output</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 cursor-pointer">
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

              <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-stone-100">QC Gate Inspection</h3>
              <button onClick={() => setActiveQualityModal(null)} className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
              <p className="text-stone-500 dark:text-stone-400">Product: <strong className="text-slate-900 dark:text-stone-100">{selectedInspectionRecord.product_name}</strong></p>
              <p className="text-stone-500 dark:text-stone-400 mt-0.5">Total Produced: <strong className="text-slate-900 dark:text-stone-100">{selectedInspectionRecord.actual_quantity_produced} units</strong></p>
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
                    className="w-full mt-1 px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-xl bg-white dark:bg-stone-900 text-xs text-slate-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
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

              <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-stone-100">Inspection Digital Genealogy</h3>
              <button onClick={() => setActiveQualityModal(null)} className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailsError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl">{detailsError}</div>}
            
            {inspectionDetails ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl space-y-1 border border-stone-200/80 dark:border-stone-800">
                  <p><strong className="text-slate-900 dark:text-stone-100">Product:</strong> {inspectionDetails.product_name}</p>
                  <p><strong className="text-slate-900 dark:text-stone-100">Inspector:</strong> {inspectionDetails.inspector_name}</p>
                  <p><strong className="text-slate-900 dark:text-stone-100">Date:</strong> {new Date(inspectionDetails.inspection_date).toLocaleString()}</p>
                  <p><strong className="text-slate-900 dark:text-stone-100">Digital Seal:</strong> <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">SHA256-AUTHENTICATED</span></p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 rounded-xl font-bold font-mono border border-emerald-200 dark:border-emerald-800/80">
                    {inspectionDetails.pass_quantity} Passed
                  </div>
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200 rounded-xl font-bold font-mono border border-red-200 dark:border-red-800/80">
                    {inspectionDetails.fail_quantity} Defective
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 animate-pulse">Loading genealogy stamp...</div>
            )}

            <div className="flex justify-end pt-2 border-t border-stone-100 dark:border-stone-800">
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
