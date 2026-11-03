import { useState, useMemo, useRef, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Activity, 
  Zap, 
  GripHorizontal,
  Check,
  X,
  ArrowLeft,
  Wrench,
  ExternalLink,
  FileText,
  Calendar,
  Pause,
  CheckCircle2,
  Layers,
  Info
} from "lucide-react";
import { useLiveTime } from "../utils/useLiveTime";

export interface OperationItem {
  id: string;
  name: string;
  techInitial: string;
  techName?: string;
  techColor: string;
  startDay: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  durationDays: number;
  progress: number; // 0 - 100
  colorScheme: "emerald" | "blue" | "amber" | "stone";
  statusText?: string;
  rush?: boolean;
  workCenter?: string;
}

export interface WorkOrderItem {
  id: string; // e.g. "WO-2041"
  model: string; // e.g. "PROD-AC-S10 · AC Split Standard 1PK (CS-PN10WKJ) (×300)"
  shortName?: string;
  rush?: boolean;
  status?: "In progress" | "On hold" | "Completed" | "Done";
  startDay: number;
  durationDays: number;
  expanded: boolean;
  operations: OperationItem[];
  note?: string;
  clientOrDept?: string;
  dateRange?: string;
}

interface InteractiveGanttScheduleProps {
  orders?: any[];
  onNavigateToOrders?: () => void;
}

const STAFF_ROSTER = [
  { id: "st-1", name: "Aiko Tanaka", role: "TIG Welder & Fabrication", initial: "AT", color: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" },
  { id: "st-2", name: "Felix Wagner", role: "CNC & Laser Operator", initial: "FW", color: "bg-slate-200 text-slate-800 dark:bg-stone-800 dark:text-stone-200" },
  { id: "st-3", name: "Lena Vogel", role: "Frame Alignment & Precision", initial: "LV", color: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" },
  { id: "st-4", name: "Amara Okafor", role: "Mechanical Assembly Tech", initial: "AO", color: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" },
  { id: "st-5", name: "Hana Kim", role: "Quality & Dielectric Inspector", initial: "HK", color: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200" },
  { id: "st-6", name: "Bo Andersen", role: "Electrical Wiring Tech", initial: "BA", color: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" },
  { id: "st-7", name: "Jiro Bando", role: "Powder Coating Specialist", initial: "JB", color: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200" },
  { id: "st-8", name: "Diego Alvarez", role: "Sub-assembly Tech", initial: "DA", color: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200" },
];

const DEFAULT_DEMO_ORDERS = [
  { id: "MO-301", product_sku: "PROD-AC-S10", product_name: "AC Split Standard 1PK (CS-PN10WKJ)", planned_quantity: 300, status: "In_Progress" },
  { id: "MO-302", product_sku: "PROD-AC-I10", product_name: "AC Split Inverter 1PK (CS-XU10WKPJ)", planned_quantity: 200, status: "Ready" },
  { id: "MO-303", product_sku: "PROD-RF-2DR", product_name: "Refrigerator 2-Door 268L (NR-BP303VS)", planned_quantity: 150, status: "Planned" },
  { id: "MO-304", product_sku: "PROD-WM-TT7", product_name: "Washing Machine Top Load 7kg (NA-F70A9)", planned_quantity: 120, status: "Planned" },
  { id: "MO-305", product_sku: "PROD-TV-32H", product_name: "LED TV 32-inch HD Ready (TH-32LS600G)", planned_quantity: 500, status: "Completed" },
  { id: "MO-306", product_sku: "PROD-AC-S10", product_name: "AC Split Standard 1PK (CS-PN10WKJ)", planned_quantity: 250, status: "Completed" },
];

function getProductOperationsTemplate(sku: string, name: string) {
  const upper = (sku + " " + name).toUpperCase();
  if (upper.includes("AC") || upper.includes("AIR CONDITIONER")) {
    return [
      { name: "Copper tube bending & flaring", techInitial: "FW", techName: "Felix Wagner", techColor: "bg-slate-200 text-slate-800 dark:bg-stone-800 dark:text-stone-200", workCenter: "WC-AC-01 · AC Tube Bending & Heat Exchanger" },
      { name: "Aluminum fin matrix expansion", techInitial: "AT", techName: "Aiko Tanaka", techColor: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200", workCenter: "WC-AC-01 · AC Tube Bending & Heat Exchanger" },
      { name: "R32 evacuation & charging", techInitial: "BA", techName: "Bo Andersen", techColor: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200", workCenter: "WC-AC-02 · Inverter & Refrigerant Vacuum Bay" },
      { name: "Dielectric & cooling run test", techInitial: "HK", techName: "Hana Kim", techColor: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200", workCenter: "WC-QC-01 · High-Voltage Dielectric Gate" },
    ];
  }
  if (upper.includes("RF") || upper.includes("REFRIGERATOR")) {
    return [
      { name: "Cabinet stamping & bending", techInitial: "FW", techName: "Felix Wagner", techColor: "bg-slate-200 text-slate-800 dark:bg-stone-800 dark:text-stone-200", workCenter: "WC-RF-01 · Refrigerator Cabinet & PU Foaming" },
      { name: "PU foaming insulation injection", techInitial: "DA", techName: "Diego Alvarez", techColor: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200", workCenter: "WC-RF-01 · Refrigerator Cabinet & PU Foaming" },
      { name: "Compressor loop brazing", techInitial: "AT", techName: "Aiko Tanaka", techColor: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200", workCenter: "WC-RF-01 · Refrigerator Cabinet & PU Foaming" },
      { name: "Temperature pull-down & seal test", techInitial: "HK", techName: "Hana Kim", techColor: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200", workCenter: "WC-QC-01 · High-Voltage Dielectric Gate" },
    ];
  }
  if (upper.includes("WM") || upper.includes("WASHING")) {
    return [
      { name: "Drum stamping & spin balancing", techInitial: "LV", techName: "Lena Vogel", techColor: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200", workCenter: "WC-WM-01 · Washer Drum & Motor Integration" },
      { name: "Direct-drive motor integration", techInitial: "AO", techName: "Amara Okafor", techColor: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200", workCenter: "WC-WM-01 · Washer Drum & Motor Integration" },
      { name: "Electronic control harness", techInitial: "BA", techName: "Bo Andersen", techColor: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200", workCenter: "WC-WM-01 · Washer Drum & Motor Integration" },
      { name: "Water leak & high-RPM test gate", techInitial: "HK", techName: "Hana Kim", techColor: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200", workCenter: "WC-QC-01 · High-Voltage Dielectric Gate" },
    ];
  }
  if (upper.includes("TV") || upper.includes("LED")) {
    return [
      { name: "SMT motherboard surface mount", techInitial: "BA", techName: "Bo Andersen", techColor: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200", workCenter: "WC-TV-01 · SMT & Display Panel Lamination" },
      { name: "LED backlight panel lamination", techInitial: "LV", techName: "Lena Vogel", techColor: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200", workCenter: "WC-TV-01 · SMT & Display Panel Lamination" },
      { name: "Chassis integration & power supply", techInitial: "AO", techName: "Amara Okafor", techColor: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200", workCenter: "WC-TV-01 · SMT & Display Panel Lamination" },
      { name: "High-voltage dielectric test", techInitial: "HK", techName: "Hana Kim", techColor: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200", workCenter: "WC-QC-01 · High-Voltage Dielectric Gate" },
    ];
  }
  return [
    { name: "Raw material staging & cutting", techInitial: "FW", techName: "Felix Wagner", techColor: "bg-slate-200 text-slate-800 dark:bg-stone-800 dark:text-stone-200", workCenter: "WC-AC-01 · Shop Floor Prep" },
    { name: "Mechanical assembly & fastening", techInitial: "AO", techName: "Amara Okafor", techColor: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200", workCenter: "WC-AC-02 · Sub-assembly Bay" },
    { name: "Electrical wiring & harness setup", techInitial: "BA", techName: "Bo Andersen", techColor: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200", workCenter: "WC-WM-01 · Electrical Station" },
    { name: "Quality assurance & final gate", techInitial: "HK", techName: "Hana Kim", techColor: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200", workCenter: "WC-QC-01 · High-Voltage Dielectric Gate" },
  ];
}

function buildWorkOrderItem(
  order: any,
  idx: number,
  currentSunday: Date,
  todayDayOfWeek: number,
  displayId: string
): WorkOrderItem {
  const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const sku = order.product_sku || (order.id && order.id.startsWith("p-") ? order.id.toUpperCase() : "PROD-AC-S10");
  const name = String(order.product_name || order.product_id || "Manufacturing Order Item");
  const qty = Number(order.planned_quantity) || 100;
  const shortName = name.split("(")[0].trim();
  const model = `${sku} · ${name} (×${qty})`;

  let startDay: number;
  let durationDays: number;
  let status: "In progress" | "On hold" | "Completed" | "Done";
  let overallProgress: number;

  if (order.status === "Completed") {
    status = "Completed";
    overallProgress = 100;
    startDay = Math.max(0, todayDayOfWeek - 3 - (idx % 2));
    durationDays = 3;
  } else if (order.status === "In_Progress") {
    status = "In progress";
    overallProgress = 65;
    startDay = Math.max(0, todayDayOfWeek - 1);
    durationDays = 6;
  } else if (order.status === "Ready") {
    status = "In progress";
    overallProgress = 20;
    startDay = todayDayOfWeek;
    durationDays = 6;
  } else {
    // Planned or newly added job
    status = "On hold";
    overallProgress = 0;
    const offset = 1 + (idx % 4);
    startDay = todayDayOfWeek + offset;
    durationDays = 5;
  }

  const startDate = new Date(currentSunday.getTime() + startDay * 86400000);
  const endDate = new Date(currentSunday.getTime() + (startDay + durationDays - 1) * 86400000);
  const dateRange = `${fmtDate(startDate)} – ${fmtDate(endDate)}`;

  let clientOrDept = "Manufacturing Assembly Line";
  const upper = sku.toUpperCase();
  if (upper.includes("AC")) clientOrDept = "AC Production Line 1";
  else if (upper.includes("RF")) clientOrDept = "Refrigerator Line A";
  else if (upper.includes("WM")) clientOrDept = "Washer Bay 3";
  else if (upper.includes("TV")) clientOrDept = "Display Assembly Cleanroom";

  const opTemplates = getProductOperationsTemplate(sku, name);
  const d1 = Math.max(1, Math.floor(durationDays * 0.3));
  const d2 = Math.max(1, Math.floor(durationDays * 0.3));
  const d3 = Math.max(1, Math.floor(durationDays * 0.25));
  const d4 = Math.max(1, durationDays - (d1 + d2 + d3));
  const opDurations = [d1, d2, d3, d4];

  let currentOpStart = startDay;
  const operations: OperationItem[] = opTemplates.map((tmpl, opIdx) => {
    const dur = opDurations[opIdx] || 1;
    const opStart = currentOpStart;
    currentOpStart += dur;

    const opStartD = new Date(currentSunday.getTime() + opStart * 86400000);
    const opEndD = new Date(currentSunday.getTime() + (opStart + dur - 1) * 86400000);
    const statusText = `${fmtDate(opStartD)} – ${fmtDate(opEndD)}`;

    let progress = 0;
    let colorScheme: "emerald" | "blue" | "amber" | "stone" = "stone";

    if (overallProgress === 100) {
      progress = 100;
      colorScheme = "emerald";
    } else if (overallProgress === 65) {
      if (opIdx === 0 || opIdx === 1) {
        progress = 100;
        colorScheme = "emerald";
      } else if (opIdx === 2) {
        progress = 60;
        colorScheme = "blue";
      } else {
        progress = 0;
        colorScheme = "stone";
      }
    } else if (overallProgress === 20) {
      if (opIdx === 0) {
        progress = 60;
        colorScheme = "blue";
      } else if (opIdx === 1) {
        progress = 20;
        colorScheme = "amber";
      } else {
        progress = 0;
        colorScheme = "stone";
      }
    } else {
      progress = 0;
      colorScheme = "stone";
    }

    return {
      id: `${displayId}-OP-${opIdx + 1}`,
      name: tmpl.name,
      techInitial: tmpl.techInitial,
      techName: tmpl.techName,
      techColor: tmpl.techColor,
      startDay: opStart,
      durationDays: dur,
      progress,
      colorScheme,
      statusText,
      workCenter: tmpl.workCenter,
    };
  });

  return {
    id: displayId,
    model,
    shortName,
    clientOrDept,
    dateRange,
    rush: false,
    status,
    startDay,
    durationDays,
    expanded: idx === 0 || idx === 1,
    operations,
    note: `Production run for ${shortName}. Ensure quality test compliance and line synchronization.`,
  };
}

function generateScheduleOrders(ordersList?: any[]): WorkOrderItem[] {
  const effective = ordersList && ordersList.length > 0 ? ordersList : DEFAULT_DEMO_ORDERS;
  const now = new Date();
  const currentSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const todayDayOfWeek = now.getDay();

  return effective.map((order, idx) => {
    const rawId = String(order.id || `order-${idx}`);
    const displayId = rawId.startsWith("mo-") || rawId.startsWith("wo-")
      ? rawId.toUpperCase()
      : rawId.slice(0, 8).toUpperCase();
    return buildWorkOrderItem(order, idx, currentSunday, todayDayOfWeek, displayId);
  });
}

function syncOrdersWithSchedule(ordersList: any[], prev: WorkOrderItem[]): WorkOrderItem[] {
  const now = new Date();
  const currentSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const todayDayOfWeek = now.getDay();

  return ordersList.map((order, idx) => {
    const rawId = String(order.id || `order-${idx}`);
    const displayId = rawId.startsWith("mo-") || rawId.startsWith("wo-")
      ? rawId.toUpperCase()
      : rawId.slice(0, 8).toUpperCase();

    const existing = prev.find((w) => w.id === displayId || w.id === rawId || (order.id && w.id.includes(rawId.slice(0, 6))));
    if (existing) {
      const sku = order.product_sku || existing.model.split(" · ")[0];
      const name = String(order.product_name || existing.shortName);
      const qty = order.planned_quantity || 100;
      return {
        ...existing,
        id: displayId,
        model: `${sku} · ${name} (×${qty})`,
        shortName: name.split("(")[0].trim(),
      };
    }

    return buildWorkOrderItem(order, idx, currentSunday, todayDayOfWeek, displayId);
  });
}

export function InteractiveGanttSchedule({ orders, onNavigateToOrders }: InteractiveGanttScheduleProps) {
  const { formattedShort } = useLiveTime();

  const baseCurrentSunday = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate() - n.getDay());
  }, []);

  const formatGanttDate = (dayOffset: number, includeYear = false) => {
    const d = new Date(baseCurrentSunday.getTime() + dayOffset * 86400000);
    const m = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return includeYear ? `${m}, ${d.getFullYear()}` : m;
  };
  const [granularity, setGranularity] = useState<"Week" | "Month" | "Quarter">("Week");
  const [timeOffset, setTimeOffset] = useState(0);
  const [mode, setMode] = useState<"Orders" | "Work centers">("Orders");
  const [view, setView] = useState<"Timeline" | "Agenda">("Timeline");
  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inspection & Detail Selection States
  const [selectedOpKey, setSelectedOpKey] = useState<{ workOrderId: string; opId: string } | null>(null);
  const [selectedWorkOrderModal, setSelectedWorkOrderModal] = useState<WorkOrderItem | null>(null);
  const [selectedOpModal, setSelectedOpModal] = useState<{ wo: WorkOrderItem; op: OperationItem } | null>(null);

  // Active dragging state
  const [draggingOp, setDraggingOp] = useState<{
    workOrderId: string;
    opId: string;
    origStartDay: number;
  } | null>(null);
  const [dragOverCol, setDragOverCol] = useState<number | null>(null);

  // Timeline horizontal scroll ref & active week detector
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const [activeScrollWeek, setActiveScrollWeek] = useState(0);

  const handleTimelineScroll = () => {
    if (!timelineScrollRef.current) return;
    const sl = timelineScrollRef.current.scrollLeft;
    if (sl < 550) {
      if (activeScrollWeek !== 0) setActiveScrollWeek(0);
    } else if (sl < 1320) {
      if (activeScrollWeek !== 1) setActiveScrollWeek(1);
    } else {
      if (activeScrollWeek !== 2) setActiveScrollWeek(2);
    }
  };

  const handlePrevInterval = () => {
    if (granularity === "Week" && timelineScrollRef.current) {
      timelineScrollRef.current.scrollBy({ left: -770, behavior: "smooth" });
    } else {
      setTimeOffset((prev) => prev - 1);
    }
  };

  const handleNextInterval = () => {
    if (granularity === "Week" && timelineScrollRef.current) {
      timelineScrollRef.current.scrollBy({ left: 770, behavior: "smooth" });
    } else {
      setTimeOffset((prev) => prev + 1);
    }
  };

  const handleTodayClick = () => {
    setTimeOffset(0);
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  // When switching granularity, reset time offset to 0
  const handleGranularityChange = (g: "Week" | "Month" | "Quarter") => {
    setGranularity(g);
    setTimeOffset(0);
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  // Timeline configuration depending on granularity
  const timelineConfig = useMemo(() => {
    const now = new Date();

    if (granularity === "Week") {
      // Start of current week (Sunday) adjusted by timeOffset (in weeks)
      const currentSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      currentSunday.setDate(currentSunday.getDate() + timeOffset * 7);

      const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const cols = [];

      // 21 continuous columns: 3 weeks continuous starting from current Sunday
      for (let i = 0; i < 21; i++) {
        const d = new Date(currentSunday);
        d.setDate(currentSunday.getDate() + i);
        cols.push({
          colIndex: i,
          topLabel: dayNames[i % 7],
          bottomLabel: d.getDate().toString(),
          isToday: d.toDateString() === now.toDateString(),
          dateObj: d,
        });
      }

      const first = cols[0].dateObj;
      const last = cols[6].dateObj;
      const fMonth = first.toLocaleDateString("en-US", { month: "short" });
      const lMonth = last.toLocaleDateString("en-US", { month: "short" });
      const label = fMonth === lMonth
        ? `${fMonth} ${first.getDate()} – ${last.getDate()}, ${last.getFullYear()}`
        : `${fMonth} ${first.getDate()} – ${lMonth} ${last.getDate()}, ${last.getFullYear()}`;

      const activeColIndex = cols.findIndex((c) => c.isToday);

      return {
        totalCols: 21,
        cols,
        label,
        activeColIndex: activeColIndex !== -1 ? activeColIndex : (timeOffset === 0 ? now.getDay() : -1),
        activeBadgeText: formattedShort || "Today",
        gridMinWidth: "min-w-[2310px]",
      };
    }

    if (granularity === "Month") {
      // 5 weeks view starting from start of month adjusted to Sunday
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const baseAnchor = new Date(monthStart);
      baseAnchor.setDate(baseAnchor.getDate() - baseAnchor.getDay() + timeOffset * 35);

      const dayInitials = ["S", "M", "T", "W", "T", "F", "S"];
      const cols = [];

      for (let i = 0; i < 35; i++) {
        const d = new Date(baseAnchor);
        d.setDate(baseAnchor.getDate() + i);
        cols.push({
          colIndex: i,
          topLabel: dayInitials[i % 7],
          bottomLabel: d.getDate().toString(),
          isToday: d.toDateString() === now.toDateString(),
          dateObj: d,
        });
      }

      const first = cols[0].dateObj;
      const last = cols[34].dateObj;
      const fMonth = first.toLocaleDateString("en-US", { month: "short" });
      const lMonth = last.toLocaleDateString("en-US", { month: "short" });
      const label = `${fMonth} ${first.getDate()} – ${lMonth} ${last.getDate()}, ${last.getFullYear()}`;
      const activeColIndex = cols.findIndex((c) => c.isToday);

      return {
        totalCols: 35,
        cols,
        label,
        activeColIndex,
        activeBadgeText: "Today",
        gridMinWidth: "min-w-[1300px]",
      };
    }

    // Quarter view
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const baseAnchor = new Date(now.getFullYear(), quarterStartMonth, 1);
    baseAnchor.setDate(baseAnchor.getDate() - baseAnchor.getDay() + timeOffset * 91);

    const cols = [];
    for (let i = 0; i < 13; i++) {
      const d = new Date(baseAnchor);
      d.setDate(baseAnchor.getDate() + i * 7);
      const mShort = d.toLocaleDateString("en-US", { month: "short" });
      const isCurrentWeek = d.getTime() <= now.getTime() && now.getTime() < d.getTime() + 7 * 86400000;
      cols.push({
        colIndex: i,
        topLabel: `${mShort} ${d.getDate()}`,
        bottomLabel: "WEEK OF",
        isToday: isCurrentWeek,
        dateObj: d,
      });
    }

    const first = cols[0].dateObj;
    const lastEndDate = new Date(baseAnchor);
    lastEndDate.setDate(baseAnchor.getDate() + 13 * 7 - 1);
    const fMonth = first.toLocaleDateString("en-US", { month: "short" });
    const lMonth = lastEndDate.toLocaleDateString("en-US", { month: "short" });
    const label = `${fMonth} ${first.getDate()} – ${lMonth} ${lastEndDate.getDate()}, ${lastEndDate.getFullYear()}`;
    const activeColIndex = cols.findIndex((c) => c.isToday);

    return {
      totalCols: 13,
      cols,
      label,
      activeColIndex,
      activeBadgeText: "Today",
      gridMinWidth: "min-w-[1100px]",
    };
  }, [granularity, timeOffset, formattedShort]);

  // Initial Work Orders synchronized with real-time schedule and backend orders
  const [workOrders, setWorkOrders] = useState<WorkOrderItem[]>(() => generateScheduleOrders(orders));

  // Keep Work Orders schedule synchronized whenever orders are loaded, refreshed, or newly created
  useEffect(() => {
    if (!orders || orders.length === 0) return;
    setWorkOrders((prev) => syncOrdersWithSchedule(orders, prev));
  }, [orders]);

  // Trigger feedback notification toast
  const showToast = (message: string) => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    setNotification(message);
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Toggle work order collapse/expand
  const toggleExpand = (woId: string) => {
    setWorkOrders((prev) =>
      prev.map((wo) => (wo.id === woId ? { ...wo, expanded: !wo.expanded } : wo))
    );
  };

  // Work Centers state & grouping (for Work centers mode)
  const [expandedWorkCenters, setExpandedWorkCenters] = useState<Record<string, boolean>>({
    "WC-AC-01": true,
    "WC-AC-02": true,
    "WC-RF-01": true,
    "WC-WM-01": true,
    "WC-TV-01": true,
    "WC-QC-01": true,
  });

  const toggleWorkCenterExpand = (wcId: string) => {
    setExpandedWorkCenters((prev) => ({
      ...prev,
      [wcId]: prev[wcId] === false ? true : false,
    }));
  };

  // In Week view, all 21 continuous days are directly rendered in the timeline
  const visibleWorkOrders = useMemo(() => {
    if (granularity === "Week") {
      return workOrders;
    }
    if (granularity === "Month") {
      if (timeOffset === 0) return workOrders;
      return [];
    }
    if (timeOffset === 0) return workOrders;
    return [];
  }, [workOrders, granularity, timeOffset]);

  const workCenterGroups = useMemo(() => {
    const centers = [
      { id: "WC-AC-01", code: "WC-AC-01", name: "AC Tube Bending & Heat Exchanger", desc: "CNC copper tube forming, fin matrix expansion & brazing" },
      { id: "WC-AC-02", code: "WC-AC-02", name: "Inverter & Refrigerant Vacuum Bay", desc: "Compressor staging, R32 charge & vacuum leak check" },
      { id: "WC-RF-01", code: "WC-RF-01", name: "Refrigerator Cabinet & PU Foaming", desc: "Cabinet roll forming, HIPS liner & rigid PU injection" },
      { id: "WC-WM-01", code: "WC-WM-01", name: "Washing Machine Drum & Motor Integration", desc: "PP tub injection, stainless spin drum & BLDC motor" },
      { id: "WC-TV-01", code: "WC-TV-01", name: "SMT & Display Panel Lamination", desc: "Mainboard SMT pick & place, backlight matrix & open-cell" },
      { id: "WC-QC-01", code: "WC-QC-01", name: "High-Voltage Dielectric Gate", desc: "Dielectric hi-pot safety, acoustic noise & run tests" },
    ];

    return centers.map((wc) => {
      const ops: { wo: WorkOrderItem; op: OperationItem }[] = [];
      visibleWorkOrders.forEach((wo) => {
        wo.operations.forEach((op) => {
          if (op.workCenter && op.workCenter.startsWith(wc.id)) {
            ops.push({ wo, op });
          }
        });
      });

      return {
        ...wc,
        expanded: expandedWorkCenters[wc.id] ?? true,
        operations: ops,
      };
    });
  }, [visibleWorkOrders, expandedWorkCenters]);

  // Currently inspected operation in the right panel
  const inspectedData = useMemo(() => {
    if (!selectedOpKey) return null;
    const wo = workOrders.find((w) => w.id === selectedOpKey.workOrderId);
    if (!wo) return null;
    const op = wo.operations.find((o) => o.id === selectedOpKey.opId);
    if (!op) return null;
    const opIndex = wo.operations.findIndex((o) => o.id === selectedOpKey.opId);
    const prevOp = opIndex > 0 ? wo.operations[opIndex - 1] : null;
    const nextOp = opIndex < wo.operations.length - 1 ? wo.operations[opIndex + 1] : null;

    return { wo, op, opIndex, prevOp, nextOp };
  }, [selectedOpKey, workOrders]);

  // Update operation progress (+10% or Mark Done)
  const updateOperationProgress = (workOrderId: string, opId: string, newProgress: number) => {
    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.id !== workOrderId) return wo;
        return {
          ...wo,
          operations: wo.operations.map((op) => {
            if (op.id !== opId) return op;
            const prog = Math.min(100, Math.max(0, newProgress));
            const colorScheme = prog === 100 ? "emerald" : prog > 0 ? "blue" : "stone";
            return {
              ...op,
              progress: prog,
              colorScheme,
            };
          }),
        };
      })
    );
  };

  // Assign technician to inspected operation
  const assignTechnician = (workOrderId: string, opId: string, staffId: string) => {
    const staff = STAFF_ROSTER.find((s) => s.id === staffId);
    if (!staff) return;

    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.id !== workOrderId) return wo;
        return {
          ...wo,
          operations: wo.operations.map((op) => {
            if (op.id !== opId) return op;
            return {
              ...op,
              techInitial: staff.initial,
              techName: staff.name,
              techColor: staff.color,
            };
          }),
        };
      })
    );
    showToast(`${opId}: Assignment updated to ${staff.name}`);
  };

  // Shift operation start day forward or backward (+1 or -1)
  const shiftOperation = (workOrderId: string, opId: string, delta: number) => {
    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.id !== workOrderId) return wo;
        return {
          ...wo,
          operations: wo.operations.map((op) => {
            if (op.id !== opId) return op;
            const maxDays = granularity === "Month" ? 28 : granularity === "Quarter" ? 7 : 7;
            const newStart = Math.max(0, Math.min(maxDays - op.durationDays, op.startDay + delta));
            
            let label = delta > 0 ? "shifted forward" : "shifted back";
            if (granularity === "Week") {
              const dayFrom = timelineConfig.cols[newStart]?.topLabel || "Day";
              const dayTo = timelineConfig.cols[Math.min(6, newStart + op.durationDays - 1)]?.topLabel || "Day";
              label = `rescheduled to ${dayFrom} – ${dayTo}`;
            } else if (granularity === "Month") {
              const dayFrom = timelineConfig.cols[7 + newStart]?.bottomLabel || "Day";
              label = `rescheduled to Day ${dayFrom}`;
            } else {
              label = `rescheduled`;
            }

            showToast(`${wo.id}: ${op.name} ${label}`);
            return {
              ...op,
              startDay: newStart,
            };
          }),
        };
      })
    );
  };

  // Drag and Drop handlers
  const handleDragStart = (workOrderId: string, opId: string, currentStart: number) => {
    setDraggingOp({ workOrderId, opId, origStartDay: currentStart });
  };

  const handleDragOverCol = (e: React.DragEvent, colIndex: number) => {
    e.preventDefault();
    if (dragOverCol !== colIndex) {
      setDragOverCol(colIndex);
    }
  };

  const handleDropOnCol = (targetCol: number) => {
    if (!draggingOp) return;
    const { workOrderId, opId } = draggingOp;

    setWorkOrders((prev) =>
      prev.map((wo) => {
        if (wo.id !== workOrderId) return wo;
        return {
          ...wo,
          operations: wo.operations.map((op) => {
            if (op.id !== opId) return op;
            
            let clampedStart = targetCol;
            if (granularity === "Month") {
              clampedStart = Math.max(0, Math.min(28 - op.durationDays, targetCol - 7));
            } else if (granularity === "Quarter") {
              clampedStart = Math.max(0, Math.min(6, (targetCol - 4) * 2));
            } else {
              clampedStart = Math.max(0, Math.min(7 - op.durationDays, targetCol));
            }

            const dayFrom = timelineConfig.cols[targetCol]?.topLabel || "Target";
            showToast(`${wo.id}: ${op.name} rescheduled to ${dayFrom}`);
            return {
              ...op,
              startDay: clampedStart,
            };
          }),
        };
      })
    );

    setDraggingOp(null);
    setDragOverCol(null);
  };

  // Compute live capacity dynamically based on active operations & granularity
  const capacityRowData = useMemo(() => {
    if (visibleWorkOrders.length === 0) {
      if (granularity === "Week") return new Array(21).fill(0);
      if (granularity === "Month") return new Array(35).fill(0);
      return new Array(13).fill(0);
    }

    if (granularity === "Week") {
      const load = new Array(21).fill(0);
      visibleWorkOrders.forEach((wo) => {
        wo.operations.forEach((op) => {
          for (let d = op.startDay; d < op.startDay + op.durationDays; d++) {
            if (d >= 0 && d < 21) load[d] += 1;
          }
        });
      });
      return load;
    }

    if (granularity === "Month") {
      const base = [
        2, 2, 3, 2, 2, 1, 1,
        3, 4, 3, 4, 5, 3, 2, // Week 2
        2, 3, 4, 3, 2, 1, 1,
        2, 2, 2, 2, 3, 1, 0,
        1, 2, 2, 2, 1, 0, 0
      ];
      visibleWorkOrders.forEach((wo) => {
        if (wo.expanded) {
          wo.operations.forEach((op) => {
            const start = 7 + op.startDay;
            for (let d = start; d < start + op.durationDays; d++) {
              if (d >= 0 && d < 35) base[d] = Math.min(8, base[d] + 1);
            }
          });
        }
      });
      return base;
    }

    return [2, 2, 2, 2, 5, 4, 2, 1, 0, 0, 0, 0, 0];
  }, [visibleWorkOrders, granularity]);

  // Position & width styles for operation bar
  const getOpBarStyle = (op: OperationItem) => {
    if (granularity === "Week") {
      const colStart = Math.max(0, Math.min(20, op.startDay));
      const colSpan = Math.max(1, op.durationDays);
      return {
        left: `${(colStart / 21) * 100}%`,
        width: `${(colSpan / 21) * 100}%`,
        paddingLeft: "3px",
        paddingRight: "3px",
      };
    }
    if (granularity === "Month") {
      const colStart = 7 + op.startDay - timeOffset * 35;
      const colSpan = Math.max(1, op.durationDays);
      if (colStart + colSpan <= 0 || colStart >= 35) {
        return { display: "none" };
      }
      return {
        left: `${(Math.max(0, colStart) / 35) * 100 + 0.2}%`,
        width: `${Math.max(4.5, (colSpan / 35) * 100)}%`,
        minWidth: "120px",
      };
    }
    // Quarter view (13 weeks) - distribute based on startDay and duration
    const weekStart = 4 + (op.startDay >= 5 ? 1 : op.startDay >= 2 ? 0.35 : 0);
    const weekSpan = Math.max(1, op.durationDays >= 4 ? 2 : op.durationDays >= 2 ? 1.4 : 1);
    return {
      left: `${(weekStart / 13) * 100 + 0.2}%`,
      width: `${(weekSpan / 13) * 100 - 0.4}%`,
      minWidth: "135px",
    };
  };

  // Compute responsive SVG connector coordinates between consecutive operations ("benang alur proses")
  const getOpConnectorCoords = (op: OperationItem, nextOp: OperationItem, idx: number, rowHeight = 48) => {
    let x1 = 0;
    let x2 = 0;
    if (granularity === "Week") {
      x1 = ((op.startDay + op.durationDays) / 21) * 1000;
      x2 = (nextOp.startDay / 21) * 1000;
    } else if (granularity === "Month") {
      x1 = Math.min(1000, Math.max(0, ((7 + op.startDay + op.durationDays - timeOffset * 35) / 35) * 1000));
      x2 = Math.min(1000, Math.max(0, ((7 + nextOp.startDay - timeOffset * 35) / 35) * 1000));
    } else {
      const w1 = 4 + (op.startDay >= 5 ? 1 : op.startDay >= 2 ? 0.35 : 0) + (op.durationDays >= 4 ? 2 : op.durationDays >= 2 ? 1.4 : 1);
      const w2 = 4 + (nextOp.startDay >= 5 ? 1 : nextOp.startDay >= 2 ? 0.35 : 0);
      x1 = Math.min(1000, Math.max(0, (w1 / 13) * 1000));
      x2 = Math.min(1000, Math.max(0, (w2 / 13) * 1000));
    }
    const y1 = idx * rowHeight + rowHeight / 2;
    const y2 = (idx + 1) * rowHeight + rowHeight / 2;
    return { x1, y1, x2, y2 };
  };

  // Position & width for main order progress bar & collapsed bar
  const getMainOrderBarStyle = (wo: WorkOrderItem) => {
    if (granularity === "Week") {
      const leftPct = (Math.max(0, wo.startDay) / 21) * 100;
      const widthPct = (Math.max(1, wo.durationDays) / 21) * 100;
      return {
        left: `${leftPct}%`,
        width: `${widthPct}%`,
      };
    }
    if (granularity === "Month") {
      const colStart = 7 + wo.startDay - timeOffset * 35;
      const colSpan = Math.max(2, wo.durationDays);
      if (colStart + colSpan <= 0 || colStart >= 35) {
        return { display: "none" };
      }
      return {
        left: `${(Math.max(0, colStart) / 35) * 100}%`,
        width: `${(colSpan / 35) * 100}%`,
        minWidth: "180px",
      };
    }
    // Quarter view
    const weekStart = 4;
    const weekSpan = wo.durationDays >= 5 ? 2.5 : 1.8;
    return {
      left: `${(weekStart / 13) * 100}%`,
      width: `${(weekSpan / 13) * 100}%`,
      minWidth: "200px",
    };
  };

  const displayLabel = useMemo(() => {
    if (granularity === "Week") {
      const startW = timelineConfig.cols[activeScrollWeek * 7]?.dateObj || timelineConfig.cols[0]?.dateObj;
      const endW = timelineConfig.cols[activeScrollWeek * 7 + 6]?.dateObj || timelineConfig.cols[6]?.dateObj;
      if (startW && endW) {
        const sm = startW.toLocaleDateString("en-US", { month: "short" });
        const em = endW.toLocaleDateString("en-US", { month: "short" });
        return sm === em 
          ? `${sm} ${startW.getDate()} – ${endW.getDate()}, ${endW.getFullYear()}`
          : `${sm} ${startW.getDate()} – ${em} ${endW.getDate()}, ${endW.getFullYear()}`;
      }
    }
    return timelineConfig.label;
  }, [granularity, activeScrollWeek, timelineConfig]);

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      
      {/* ── Toast Feedback Notification ── */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white rounded-2xl shadow-xl text-xs font-semibold border border-stone-700 animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* ── Sub-toolbar: Date Navigator, Granularity, Grouping & Views ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#18181B] p-2.5 sm:p-3 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-2xs">
        
        {/* Left: Date navigation (< Date Range > Today) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handlePrevInterval}
            className="w-8 h-8 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-slate-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Previous interval"
            title="Shift back 1 week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-stone-200 px-1 sm:px-2 select-none tracking-tight">
            {displayLabel}
          </span>

          <button
            type="button"
            onClick={handleNextInterval}
            className="w-8 h-8 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-slate-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Next interval"
            title="Shift forward 1 week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleTodayClick}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border border-stone-200 dark:border-stone-700 text-slate-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer ml-1"
          >
            <Calendar className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span>Today</span>
          </button>
        </div>

        {/* Center: Granularity (Week / Month / Quarter) */}
        <div className="flex items-center p-0.5 bg-[#EBEAE5] dark:bg-stone-800 rounded-full border border-stone-300/80 dark:border-stone-700 text-xs font-semibold">
          {(["Week", "Month", "Quarter"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => handleGranularityChange(g)}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                granularity === g
                  ? "bg-white dark:bg-stone-900 text-slate-900 dark:text-white shadow-2xs font-bold"
                  : "text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Right: Grouping & Views */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-[#EBEAE5] dark:bg-stone-800 rounded-full border border-stone-300/80 dark:border-stone-700 text-xs font-semibold">
            {(["Orders", "Work centers"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  mode === m
                    ? "bg-white dark:bg-stone-900 text-slate-900 dark:text-white shadow-2xs font-bold"
                    : "text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center p-0.5 bg-[#EBEAE5] dark:bg-stone-800 rounded-full border border-stone-300/80 dark:border-stone-700 text-xs font-semibold">
            {(["Timeline", "Agenda"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  view === v
                    ? "bg-white dark:bg-stone-900 text-slate-900 dark:text-white shadow-2xs font-bold"
                    : "text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Operational Status Sub-Banner ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#18181B] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl text-xs text-slate-700 dark:text-stone-300 shadow-2xs">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="font-semibold text-slate-900 dark:text-stone-100">3 operations running</span>
        <span className="text-stone-400 dark:text-stone-500">across 3 work centers</span>
        <span className="text-stone-300 dark:text-stone-700">·</span>
        <span>5 start in the next two days</span>
        <span className="text-stone-300 dark:text-stone-700">·</span>
        <span className="font-semibold text-rose-600 dark:text-rose-400">WO-2043 is behind plan</span>
      </div>

      {/* ── Main View: Split Layout (Gantt Chart 75% + Dynamic Sidebar 25%) ── */}
      {view === "Timeline" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          
          {/* ── Left 3 Cols: Interactive Gantt Schedule Grid ── */}
          <div className="lg:col-span-3 bg-white dark:bg-[#18181B] rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-xs overflow-hidden">
            
            <div className="flex">
              {/* Fixed Left Column: Work Order Descriptors & Collapsible Controls */}
              <div className="w-64 sm:w-72 shrink-0 border-r border-stone-200/80 dark:border-stone-800 flex flex-col bg-white dark:bg-[#18181B] z-20 sticky left-0 shadow-[2px_0_8px_rgba(0,0,0,0.04)] dark:shadow-[3px_0_12px_rgba(0,0,0,0.4)]">
                
                {/* Header cell */}
                <div className="h-14 border-b border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/40 px-3 sm:px-4 flex items-center">
                  <span className="font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider text-[11px]">
                    {mode === "Orders" ? "Work Order" : "Work Center"}
                  </span>
                </div>

                {/* Capacity Label cell */}
                <div className="h-9 border-b border-stone-100 dark:border-stone-800/80 px-3 sm:px-4 flex items-center bg-stone-50/30 dark:bg-stone-900/20">
                  <span className="text-slate-400 dark:text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                    Capacity
                  </span>
                </div>

                {/* Left Row Labels (Orders mode vs Work centers mode) */}
                <div className="divide-y divide-stone-100 dark:divide-stone-800/60 flex-1">
                  {visibleWorkOrders.length === 0 ? (
                    <div className="min-h-[260px] flex-1 bg-white dark:bg-[#18181B]" />
                  ) : mode === "Orders" ? (
                    visibleWorkOrders.map((wo) => (
                      <div key={wo.id} className="transition-colors hover:bg-stone-50/40 dark:hover:bg-stone-900/20">
                        {/* Order master row header */}
                        <div className="h-12 border-b border-stone-200/80 dark:border-stone-800 px-3 sm:px-4 flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => toggleExpand(wo.id)}
                            className="p-1 rounded-md text-stone-400 hover:text-slate-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
                            title={wo.expanded ? "Collapse operations" : "Expand operations"}
                          >
                            {wo.expanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Circular Ring Progress Icon */}
                          <div className="relative w-4 h-4 shrink-0">
                            <svg className="w-4 h-4 -rotate-90" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="9" className="stroke-slate-200 dark:stroke-stone-700" strokeWidth="3" fill="none" />
                              <circle
                                cx="12"
                                cy="12"
                                r="9"
                                className="stroke-blue-600 dark:stroke-blue-400"
                                strokeWidth="3"
                                strokeDasharray="56.5"
                                strokeDashoffset={`${
                                  56.5 *
                                  (1 -
                                    (wo.operations.reduce((a, b) => a + b.progress, 0) /
                                      (wo.operations.length || 1)) /
                                      100)
                                }`}
                                strokeLinecap="round"
                                fill="none"
                              />
                            </svg>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                onClick={() => setSelectedWorkOrderModal(wo)}
                                className="font-bold text-xs text-slate-900 dark:text-stone-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer"
                                title="Klik untuk membuka detail Work Order"
                              >
                                {wo.id}
                              </span>
                              {wo.rush && (
                                <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono">
                                  Rush
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                              {wo.model}
                            </p>
                          </div>
                        </div>

                        {/* Sub-operations row labels */}
                        {wo.expanded && (
                          <div className="divide-y divide-stone-200/80 dark:divide-stone-800">
                            {wo.operations.map((op) => {
                              const isSelected = selectedOpKey?.workOrderId === wo.id && selectedOpKey?.opId === op.id;
                              return (
                                <div 
                                  key={op.id} 
                                  onClick={() => setSelectedOpKey({ workOrderId: wo.id, opId: op.id })}
                                  className={`h-12 px-4 flex items-center gap-3 cursor-pointer transition-colors border-b border-stone-200/80 dark:border-stone-800 ${
                                    isSelected ? "bg-blue-50/80 dark:bg-blue-950/40" : "hover:bg-stone-50/60 dark:hover:bg-stone-900/40"
                                  }`}
                                  title="Klik untuk menginspeksi operasi ini di panel kanan"
                                >
                                  <span
                                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${op.techColor}`}
                                  >
                                    {op.techInitial}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <span className={`font-semibold text-xs truncate block ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-stone-200"}`}>
                                      {op.name}
                                    </span>
                                    <span className="text-[11px] text-stone-400 dark:text-stone-500 font-mono block truncate">
                                      {op.statusText}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    workCenterGroups.map((wc) => (
                      <div key={wc.id} className="transition-colors hover:bg-stone-50/40 dark:hover:bg-stone-900/20">
                        {/* Work Center Master Row Header */}
                        <div className="h-12 px-3 sm:px-4 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleWorkCenterExpand(wc.id)}
                            className="p-1 rounded-md text-stone-400 hover:text-slate-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
                            title={wc.expanded ? "Collapse work center" : "Expand work center"}
                          >
                            {wc.expanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <div className="w-4 h-4 rounded-md bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                            <Wrench className="w-2.5 h-2.5 text-stone-500 dark:text-stone-400" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900 dark:text-stone-100 truncate">
                                {wc.name}
                              </span>
                            </div>
                            <p className="text-[10px] text-stone-500 dark:text-stone-400">
                              {wc.operations.length} {wc.operations.length === 1 ? "operation" : "operations"} in view
                            </p>
                          </div>
                        </div>

                        {/* Child operations under this Work Center */}
                        {wc.expanded && (
                          <div className="divide-y divide-stone-200/80 dark:divide-stone-800 bg-stone-50/30 dark:bg-stone-950/20">
                            {wc.operations.map(({ wo, op }) => {
                              const isSelected = selectedOpKey?.workOrderId === wo.id && selectedOpKey?.opId === op.id;
                              return (
                                <div
                                  key={`${wc.id}-${wo.id}-${op.id}`}
                                  onClick={() => setSelectedOpKey({ workOrderId: wo.id, opId: op.id })}
                                  className={`h-12 pl-7 pr-3 flex items-center gap-2 cursor-pointer transition-colors border-b border-stone-200/80 dark:border-stone-800 ${
                                    isSelected ? "bg-blue-50/80 dark:bg-blue-950/40" : "hover:bg-stone-100/60 dark:hover:bg-stone-900/40"
                                  }`}
                                  title="Klik untuk menginspeksi operasi ini di panel kanan"
                                >
                                  <span
                                    className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${op.techColor}`}
                                  >
                                    {op.techInitial}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <span className={`font-semibold text-xs truncate block ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-stone-200"}`}>
                                      {wo.id} · {op.name}
                                    </span>
                                    <span className="text-[10px] text-stone-400 dark:text-stone-500 block truncate">
                                      {op.statusText}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Horizontally Scrollable Timeline Area with Standard Left-Right Scroller */}
              <div 
                ref={timelineScrollRef}
                onScroll={handleTimelineScroll}
                className="flex-1 timeline-scroll-container relative scrollbar-thin"
              >
                <div className={`${timelineConfig.gridMinWidth} relative min-h-[460px]`}>
                  
                  {/* Column Headers */}
                  <div 
                    className="h-14 border-b border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/40 grid text-center items-center"
                    style={{ gridTemplateColumns: `repeat(${timelineConfig.totalCols}, minmax(0, 1fr))` }}
                  >
                    {timelineConfig.cols.map((d) => {
                      const isHighlight = granularity === "Week" && d.colIndex >= 1 && d.colIndex <= 3;
                      return (
                        <div
                          key={d.colIndex}
                          className={`h-full border-r border-stone-200/80 dark:border-stone-800 flex flex-col items-center justify-center px-0.5 ${
                            isHighlight ? "bg-sky-50/70 dark:bg-sky-950/30" : ""
                          }`}
                        >
                          <span 
                            className={`uppercase tracking-wider ${
                              granularity === "Month"
                                ? "text-[9px] font-bold text-slate-400 dark:text-stone-500"
                                : granularity === "Quarter"
                                ? "text-[10px] font-bold text-slate-700 dark:text-stone-300 truncate w-full"
                                : "text-[11px] font-bold text-slate-400 dark:text-stone-500"
                            } ${d.isToday ? "text-amber-600 dark:text-amber-400 font-extrabold" : ""}`}
                          >
                            {d.topLabel}
                          </span>

                          <span
                            className={`font-mono mt-0.5 ${
                              granularity === "Month"
                                ? "text-[10px] font-bold"
                                : granularity === "Quarter"
                                ? "text-[8px] font-semibold tracking-wider text-slate-400 dark:text-stone-500 uppercase"
                                : "text-xs font-bold"
                            } ${
                              d.isToday
                                ? "text-amber-600 dark:text-amber-400 font-extrabold"
                                : "text-slate-800 dark:text-stone-200"
                            }`}
                          >
                            {d.bottomLabel}
                          </span>

                          {d.isToday && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Capacity Row */}
                  <div 
                    className="h-10 border-b border-stone-200/80 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-900/20 grid text-center items-center text-[11px] font-semibold"
                    style={{ gridTemplateColumns: `repeat(${timelineConfig.totalCols}, minmax(0, 1fr))` }}
                  >
                    {capacityRowData.map((cap, i) => {
                      const isHighlight = granularity === "Week" && i >= 1 && i <= 3;
                      const isHatch = granularity === "Week" && (i % 7 === 0 || i % 7 === 6 || i >= 14);
                      return (
                        <div
                          key={i}
                          className={`h-full border-r border-stone-200/80 dark:border-stone-800 flex items-center justify-between px-2.5 sm:px-3.5 ${
                            isHighlight ? "bg-sky-50/50 dark:bg-sky-950/20" : ""
                          }`}
                          style={
                            isHatch
                              ? {
                                  backgroundImage:
                                    "repeating-linear-gradient(135deg, rgba(203, 213, 225, 0.25) 0px, rgba(203, 213, 225, 0.25) 2px, transparent 2px, transparent 10px)",
                                }
                              : undefined
                          }
                        >
                          <span
                            className={`w-1 h-3 rounded-xs shrink-0 ${
                              cap >= 5 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                          />
                          {granularity !== "Month" && (
                            <span className="font-mono text-slate-700 dark:text-stone-300 text-xs font-bold shrink-0">
                              {cap}/8
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Main Gantt Rows & Timeline Area */}
                  <div className="relative divide-y divide-stone-200/80 dark:border-stone-800">
                    
                    {/* Live Time Vertical Red/Amber Marker Line */}
                    {timelineConfig.activeColIndex >= 0 && (
                      <div
                        aria-label="Current real time indicator"
                        className="absolute top-0 bottom-0 pointer-events-none z-30 flex flex-col items-center transition-all"
                        style={{
                          left: `${((timelineConfig.activeColIndex + 0.5) / timelineConfig.totalCols) * 100}%`,
                        }}
                      >
                        <div className="w-0.5 h-full bg-amber-600/90 dark:bg-amber-500/90 shadow-xs" />
                      </div>
                    )}

                    {/* Timeline Rows: Orders mode vs Work centers mode */}
                    {mode === "Orders" ? (
                      visibleWorkOrders.map((wo) => (
                        <div key={wo.id} className="transition-colors hover:bg-stone-50/40 dark:hover:bg-stone-900/20">
                          {/* Master Order Timeline Cell */}
                          <div 
                            className="h-12 relative items-center grid border-b border-stone-200/80 dark:border-stone-800"
                            style={{ gridTemplateColumns: `repeat(${timelineConfig.totalCols}, minmax(0, 1fr))` }}
                          >
                            {/* Column drop backgrounds */}
                            {timelineConfig.cols.map((col) => {
                              const isHighlight = granularity === "Week" && col.colIndex >= 1 && col.colIndex <= 3;
                              const isHatch = granularity === "Week" && (col.colIndex % 7 === 0 || col.colIndex % 7 === 6 || col.colIndex >= 14);
                              return (
                                <div 
                                  key={col.colIndex}
                                  className={`h-full border-r border-stone-200/80 dark:border-stone-800/80 ${
                                    isHighlight ? "bg-sky-50/40 dark:bg-sky-950/20" : ""
                                  }`}
                                  style={
                                    isHatch
                                      ? {
                                          backgroundImage:
                                            "repeating-linear-gradient(135deg, rgba(203, 213, 225, 0.25) 0px, rgba(203, 213, 225, 0.25) 2px, transparent 2px, transparent 10px)",
                                        }
                                      : undefined
                                  }
                                />
                              );
                            })}

                            {/* When Expanded: Render the progress bar across timeline */}
                            {wo.expanded && (
                              <div
                                className="absolute h-2.5 bg-slate-200 dark:bg-stone-700/80 rounded-full overflow-hidden shadow-2xs z-10"
                                style={getMainOrderBarStyle(wo)}
                              >
                                <div
                                  className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-all"
                                  style={{
                                    width: `${
                                      Math.round(
                                        wo.operations.reduce((acc, o) => acc + o.progress, 0) /
                                          (wo.operations.length || 1)
                                      )
                                    }%`,
                                  }}
                                />
                              </div>
                            )}

                            {/* When Collapsed: Full clickable Order Bar */}
                            {!wo.expanded && (
                              <div
                                className="absolute h-7 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600/90 rounded-full transition-all shadow-xs cursor-pointer flex items-center px-3 z-10"
                                style={getMainOrderBarStyle(wo)}
                                onClick={() => setSelectedWorkOrderModal(wo)}
                                title="Klik untuk membuka detail Work Order"
                              >
                                <div className="flex items-center gap-1.5 truncate text-white">
                                  <span className="font-mono text-[10px] font-extrabold bg-white/20 px-1.5 py-0.2 rounded shrink-0">
                                    {wo.id}
                                  </span>
                                  <span className="text-xs font-bold truncate">
                                    {wo.model.split("·")[1]?.trim() || wo.model}
                                  </span>
                                  {wo.rush && (
                                    <span className="text-[8px] font-bold uppercase tracking-wider bg-amber-400 text-amber-950 px-1 rounded font-mono shrink-0">
                                      Rush
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Expanded Sub-operations Timeline Rows with Connecting SVG silk threads */}
                          {wo.expanded && (
                            <div className="relative divide-y divide-stone-200/80 dark:divide-stone-800 bg-stone-50/20 dark:bg-stone-950/20">
                              {/* Responsive SVG Silk Connecting Threads Overlay between sequential operations */}
                              {wo.operations.length > 1 && (
                                <svg
                                  className="absolute inset-0 w-full h-full pointer-events-none z-5 overflow-visible"
                                  viewBox={`0 0 1000 ${wo.operations.length * 48}`}
                                  preserveAspectRatio="none"
                                >
                                  <defs>
                                    <linearGradient id={`thread-grad-${wo.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.85" />
                                      <stop offset="100%" stopColor="#64748b" stopOpacity="0.95" />
                                    </linearGradient>
                                  </defs>
                                  {wo.operations.slice(0, -1).map((op, idx) => {
                                    const nextOp = wo.operations[idx + 1];
                                    const { x1, y1, x2, y2 } = getOpConnectorCoords(op, nextOp, idx, 48);
                                    
                                    // Bezier curvature
                                    const dx = Math.abs(x2 - x1);
                                    const cx1 = x2 >= x1 ? x1 + Math.max(30, dx * 0.45) : x1 + 45;
                                    const cx2 = x2 >= x1 ? x2 - Math.max(30, dx * 0.45) : x2 - 45;

                                    return (
                                      <g key={`flow-${wo.id}-${op.id}-${nextOp.id}`}>
                                        {/* Subtle ambient shadow for high contrast on light/dark mode */}
                                        <path
                                          d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
                                          fill="none"
                                          stroke="rgba(0,0,0,0.06)"
                                          strokeWidth="3.5"
                                          strokeLinecap="round"
                                        />
                                        {/* Main Silk Thread ("Benang Alur Proses") */}
                                        <path
                                          d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
                                          fill="none"
                                          stroke={`url(#thread-grad-${wo.id})`}
                                          className="stroke-stone-400 dark:stroke-stone-500"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                        />
                                        {/* Predecessor Anchor Dot */}
                                        <circle
                                          cx={x1}
                                          cy={y1}
                                          r="3"
                                          className="fill-stone-500 dark:fill-stone-400"
                                        />
                                        {/* Successor Anchor Dot */}
                                        {x2 < 1000 && (
                                          <circle
                                            cx={x2}
                                            cy={y2}
                                            r="3"
                                            className="fill-stone-500 dark:fill-stone-400"
                                          />
                                        )}
                                      </g>
                                    );
                                  })}
                                </svg>
                              )}

                              {wo.operations.map((op) => {
                                const isSelected = selectedOpKey?.workOrderId === wo.id && selectedOpKey?.opId === op.id;
                                const isDone = op.progress === 100;
                                const isInProgress = op.progress > 0 && op.progress < 100;
                                const barStyle = getOpBarStyle(op);
                                const isBarVisible = barStyle.display !== "none";

                                return (
                                  <div
                                    key={op.id}
                                    className="h-12 relative grid items-center group border-b border-stone-200/80 dark:border-stone-800"
                                    style={{ gridTemplateColumns: `repeat(${timelineConfig.totalCols}, minmax(0, 1fr))` }}
                                  >
                                    {/* Column Drop Zones & Distinct Background Grid Separation */}
                                    {timelineConfig.cols.map((col) => {
                                      const isHighlight = granularity === "Week" && col.colIndex >= 1 && col.colIndex <= 3;
                                      const isHatch = granularity === "Week" && (col.colIndex % 7 === 0 || col.colIndex % 7 === 6 || col.colIndex >= 14);
                                      return (
                                        <div
                                          key={col.colIndex}
                                          onDragOver={(e) => handleDragOverCol(e, col.colIndex)}
                                          onDrop={() => handleDropOnCol(col.colIndex)}
                                          className={`h-full border-r border-stone-200/80 dark:border-stone-800/80 transition-colors ${
                                            dragOverCol === col.colIndex
                                              ? "bg-amber-100/50 dark:bg-amber-950/40"
                                              : isHighlight
                                              ? "bg-sky-50/35 dark:bg-sky-950/15"
                                              : ""
                                          }`}
                                          style={
                                            isHatch
                                              ? {
                                                  backgroundImage:
                                                    "repeating-linear-gradient(135deg, rgba(203, 213, 225, 0.22) 0px, rgba(203, 213, 225, 0.22) 2px, transparent 2px, transparent 10px)",
                                                }
                                              : undefined
                                          }
                                        />
                                      );
                                    })}

                                    {/* Draggable / Reschedulable Operation Bar */}
                                    {isBarVisible && (
                                      <div
                                        draggable
                                        onDragStart={() => handleDragStart(wo.id, op.id, op.startDay)}
                                        onClick={() => setSelectedOpKey({ workOrderId: wo.id, opId: op.id })}
                                        style={barStyle}
                                        className={`absolute h-8 rounded-xl flex items-center text-xs font-semibold shadow-2xs transition-all select-none cursor-grab active:cursor-grabbing group/bar z-10 overflow-hidden ${
                                          isSelected
                                            ? "ring-2 ring-blue-500 shadow-md scale-[1.01]"
                                            : ""
                                        } ${
                                          isDone
                                            ? "bg-[#dcfce7] hover:bg-[#bbf7d0] dark:bg-emerald-950/90 dark:hover:bg-emerald-900/90 border border-emerald-300 dark:border-emerald-700/80 text-emerald-950 dark:text-emerald-100 px-2 justify-between"
                                            : isInProgress
                                            ? "border border-blue-600 dark:border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 p-0"
                                            : "bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 border border-stone-300 dark:border-stone-600 text-slate-800 dark:text-stone-200 px-2 justify-between"
                                        }`}
                                        title={`${op.name} (${op.statusText || ""}) — Click to view details in inspector panel`}
                                      >
                                        {/* Render 100% Done Bar */}
                                        {isDone && (
                                          <>
                                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                                              {/* Left Nudge Control */}
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  shiftOperation(wo.id, op.id, -1);
                                                }}
                                                disabled={op.startDay <= 0}
                                                className="opacity-0 group-hover/bar:opacity-100 disabled:opacity-0 w-3.5 h-3.5 rounded flex items-center justify-center bg-black/15 hover:bg-black/30 text-emerald-950 dark:text-emerald-100 transition-opacity cursor-pointer shrink-0"
                                                title="Shift back 1 day"
                                              >
                                                <ChevronLeft className="w-2.5 h-2.5" />
                                              </button>
                                              <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400 shrink-0" />
                                              <span className="truncate text-xs font-bold text-emerald-950 dark:text-emerald-100">
                                                {op.name}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                                              <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-200/90 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200">
                                                100%
                                              </span>
                                              {/* Right Nudge Control */}
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  shiftOperation(wo.id, op.id, 1);
                                                }}
                                                disabled={op.startDay + op.durationDays >= (granularity === "Month" ? 28 : 7)}
                                                className="opacity-0 group-hover/bar:opacity-100 disabled:opacity-0 w-3.5 h-3.5 rounded flex items-center justify-center bg-black/15 hover:bg-black/30 text-emerald-950 dark:text-emerald-100 transition-opacity cursor-pointer shrink-0"
                                                title="Shift forward 1 day"
                                              >
                                                <ChevronRight className="w-2.5 h-2.5" />
                                              </button>
                                            </div>
                                          </>
                                        )}

                                        {/* Render In-Progress Split Bar (Solid Blue + Diagonal Hatched Section) */}
                                        {isInProgress && (
                                          <div className="w-full h-full flex items-stretch">
                                            {/* Solid Left Section with Progress Width */}
                                            <div
                                              className="h-full bg-blue-600 text-white flex items-center px-2 min-w-0 transition-all shrink-0"
                                              style={{ width: `${Math.max(25, Math.min(85, op.progress))}%` }}
                                            >
                                              {/* Left Nudge Control */}
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  shiftOperation(wo.id, op.id, -1);
                                                }}
                                                disabled={op.startDay <= 0}
                                                className="opacity-0 group-hover/bar:opacity-100 disabled:opacity-0 w-3.5 h-3.5 rounded flex items-center justify-center bg-black/25 hover:bg-black/40 text-white transition-opacity -ml-1 mr-1 cursor-pointer shrink-0"
                                                title="Shift back 1 day"
                                              >
                                                <ChevronLeft className="w-2.5 h-2.5" />
                                              </button>
                                              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0 mr-1" />
                                              <span className="truncate text-xs font-bold text-white">
                                                {op.name}
                                              </span>
                                            </div>

                                            {/* Diagonal Striped Hatch Right Section with Percentage Badge */}
                                            <div
                                              className="h-full flex-1 flex items-center justify-end px-2 min-w-0"
                                              style={{
                                                backgroundImage:
                                                  "repeating-linear-gradient(135deg, rgba(37, 99, 235, 0.45) 0px, rgba(37, 99, 235, 0.45) 2px, transparent 2px, transparent 7px)",
                                              }}
                                            >
                                              <div className="flex items-center gap-1 shrink-0">
                                                <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-700/90 text-white shadow-2xs">
                                                  {op.progress}%
                                                </span>
                                                {/* Right Nudge Control */}
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    shiftOperation(wo.id, op.id, 1);
                                                  }}
                                                  disabled={op.startDay + op.durationDays >= (granularity === "Month" ? 28 : 7)}
                                                  className="opacity-0 group-hover/bar:opacity-100 disabled:opacity-0 w-3.5 h-3.5 rounded flex items-center justify-center bg-black/20 hover:bg-black/40 text-blue-900 dark:text-blue-200 transition-opacity cursor-pointer shrink-0"
                                                  title="Shift forward 1 day"
                                                >
                                                  <ChevronRight className="w-2.5 h-2.5" />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {/* Render 0% Planned Bar */}
                                        {!isDone && !isInProgress && (
                                          <>
                                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                                              {/* Left Nudge Control */}
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  shiftOperation(wo.id, op.id, -1);
                                                }}
                                                disabled={op.startDay <= 0}
                                                className="opacity-0 group-hover/bar:opacity-100 disabled:opacity-0 w-3.5 h-3.5 rounded flex items-center justify-center bg-black/15 hover:bg-black/30 text-slate-800 dark:text-stone-200 transition-opacity cursor-pointer shrink-0"
                                                title="Shift back 1 day"
                                              >
                                                <ChevronLeft className="w-2.5 h-2.5" />
                                              </button>
                                              <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${op.techColor}`}>
                                                {op.techInitial}
                                              </span>
                                              <span className="truncate text-xs font-semibold text-slate-800 dark:text-stone-200">
                                                {op.name}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-stone-200/80 dark:bg-stone-700/80 text-stone-700 dark:text-stone-300">
                                                0%
                                              </span>
                                              {/* Right Nudge Control */}
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  shiftOperation(wo.id, op.id, 1);
                                                }}
                                                disabled={op.startDay + op.durationDays >= (granularity === "Month" ? 28 : 7)}
                                                className="opacity-0 group-hover/bar:opacity-100 disabled:opacity-0 w-3.5 h-3.5 rounded flex items-center justify-center bg-black/15 hover:bg-black/30 text-slate-800 dark:text-stone-200 transition-opacity cursor-pointer shrink-0"
                                                title="Shift forward 1 day"
                                              >
                                                <ChevronRight className="w-2.5 h-2.5" />
                                              </button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      workCenterGroups.map((wc) => (
                        <div key={`timeline-${wc.id}`} className="transition-colors hover:bg-stone-50/40 dark:hover:bg-stone-900/20">
                          {/* Work Center Master Row */}
                          <div 
                            className="h-12 relative items-center grid border-b border-stone-200/80 dark:border-stone-800"
                            style={{ gridTemplateColumns: `repeat(${timelineConfig.totalCols}, minmax(0, 1fr))` }}
                          >
                            {timelineConfig.cols.map((col) => {
                              const isHighlight = granularity === "Week" && col.colIndex >= 1 && col.colIndex <= 3;
                              const isHatch = granularity === "Week" && (col.colIndex % 7 === 0 || col.colIndex % 7 === 6 || col.colIndex >= 14);
                              return (
                                <div 
                                  key={col.colIndex}
                                  className={`h-full border-r border-stone-200/80 dark:border-stone-800/80 ${
                                    isHighlight ? "bg-sky-50/35 dark:bg-sky-950/15" : ""
                                  }`}
                                  style={
                                    isHatch
                                      ? {
                                          backgroundImage:
                                            "repeating-linear-gradient(135deg, rgba(203, 213, 225, 0.22) 0px, rgba(203, 213, 225, 0.22) 2px, transparent 2px, transparent 10px)",
                                        }
                                      : undefined
                                  }
                                />
                              );
                            })}
                          </div>

                          {/* Child operations under this Work Center */}
                          {wc.expanded && (
                            <div className="relative divide-y divide-stone-200/80 dark:divide-stone-800 bg-stone-50/20 dark:bg-stone-950/20">
                              {wc.operations.map(({ wo, op }) => {
                                const isSelected = selectedOpKey?.workOrderId === wo.id && selectedOpKey?.opId === op.id;
                                return (
                                  <div
                                    key={`timeline-op-${wc.id}-${wo.id}-${op.id}`}
                                    className="h-12 relative grid items-center group border-b border-stone-200/80 dark:border-stone-800"
                                    style={{ gridTemplateColumns: `repeat(${timelineConfig.totalCols}, minmax(0, 1fr))` }}
                                  >
                                    {/* Column Drop Zones */}
                                    {timelineConfig.cols.map((col) => {
                                      const isHighlight = granularity === "Week" && col.colIndex >= 1 && col.colIndex <= 3;
                                      const isHatch = granularity === "Week" && (col.colIndex % 7 === 0 || col.colIndex % 7 === 6 || col.colIndex >= 14);
                                      return (
                                        <div
                                          key={col.colIndex}
                                          onDragOver={(e) => handleDragOverCol(e, col.colIndex)}
                                          onDrop={() => handleDropOnCol(col.colIndex)}
                                          className={`h-full border-r border-stone-200/80 dark:border-stone-800/80 transition-colors ${
                                            dragOverCol === col.colIndex
                                              ? "bg-amber-100/40 dark:bg-amber-950/30"
                                              : isHighlight
                                              ? "bg-sky-50/35 dark:bg-sky-950/15"
                                              : ""
                                          }`}
                                          style={
                                            isHatch
                                              ? {
                                                  backgroundImage:
                                                    "repeating-linear-gradient(135deg, rgba(203, 213, 225, 0.22) 0px, rgba(203, 213, 225, 0.22) 2px, transparent 2px, transparent 10px)",
                                                }
                                              : undefined
                                          }
                                        />
                                      );
                                    })}

                                    {/* Operation Bar */}
                                    <div
                                      draggable
                                      onDragStart={() => handleDragStart(wo.id, op.id, op.startDay)}
                                      onClick={() => setSelectedOpKey({ workOrderId: wo.id, opId: op.id })}
                                      style={getOpBarStyle(op)}
                                      className={`absolute h-8 rounded-xl px-2 flex items-center justify-between text-xs font-semibold shadow-2xs transition-all select-none cursor-grab active:cursor-grabbing group/bar z-10 ${
                                        isSelected
                                          ? "ring-2 ring-blue-500 shadow-md scale-[1.01]"
                                          : ""
                                      } ${
                                        op.colorScheme === "emerald"
                                          ? "bg-emerald-100 hover:bg-emerald-200/90 dark:bg-emerald-950/85 dark:hover:bg-emerald-900/80 border border-emerald-400 dark:border-emerald-600/80 text-emerald-950 dark:text-emerald-100"
                                          : op.colorScheme === "blue"
                                          ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 border border-blue-500 dark:border-blue-400 text-white"
                                          : "bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 border border-stone-300 dark:border-stone-600 text-slate-800 dark:text-stone-200"
                                      }`}
                                      title={`${wo.id} · ${op.name} (${op.statusText || ""}) — Click to view details in inspector panel`}
                                    >
                                      {/* Left Nudge Control */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          shiftOperation(wo.id, op.id, -1);
                                        }}
                                        disabled={op.startDay <= 0}
                                        className="opacity-0 group-hover/bar:opacity-100 disabled:opacity-0 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded flex items-center justify-center bg-black/20 hover:bg-black/40 text-white transition-opacity -ml-1 cursor-pointer shrink-0"
                                        title="Shift back 1 day"
                                      >
                                        <ChevronLeft className="w-2.5 h-2.5" />
                                      </button>

                                      {/* Technician Avatar Badge */}
                                      <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 mr-1.5 shadow-2xs ${op.techColor}`}>
                                        {op.techInitial}
                                      </span>

                                      {/* Operation Name */}
                                      <div className="flex items-center gap-1 min-w-0 flex-1 truncate px-0.5">
                                        {op.rush && <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                                        <span className="truncate text-xs font-bold text-slate-900 dark:text-stone-100">
                                          {wo.id} · {op.name}
                                        </span>
                                      </div>

                                      {/* Progress Badge */}
                                      <div className="flex items-center gap-1 shrink-0 ml-1.5">
                                        <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-black/15 dark:bg-black/40 text-slate-900 dark:text-stone-100">
                                          {op.progress}%
                                        </span>

                                        {/* Right Nudge Control */}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            shiftOperation(wo.id, op.id, 1);
                                          }}
                                          disabled={op.startDay + op.durationDays >= (granularity === "Month" ? 28 : 7)}
                                          className="opacity-0 group-hover/bar:opacity-100 disabled:opacity-0 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded flex items-center justify-center bg-black/20 hover:bg-black/40 text-white transition-opacity -mr-1 cursor-pointer shrink-0"
                                          title="Shift forward 1 day"
                                        >
                                          <ChevronRight className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom helper footnote */}
            <div className="p-3 border-t border-stone-100 dark:border-stone-800/80 bg-stone-50/40 dark:bg-stone-900/30 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1">
                <GripHorizontal className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                Scroll horizontally to view other weeks · Click operation bars for step details
              </span>
              <span className="font-mono font-medium text-stone-400">
                Live Capacity Auto-Recalculate Active
              </span>
            </div>
          </div>

          {/* ── Right 1 Col: Dynamic Sidebar (Operation Inspector OR "On the floor now") ── */}
          <div className="lg:col-span-1 bg-white dark:bg-[#18181B] rounded-3xl border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 shadow-xs space-y-4">
            
            {inspectedData ? (
              /* ── INSPECTION PANEL (Matches media_1793029117851_d8bffa92.png) ── */
              <div className="space-y-4 animate-in fade-in duration-150">
                
                {/* Header with Back button and Operation name */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOpKey(null)}
                      className="w-7 h-7 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 hover:text-slate-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                      title="Back to production floor overview"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 truncate">
                      {inspectedData.wo.id} · {inspectedData.wo.model.split("·")[0]}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-stone-100 tracking-tight">
                      {inspectedData.op.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {inspectedData.op.workCenter || "Assembly Work Center"}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {inspectedData.op.progress === 100 ? "Completed" : inspectedData.op.progress > 0 ? "In progress" : "Scheduled"}
                    </span>
                    {(inspectedData.wo.rush || inspectedData.op.rush) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Rush
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                      {inspectedData.op.name.split(" ")[0]}
                    </span>
                  </div>
                </div>

                {/* Circular Gauge & Progress Actions */}
                <div className="flex items-center justify-between gap-3 p-3 bg-stone-50/70 dark:bg-stone-900/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                  {/* Gauge */}
                  <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        className="stroke-stone-200 dark:stroke-stone-800"
                        strokeWidth="6"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        className="stroke-blue-600 dark:stroke-blue-500 transition-all duration-300"
                        strokeWidth="6"
                        strokeDasharray={163.36}
                        strokeDashoffset={163.36 - (163.36 * inspectedData.op.progress) / 100}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-stone-100">
                        {inspectedData.op.progress}%
                      </span>
                      <span className="text-[9px] text-stone-400 uppercase font-medium -mt-0.5">
                        done
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: +10% and Mark Done */}
                  <div className="flex-1 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const nextProg = Math.min(100, inspectedData.op.progress + 10);
                        updateOperationProgress(inspectedData.wo.id, inspectedData.op.id, nextProg);
                        showToast(`${inspectedData.op.name}: Progress increased to ${nextProg}%`);
                      }}
                      className="w-full py-1.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>+ 10%</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updateOperationProgress(inspectedData.wo.id, inspectedData.op.id, 100);
                        showToast(`${inspectedData.op.name} marked as completed!`);
                      }}
                      className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark done</span>
                    </button>
                  </div>
                </div>

                {/* 4 Metric Cards (Starts, Finishes, Length, Expected) */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-stone-100 dark:border-stone-800">
                    <span className="text-[10px] text-stone-400 block font-medium">Starts</span>
                    <span className="font-semibold text-slate-800 dark:text-stone-200">
                      {formatGanttDate(inspectedData.op.startDay)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-stone-100 dark:border-stone-800">
                    <span className="text-[10px] text-stone-400 block font-medium">Finishes</span>
                    <span className="font-semibold text-slate-800 dark:text-stone-200">
                      {formatGanttDate(inspectedData.op.startDay + inspectedData.op.durationDays - 1)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-stone-100 dark:border-stone-800">
                    <span className="text-[10px] text-stone-400 block font-medium">Length</span>
                    <span className="font-semibold text-slate-800 dark:text-stone-200">
                      {inspectedData.op.durationDays} {inspectedData.op.durationDays === 1 ? "day" : "days"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-stone-100 dark:border-stone-800">
                    <span className="text-[10px] text-stone-400 block font-medium">Expected today</span>
                    <span className="font-semibold text-slate-800 dark:text-stone-200">
                      {inspectedData.op.progress >= 50 ? "On track" : "Behind"}
                    </span>
                  </div>
                </div>

                {/* Assigned to Dropdown */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider block">
                    Assigned To
                  </span>
                  <select
                    value={STAFF_ROSTER.find((s) => s.initial === inspectedData.op.techInitial)?.id || "st-1"}
                    onChange={(e) => assignTechnician(inspectedData.wo.id, inspectedData.op.id, e.target.value)}
                    className="w-full text-xs font-semibold p-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-slate-800 dark:text-stone-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {STAFF_ROSTER.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} — {staff.role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CHAIN (Predecessor & Successor Operations) */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider block">
                    Chain
                  </span>
                  
                  <div className="space-y-1.5 text-xs">
                    {inspectedData.prevOp ? (
                      <div
                        onClick={() => setSelectedOpKey({ workOrderId: inspectedData.wo.id, opId: inspectedData.prevOp!.id })}
                        className="p-2 rounded-xl bg-stone-50/70 dark:bg-stone-900/40 border border-stone-100 dark:border-stone-800/80 flex items-center justify-between cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-slate-800 dark:text-stone-200 truncate block">
                              {inspectedData.prevOp.name}
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              Comes before this · {inspectedData.prevOp.statusText}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-stone-50/40 dark:bg-stone-900/20 text-[11px] text-stone-400">
                        First operation in route
                      </div>
                    )}

                    {inspectedData.nextOp ? (
                      <div
                        onClick={() => setSelectedOpKey({ workOrderId: inspectedData.wo.id, opId: inspectedData.nextOp!.id })}
                        className="p-2 rounded-xl bg-stone-50/70 dark:bg-stone-900/40 border border-stone-100 dark:border-stone-800/80 flex items-center justify-between cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-2 h-2 rounded-full bg-stone-400 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-slate-800 dark:text-stone-200 truncate block">
                              {inspectedData.nextOp.name}
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              Waits for this · {inspectedData.nextOp.statusText}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-stone-50/40 dark:bg-stone-900/20 text-[11px] text-stone-400">
                        Final release operation
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons: [Work order] & [Details] */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWorkOrderModal(inspectedData.wo)}
                    className="flex-1 py-2 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-slate-800 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-stone-500" />
                    <span>Work order</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedOpModal({ wo: inspectedData.wo, op: inspectedData.op })}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>
                </div>

                {/* Footer shift note */}
                <div className="pt-1 flex items-center gap-2 text-[11px] text-stone-400 dark:text-stone-500">
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[9px] shrink-0 ${inspectedData.op.techColor}`}>
                    {inspectedData.op.techInitial}
                  </span>
                  <span className="truncate">
                    {inspectedData.op.techName || "Technician"} · 8 h shift assigned
                  </span>
                </div>
              </div>
            ) : (
              /* ── DEFAULT OVERVIEW PANEL ("On the floor now" & "Starting next") ── */
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-slate-900 dark:text-stone-100 font-bold text-sm mb-3">
                    <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>On the floor now</span>
                  </div>

                  <div className="space-y-3">
                    <div 
                      onClick={() => setSelectedOpKey({ workOrderId: "WO-2041", opId: "op-2041-1" })}
                      className="p-2.5 rounded-2xl bg-stone-50/70 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 space-y-1.5 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-slate-200 dark:bg-stone-800 text-[10px] font-bold flex items-center justify-center text-slate-700 dark:text-stone-300">
                            FW
                          </span>
                          <span className="font-bold text-slate-900 dark:text-stone-100">Copper tube bending</span>
                        </div>
                        <span className="font-mono text-slate-500 dark:text-stone-400 text-[11px]">WO-2041</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                        <span>PROD-AC-S10 · AC Split 1PK ×300</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% · done</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
                      </div>
                    </div>

                    <div 
                      onClick={() => setSelectedOpKey({ workOrderId: "WO-2042", opId: "op-2042-2" })}
                      className="p-2.5 rounded-2xl bg-stone-50/70 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 space-y-1.5 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-amber-100 dark:bg-amber-950 text-[10px] font-bold flex items-center justify-center text-amber-900 dark:text-amber-300">
                            AT
                          </span>
                          <span className="font-bold text-slate-900 dark:text-stone-100">Rotary compressor brazing</span>
                        </div>
                        <span className="font-mono text-slate-500 dark:text-stone-400 text-[11px]">WO-2042</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                        <span>PROD-AC-I10 · Inverter Split AC ×200</span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-stone-300">55%</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "55%" }} />
                      </div>
                    </div>

                    <div 
                      onClick={() => setSelectedOpKey({ workOrderId: "WO-2045", opId: "op-2045-2" })}
                      className="p-2.5 rounded-2xl bg-stone-50/70 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 space-y-1.5 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-sky-100 dark:bg-sky-950 text-[10px] font-bold flex items-center justify-center text-sky-900 dark:text-sky-300">
                            HK
                          </span>
                          <span className="font-bold text-slate-900 dark:text-stone-100">Backlight matrix bonding</span>
                        </div>
                        <span className="font-mono text-slate-500 dark:text-stone-400 text-[11px]">WO-2045</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                        <span>PROD-TV-32H · LED TV 32" ×500</span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-stone-300">55%</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "55%" }} />
                      </div>
                    </div>

                    <div 
                      onClick={() => setSelectedOpKey({ workOrderId: "WO-2044", opId: "op-2044-1" })}
                      className="p-2.5 rounded-2xl bg-stone-50/70 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800 space-y-1.5 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-950 text-[10px] font-bold flex items-center justify-center text-blue-900 dark:text-blue-300">
                            JB
                          </span>
                          <span className="font-bold text-slate-900 dark:text-stone-100">PP tub injection molding</span>
                        </div>
                        <span className="font-mono text-slate-500 dark:text-stone-400 text-[11px]">WO-2044</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                        <span>PROD-WM-TT7 · Top Load Washer ×120</span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-stone-300">100%</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: STARTING NEXT */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider block">
                    Starting Next
                  </span>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-stone-200">Rigid PU Foam Injection</p>
                          <p className="text-[10px] text-stone-400">WO-2043 · PROD-RF-2DR Refrigerator</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-stone-400 whitespace-nowrap">
                        Tomorrow
                      </span>
                    </div>

                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-stone-200">Drum Spin Seaming</p>
                          <p className="text-[10px] text-stone-400">WO-2044 · PROD-WM-TT7 Washer</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-stone-400 whitespace-nowrap">
                        Tomorrow
                      </span>
                    </div>

                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-stone-200">Continuous 4-Hour Burn-in</p>
                          <p className="text-[10px] text-stone-400">WO-2045 · PROD-TV-32H Smart TV</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-stone-400 whitespace-nowrap">
                        Tomorrow
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-center border-t border-stone-100 dark:border-stone-800">
                  <span className="text-[11px] italic text-stone-400 dark:text-stone-500">
                    Click an operation to inspect details
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Agenda Card Grid & Floor Telemetry View (Cadra Reference) ── */
        <div className="space-y-4">
          {/* Agenda Main Container: Card Grid (Left) + Floor Telemetry Sidebar (Right) */}
          <div className="flex flex-col xl:flex-row gap-5 items-start">
            
            {/* Work Order Cards Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 w-full">
              {workOrders.map((wo) => {
                const totalOps = wo.operations.length;
                const overallProgress = totalOps > 0 ? Math.round(wo.operations.reduce((acc, o) => acc + (o.progress || 0), 0) / totalOps) : 0;
                
                // SVG Progress Ring calculations
                const radius = 9;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (overallProgress / 100) * circumference;

                return (
                  <div
                    key={wo.id}
                    onClick={() => setSelectedWorkOrderModal(wo)}
                    className="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-start group"
                  >
                    {/* Header */}
                    <div>
                      {/* Top Row: Circular Progress Ring, WO-ID, and Status Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Circular Progress Ring with Percentage */}
                          <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
                            <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                              <circle
                                cx="12"
                                cy="12"
                                r={radius}
                                className="stroke-stone-200 dark:stroke-stone-800"
                                strokeWidth="2.8"
                                fill="transparent"
                              />
                              <circle
                                cx="12"
                                cy="12"
                                r={radius}
                                className={`${
                                  wo.status === "Done"
                                    ? "stroke-emerald-600 dark:stroke-emerald-500"
                                    : wo.status === "On hold"
                                    ? "stroke-amber-500 dark:stroke-amber-400"
                                    : "stroke-blue-600 dark:stroke-blue-500"
                                } transition-all duration-300`}
                                strokeWidth="2.8"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                fill="transparent"
                              />
                            </svg>
                            <span className="absolute text-[8px] font-bold text-slate-700 dark:text-stone-300">
                              {overallProgress}%
                            </span>
                          </div>

                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-stone-100 shrink-0">
                            {wo.id}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            wo.status === "Done"
                              ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                              : wo.status === "On hold"
                              ? "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                              : "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              wo.status === "Done"
                                ? "bg-emerald-500"
                                : wo.status === "On hold"
                                ? "bg-amber-500"
                                : "bg-blue-500"
                            }`}
                          />
                          {wo.status}
                        </span>
                      </div>

                      {/* Second Row: Model Title & Client/Date Range */}
                      <div className="mt-2.5">
                        <h4
                          className="font-bold text-xs text-slate-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate"
                          title={wo.shortName || wo.model}
                        >
                          {wo.shortName || (wo.model.includes("·") ? wo.model.split("·")[1]?.trim().split("(")[0]?.trim() : wo.model)}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          <span className="truncate max-w-[120px]" title={wo.clientOrDept}>
                            {wo.clientOrDept || "OEM Studio"}
                          </span>
                          <span className="shrink-0 text-[10px] text-stone-400 dark:text-stone-500 font-medium">
                            {wo.dateRange || `${formatGanttDate(wo.startDay)} – ${formatGanttDate(wo.startDay + wo.durationDays - 1)}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operations List */}
                    <div className="space-y-2.5 pt-2.5 mt-3 border-t border-stone-100 dark:border-stone-800/80">
                      {wo.operations.map((op) => (
                        <div key={op.id} className="space-y-1">
                          <div className="flex items-center justify-between gap-1.5 text-xs">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  op.progress === 100
                                    ? "bg-emerald-600 dark:bg-emerald-400"
                                    : op.progress > 0
                                    ? (op.rush ? "bg-rose-500" : "bg-blue-600 dark:bg-blue-400")
                                    : "bg-stone-300 dark:bg-stone-700"
                                }`}
                              />
                              <span className="font-semibold text-slate-800 dark:text-stone-200 truncate text-[11px]">
                                {op.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="w-10 sm:w-12 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    op.progress === 100
                                      ? "bg-emerald-600 dark:bg-emerald-500"
                                      : op.progress > 0
                                      ? (op.rush ? "bg-rose-600 dark:bg-rose-500" : "bg-blue-600 dark:bg-blue-500")
                                      : "bg-transparent"
                                  }`}
                                  style={{ width: `${op.progress}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono font-medium text-stone-500 dark:text-stone-400 w-7 text-right">
                                {op.progress}%
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-stone-400 dark:text-stone-500 pl-3">
                            <span className="truncate">{op.statusText}</span>
                            <span className="shrink-0 font-medium text-slate-600 dark:text-stone-400 ml-1">
                              {op.techName}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Floor Telemetry Sidebar */}
            <div className="w-full xl:w-72 2xl:w-80 shrink-0 bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 shadow-2xs space-y-4">
              
              {/* Section 1: On the floor now */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-stone-100 uppercase tracking-wider">
                    On the floor now
                  </h3>
                </div>

                <div className="space-y-3.5">
                  {/* Item 1 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                          AT
                        </span>
                        <span className="font-bold text-slate-900 dark:text-stone-100 text-xs">
                          Rotary compressor brazing
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
                        WO-2042
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                      <span>AC Inverter 1PK ×200</span>
                      <span className="font-semibold text-slate-700 dark:text-stone-300">55%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: "55%" }} />
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                          HK
                        </span>
                        <span className="font-bold text-slate-900 dark:text-stone-100 text-xs">
                          Backlight matrix bonding
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
                        WO-2045
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                      <span>LED TV 32" ×500</span>
                      <span className="font-semibold text-slate-700 dark:text-stone-300">55%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: "55%" }} />
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                          BA
                        </span>
                        <span className="font-bold text-slate-900 dark:text-stone-100 text-xs">
                          Drum spin seaming
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
                        WO-2044
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                      <span>Top Load Washer ×120</span>
                      <span className="font-semibold text-slate-700 dark:text-stone-300">50%</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: "50%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Starting Next */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2.5">
                <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                  Starting next
                </span>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-slate-800 dark:text-stone-200 truncate text-[11px]">
                        <strong>PU foam injection</strong> · WO-2043 · Refrigerator 2-Door
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                      Tomorrow
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-slate-800 dark:text-stone-200 truncate text-[11px]">
                        <strong>Water flow test</strong> · WO-2044 · Top Load Washer
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                      Tomorrow
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-slate-800 dark:text-stone-200 truncate text-[11px]">
                        <strong>Video burn-in QA</strong> · WO-2045 · LED TV 32-inch
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                      Tomorrow
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-stone-400 shrink-0" />
                      <span className="text-slate-800 dark:text-stone-200 truncate text-[11px]">
                        <strong>Noise & run test</strong> · WO-2041 · AC Split Standard
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 shrink-0">
                      in 2 days
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Footer Drag Help Tip */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-start gap-2 text-[11px] text-stone-400 dark:text-stone-500 leading-snug">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>Drag a bar to reschedule — anything after it moves too. Drag its right edge to change its length.</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── WORK ORDER DETAIL MODAL (Matches media_1793029171086_cba35350.png) ── */}
      {selectedWorkOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#18181B] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            
            {/* Header with Icon, WO ID, and Close */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                    Work order
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-stone-100">
                    {selectedWorkOrderModal.id}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                    {selectedWorkOrderModal.model}
                  </p>
                  {onNavigateToOrders && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkOrderModal(null);
                        onNavigateToOrders();
                      }}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-1 mt-0.5"
                    >
                      <span>Open in Work Orders</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWorkOrderModal(null)}
                className="w-8 h-8 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 hover:text-slate-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {selectedWorkOrderModal.status || "In progress"}
              </span>
              {selectedWorkOrderModal.rush && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Rush
                </span>
              )}
            </div>

            {/* 4 Metric Cards */}
            {(() => {
              const totalOps = selectedWorkOrderModal.operations.length;
              const doneOps = selectedWorkOrderModal.operations.filter((o) => o.progress === 100).length;
              const avgProg = Math.round(
                selectedWorkOrderModal.operations.reduce((acc, cur) => acc + cur.progress, 0) / (totalOps || 1)
              );
              return (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800">
                    <span className="text-[10px] text-stone-400 block font-medium">Starts</span>
                    <span className="font-bold text-sm text-slate-800 dark:text-stone-200">
                      {formatGanttDate(selectedWorkOrderModal.startDay)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800">
                    <span className="text-[10px] text-stone-400 block font-medium">Finishes</span>
                    <span className="font-bold text-sm text-slate-800 dark:text-stone-200">
                      {formatGanttDate(selectedWorkOrderModal.startDay + selectedWorkOrderModal.durationDays - 1)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800">
                    <span className="text-[10px] text-stone-400 block font-medium">Progress</span>
                    <span className="font-bold text-sm text-slate-800 dark:text-stone-200">
                      {avgProg}%
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800">
                    <span className="text-[10px] text-stone-400 block font-medium">Operations</span>
                    <span className="font-bold text-sm text-slate-800 dark:text-stone-200">
                      {doneOps} of {totalOps} done
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Overall Progress Bar */}
            {(() => {
              const avgProg = Math.round(
                selectedWorkOrderModal.operations.reduce((acc, cur) => acc + cur.progress, 0) /
                  (selectedWorkOrderModal.operations.length || 1)
              );
              return (
                <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${avgProg}%` }} />
                </div>
              );
            })()}

            {/* ROUTE Stepper Section */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider block">
                Route
              </span>

              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200 dark:before:bg-stone-800">
                {selectedWorkOrderModal.operations.map((op) => (
                  <div key={op.id} className="relative flex items-center justify-between pl-7 text-xs">
                    <span
                      className={`absolute left-2 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-[#18181B] ${
                        op.progress === 100 ? "bg-emerald-500" : op.progress > 0 ? "bg-blue-500" : "bg-stone-300 dark:bg-stone-700"
                      }`}
                    />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-stone-200">{op.name}</p>
                      <p className="text-[11px] text-stone-400">
                        {op.workCenter?.split("·")[0] || "WC"} · {op.statusText}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${op.techColor}`}>
                        {op.techInitial}
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-stone-300 w-10 text-right">
                        {op.progress}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* NOTES FOR THE FLOOR */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider block">
                Notes For The Floor
              </span>
              <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-2xl border border-stone-100 dark:border-stone-800 flex items-start gap-2.5 text-xs text-slate-700 dark:text-stone-300">
                <FileText className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="italic">
                  {selectedWorkOrderModal.note || "Standard assembly and dielectric QA gate required before final shipment."}
                </p>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setWorkOrders((prev) =>
                    prev.map((w) =>
                      w.id === selectedWorkOrderModal.id
                        ? { ...w, status: w.status === "On hold" ? "In progress" : "On hold" }
                        : w
                    )
                  );
                  showToast(`${selectedWorkOrderModal.id}: Status updated`);
                  setSelectedWorkOrderModal(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-slate-800 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 text-stone-500" />
                <span>Put on hold</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWorkOrders((prev) =>
                    prev.map((w) => {
                      if (w.id !== selectedWorkOrderModal.id) return w;
                      return {
                        ...w,
                        status: "Completed",
                        operations: w.operations.map((op) => ({ ...op, progress: 100, colorScheme: "emerald" })),
                      };
                    })
                  );
                  showToast(`${selectedWorkOrderModal.id}: Completed successfully (100%)`);
                  setSelectedWorkOrderModal(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Complete</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  showToast(`${selectedWorkOrderModal.id}: Schedule verified on timeline`);
                  setSelectedWorkOrderModal(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>In schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── OPERATION DETAIL MODAL (Matches media_1793029193839_a7daf428.png) ── */}
      {selectedOpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#18181B] rounded-3xl border border-stone-200 dark:border-stone-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            
            {/* Header with Wrench Icon, Op name, WO-ID and Close */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900/50 flex items-center justify-center shrink-0">
                  <Wrench className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 block">
                    {selectedOpModal.wo.id} · {selectedOpModal.wo.model.split("·")[0]}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-stone-100">
                    {selectedOpModal.op.name}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                    {selectedOpModal.op.workCenter || "Assembly Work Center"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOpModal(null)}
                className="w-8 h-8 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 hover:text-slate-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {selectedOpModal.op.progress === 100 ? "Completed" : selectedOpModal.op.progress > 0 ? "In progress" : "Scheduled"}
              </span>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800">
                <span className="text-[10px] text-stone-400 block font-medium">Starts</span>
                <span className="font-bold text-sm text-slate-800 dark:text-stone-200">
                  {formatGanttDate(selectedOpModal.op.startDay, true)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800">
                <span className="text-[10px] text-stone-400 block font-medium">Finishes</span>
                <span className="font-bold text-sm text-slate-800 dark:text-stone-200">
                  {formatGanttDate(selectedOpModal.op.startDay + selectedOpModal.op.durationDays - 1, true)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800">
                <span className="text-[10px] text-stone-400 block font-medium">Assigned</span>
                <span className="font-bold text-sm text-slate-800 dark:text-stone-200 truncate block">
                  {selectedOpModal.op.techName || "Technician"}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800">
                <span className="text-[10px] text-stone-400 block font-medium">Progress</span>
                <span className="font-bold text-sm text-slate-800 dark:text-stone-200">
                  {selectedOpModal.op.progress}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${selectedOpModal.op.progress}%` }} />
            </div>

            {/* DEPENDS ON Section */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-stone-500 uppercase tracking-wider block">
                Depends On
              </span>
              <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-2xl border border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800 dark:text-stone-200">Laser Sheet Metal Cutting</p>
                    <p className="text-[11px] text-stone-400">ends {formatGanttDate(selectedOpModal.op.startDay)}</p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
            </div>

            {/* Open WO Button */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => {
                  const targetWo = selectedOpModal.wo;
                  setSelectedOpModal(null);
                  setSelectedWorkOrderModal(targetWo);
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-slate-800 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-stone-500" />
                <span>Open {selectedOpModal.wo.id}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
