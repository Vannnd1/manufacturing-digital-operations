import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  ShieldCheck, 
  Bell, 
  Palette, 
  Layers, 
  Database, 
  Check, 
  RotateCcw, 
  Eye, 
  Edit3, 
  Search, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Mail, 
  Sliders, 
  Download, 
  FileText, 
  Radio, 
  Lock, 
  Server, 
  Users, 
  Contact, 
  Package, 
  Factory, 
  Tag, 
  ShoppingCart, 
  Receipt, 
  BookOpen, 
  Truck, 
  Calendar, 
  Sparkles,
  X,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

type SettingsTab = "company" | "roles" | "notifications" | "appearance" | "integrations" | "data";

interface CompanyProfile {
  tradingName: string;
  legalEntity: string;
  registeredAddress: string;
  taxId: string;
  billingEmail: string;
  phone: string;
  currency: string;
  fiscalYearStart: string;
  timezone: string;
}

const DEFAULT_COMPANY: CompanyProfile = {
  tradingName: "MfgOps Precision Assembly",
  legalEntity: "MfgOps Industrial Solutions Corp LLC",
  registeredAddress: "4020 Technology Blvd, Suite 100, San Jose, CA 95110",
  taxId: "MFG-8841-US",
  billingEmail: "ops-billing@mfgops-platform.internal",
  phone: "+1 (408) 555-0199",
  currency: "USD",
  fiscalYearStart: "January",
  timezone: "America/Los_Angeles (PT)"
};

// Roles & Matrix Definition
type PermissionLevel = "none" | "view" | "edit";

interface ModulePermission {
  module: string;
  admin: PermissionLevel;
  manager: PermissionLevel;
  purchasing: PermissionLevel;
  warehouse: PermissionLevel;
  production: PermissionLevel;
  quality: PermissionLevel;
}

const INITIAL_PERMISSIONS: ModulePermission[] = [
  { module: "Dashboard", admin: "edit", manager: "view", purchasing: "view", warehouse: "view", production: "view", quality: "view" },
  { module: "Procurement & POs", admin: "edit", manager: "edit", purchasing: "edit", warehouse: "view", production: "none", quality: "none" },
  { module: "Inventory & Stock", admin: "edit", manager: "view", purchasing: "view", warehouse: "edit", production: "view", quality: "view" },
  { module: "Materials Master", admin: "edit", manager: "edit", purchasing: "edit", warehouse: "view", production: "view", quality: "view" },
  { module: "Production Orders", admin: "edit", manager: "edit", purchasing: "none", warehouse: "view", production: "edit", quality: "view" },
  { module: "Quality Control", admin: "edit", manager: "view", purchasing: "none", warehouse: "none", production: "view", quality: "edit" },
  { module: "Staff & Shifts", admin: "edit", manager: "edit", purchasing: "none", warehouse: "none", production: "none", quality: "none" },
  { module: "Reporting & OEE", admin: "edit", manager: "edit", purchasing: "view", warehouse: "view", production: "view", quality: "view" },
  { module: "Audit & Traceability", admin: "edit", manager: "view", purchasing: "none", warehouse: "none", production: "none", quality: "none" },
  { module: "System Settings", admin: "edit", manager: "view", purchasing: "none", warehouse: "none", production: "none", quality: "none" }
];

export interface RoleMember {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  jobTitle: string;
  department: string;
  workCenter: string;
  shift: string;
  status: "present" | "remote" | "leave";
  initials: string;
  tenure: string;
}

export interface RoleDefinition {
  title: string;
  count: number;
  desc: string;
  color: string;
  accentBar: string;
  initials: string[];
  members: RoleMember[];
}

const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    title: "Administrator",
    count: 1,
    desc: "Everything, including audit & settings.",
    color: "bg-red-500",
    accentBar: "#EF4444",
    initials: ["AD"],
    members: [
      {
        id: "st-1",
        name: "Lead Operations Admin",
        employeeId: "PMI-OPS-001",
        email: "admin@mfg.com",
        jobTitle: "Plant Operations Supervisor & System Administrator",
        department: "Plant Operations",
        workCenter: "Central Control & MES Dispatch",
        shift: "General Shift (08:00 – 17:00 WIB)",
        status: "present",
        initials: "AD",
        tenure: "5.0 yrs"
      }
    ]
  },
  {
    title: "Plant Manager",
    count: 2,
    desc: "Production KPIs, shift approvals, analytics.",
    color: "bg-amber-500",
    accentBar: "#F59E0B",
    initials: ["MG", "VP"],
    members: [
      {
        id: "st-19",
        name: "Marcus Gallagher",
        employeeId: "PMI-OPS-019",
        email: "marcus.g@mfg.internal",
        jobTitle: "Plant Operations Manager & MPS Lead",
        department: "Plant Operations",
        workCenter: "Central Control Office",
        shift: "General Shift (08:00 – 17:00 WIB)",
        status: "present",
        initials: "MG",
        tenure: "2.8 yrs"
      },
      {
        id: "st-6",
        name: "Victoria Park",
        employeeId: "PMI-OPS-006",
        email: "victoria.p@mfg.internal",
        jobTitle: "Deputy Plant Operations Superintendent",
        department: "Plant Operations",
        workCenter: "Plant 2 Operations Office",
        shift: "General Shift (08:00 – 17:00 WIB)",
        status: "present",
        initials: "VP",
        tenure: "6.6 yrs"
      }
    ]
  },
  {
    title: "Purchasing",
    count: 4,
    desc: "Purchase requests, vendor POs, RFQs.",
    color: "bg-blue-500",
    accentBar: "#3B82F6",
    initials: ["PS", "EL", "TN", "KW"],
    members: [
      {
        id: "st-17",
        name: "Priya Sharma",
        employeeId: "PMI-PRC-017",
        email: "priya.s@mfg.internal",
        jobTitle: "Procurement & Sourcing Lead",
        department: "Procurement & Sourcing",
        workCenter: "Administrative Procurement Office",
        shift: "General Shift (08:00 – 17:00 WIB)",
        status: "present",
        initials: "PS",
        tenure: "4.4 yrs"
      },
      {
        id: "st-18",
        name: "Eric Lin",
        employeeId: "PMI-PRC-018",
        email: "eric.lin@mfg.internal",
        jobTitle: "Vendor Relations & PO Specialist",
        department: "Procurement & Sourcing",
        workCenter: "Supplier Relations Hub",
        shift: "General Shift (08:00 – 17:00 WIB)",
        status: "remote",
        initials: "EL",
        tenure: "1.3 yrs"
      },
      {
        id: "st-23",
        name: "Taufik Nugroho",
        employeeId: "PMI-PRC-023",
        email: "taufik.n@mfg.internal",
        jobTitle: "Direct Raw Materials & Coil Buyer",
        department: "Procurement & Sourcing",
        workCenter: "Procurement Floor Desk",
        shift: "General Shift (08:00 – 17:00 WIB)",
        status: "present",
        initials: "TN",
        tenure: "3.2 yrs"
      },
      {
        id: "st-24",
        name: "Kenji Watanabe",
        employeeId: "PMI-PRC-024",
        email: "kenji.w@mfg.internal",
        jobTitle: "Strategic Commodity Sourcing Manager",
        department: "Procurement & Sourcing",
        workCenter: "Executive Sourcing Office",
        shift: "General Shift (08:00 – 17:00 WIB)",
        status: "present",
        initials: "KW",
        tenure: "5.1 yrs"
      }
    ]
  },
  {
    title: "Warehouse",
    count: 6,
    desc: "Goods receipts, pallet bins, stock reorder.",
    color: "bg-emerald-500",
    accentBar: "#10B981",
    initials: ["WI", "JC", "DK"],
    members: [
      {
        id: "st-14",
        name: "William Ibrahim",
        employeeId: "PMI-LOG-014",
        email: "william.i@mfg.internal",
        jobTitle: "Warehouse Logistics Supervisor",
        department: "Warehouse & Logistics",
        workCenter: "Warehouse Bay 1 · Raw Material Hub",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "WI",
        tenure: "3.7 yrs"
      },
      {
        id: "st-25",
        name: "James Chen",
        employeeId: "PMI-LOG-015",
        email: "james.chen@mfg.internal",
        jobTitle: "Inbound Dock Goods Receipt Clerk",
        department: "Warehouse & Logistics",
        workCenter: "Dock 3 Receiving Bay",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "JC",
        tenure: "2.0 yrs"
      },
      {
        id: "st-26",
        name: "Devi Kuncoro",
        employeeId: "PMI-LOG-016",
        email: "devi.k@mfg.internal",
        jobTitle: "FIFO Stock Controller & Bin Stager",
        department: "Warehouse & Logistics",
        workCenter: "Central Component Stockroom",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "DK",
        tenure: "4.2 yrs"
      },
      {
        id: "st-27",
        name: "Tomás Silva",
        employeeId: "PMI-LOG-025",
        email: "tomas.s@mfg.internal",
        jobTitle: "Outbound Pallet Shipping Coordinator",
        department: "Warehouse & Logistics",
        workCenter: "Logistics Hub Bay 1",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "TS",
        tenure: "3.5 yrs"
      },
      {
        id: "st-15",
        name: "Ravi Patel",
        employeeId: "PMI-LOG-026",
        email: "ravi.p@mfg.internal",
        jobTitle: "Customs & Trade Compliance Officer",
        department: "Warehouse & Logistics",
        workCenter: "Warehouse Bay 2 · Bonded Customs Zone",
        shift: "General Shift (08:00 – 17:00 WIB)",
        status: "present",
        initials: "RP",
        tenure: "1.5 yrs"
      },
      {
        id: "st-16",
        name: "Yusuf Kaya",
        employeeId: "PMI-LOG-027",
        email: "yusuf.k@mfg.internal",
        jobTitle: "Heavy Material Handler & Forklift Lead",
        department: "Warehouse & Logistics",
        workCenter: "Warehouse Bay 3 · Heavy Coil Staging",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "YK",
        tenure: "10 mo"
      }
    ]
  },
  {
    title: "Shop Floor",
    count: 12,
    desc: "Work orders, line executions, run logs.",
    color: "bg-purple-500",
    accentBar: "#8B5CF6",
    initials: ["OF", "TL", "RE", "+9"],
    members: [
      {
        id: "st-28",
        name: "Oliver Fischer",
        employeeId: "PMI-PROD-002",
        email: "oliver.f@mfg.internal",
        jobTitle: "Stamping Press Master Operator",
        department: "AC Manufacturing",
        workCenter: "Press Bay 4 · Sheet Forming",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "OF",
        tenure: "3.9 yrs"
      },
      {
        id: "st-29",
        name: "Tommy Lawson",
        employeeId: "PMI-PROD-003",
        email: "tommy.l@mfg.internal",
        jobTitle: "TIG Welding & Frame Assembly Tech",
        department: "AC Manufacturing",
        workCenter: "Frame Welding Station 2",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "TL",
        tenure: "2.6 yrs"
      },
      {
        id: "st-30",
        name: "Reza Pratama",
        employeeId: "PMI-PROD-004",
        email: "reza.p@mfg.internal",
        jobTitle: "Final Assembly Station Line Operator",
        department: "Refrigerator Line",
        workCenter: "Line A Final Staging",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "RE",
        tenure: "1.2 yrs"
      },
      {
        id: "st-2",
        name: "Felix Wagner",
        employeeId: "PMI-AC-005",
        email: "felix.w@mfg.internal",
        jobTitle: "CNC Tube Bending & Heat Exchanger Specialist",
        department: "AC Manufacturing",
        workCenter: "WC-AC-01 · AC Tube Bending Bay",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "FW",
        tenure: "4.1 yrs"
      },
      {
        id: "st-3",
        name: "Aiko Tanaka",
        employeeId: "PMI-AC-006",
        email: "aiko.t@mfg.internal",
        jobTitle: "Refrigerant Brazing Lead",
        department: "AC Manufacturing",
        workCenter: "WC-AC-01 · Copper Brazing Cell",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "AT",
        tenure: "3.1 yrs"
      },
      {
        id: "st-4",
        name: "Jonas Berg",
        employeeId: "PMI-AC-007",
        email: "jonas.b@mfg.internal",
        jobTitle: "Vacuum Evacuation & Refrigerant Charging Tech",
        department: "AC Manufacturing",
        workCenter: "WC-AC-02 · Vacuum Charging Bay",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "JB",
        tenure: "1.8 yrs"
      },
      {
        id: "st-5",
        name: "Lena Vogel",
        employeeId: "PMI-AC-008",
        email: "lena.v@mfg.internal",
        jobTitle: "Inverter Drive & PCB Specialist",
        department: "AC Manufacturing",
        workCenter: "WC-AC-02 · PCB Inverter Desk",
        shift: "Shift 2 (15:30 – 23:00 WIB)",
        status: "present",
        initials: "LV",
        tenure: "2.7 yrs"
      },
      {
        id: "st-7",
        name: "Kwame Mensah",
        employeeId: "PMI-RF-009",
        email: "kwame.m@mfg.internal",
        jobTitle: "Rigid PU Foam Injection Tech",
        department: "Refrigerator Line",
        workCenter: "WC-RF-01 · Cabinet PU Station",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "KM",
        tenure: "2.1 yrs"
      },
      {
        id: "st-8",
        name: "Bo Andersen",
        employeeId: "PMI-WM-010",
        email: "bo.a@mfg.internal",
        jobTitle: "Washer Drum Mechanics Specialist",
        department: "Washing Machine Line",
        workCenter: "WC-WM-01 · Drum Integration",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "BA",
        tenure: "2.4 yrs"
      },
      {
        id: "st-9",
        name: "Diego Alvarez",
        employeeId: "PMI-WM-011",
        email: "diego.a@mfg.internal",
        jobTitle: "Motor & Vibration Damper Tech",
        department: "Washing Machine Line",
        workCenter: "WC-WM-01 · Assembly Station",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "DA",
        tenure: "1.1 yrs"
      },
      {
        id: "st-10",
        name: "Amara Okafor",
        employeeId: "PMI-TV-012",
        email: "amara.o@mfg.internal",
        jobTitle: "SMT Mainboard Cleanroom Lead",
        department: "Display & TV Line",
        workCenter: "WC-TV-01 · SMT Bay 1",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "AO",
        tenure: "3.5 yrs"
      },
      {
        id: "st-11",
        name: "Hana Kim",
        employeeId: "PMI-TV-013",
        email: "hana.k@mfg.internal",
        jobTitle: "Display Panel & Optical Bonding Tech",
        department: "Display & TV Line",
        workCenter: "WC-TV-01 · Optical Cleanroom",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "HK",
        tenure: "2.0 yrs"
      }
    ]
  },
  {
    title: "Quality Control",
    count: 3,
    desc: "Defect inspection, tolerance, release.",
    color: "bg-teal-500",
    accentBar: "#14B8A6",
    initials: ["QC", "ER", "SV"],
    members: [
      {
        id: "st-12",
        name: "Quinn Caldwell",
        employeeId: "PMI-QAC-012",
        email: "quinn.c@mfg.internal",
        jobTitle: "Head of Quality Assurance & Metrology",
        department: "Quality Assurance",
        workCenter: "Central QC Testing Lab",
        shift: "General Shift (08:00 – 17:00 WIB)",
        status: "present",
        initials: "QC",
        tenure: "7.2 yrs"
      },
      {
        id: "st-31",
        name: "Elena Rostova",
        employeeId: "PMI-QAC-013",
        email: "elena.r@mfg.internal",
        jobTitle: "QC Dimensional & Tolerance Inspector",
        department: "Quality Assurance",
        workCenter: "Inspection Station 1",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "ER",
        tenure: "4.5 yrs"
      },
      {
        id: "st-13",
        name: "Satria Vardhan",
        employeeId: "PMI-QAC-030",
        email: "satria.v@mfg.internal",
        jobTitle: "High-Voltage Safety & Dielectric Inspector",
        department: "Quality Assurance",
        workCenter: "WC-QC-01 · Dielectric Hi-Pot Gate",
        shift: "Shift 1 (07:00 – 15:30 WIB)",
        status: "present",
        initials: "SV",
        tenure: "3.4 yrs"
      }
    ]
  }
];

export function Settings() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>("company");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Role Members Dialog State
  const [selectedRoleModal, setSelectedRoleModal] = useState<RoleDefinition | null>(null);
  const [roleMemberSearch, setRoleMemberSearch] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ── Tab 1: Company Profile State ──────────────────────────────────────────
  const [profile, setProfile] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem("mfg-company-profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_COMPANY;
      }
    }
    return DEFAULT_COMPANY;
  });

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("mfg-company-profile", JSON.stringify(profile));
    showToast("Company profile saved and updated on official document templates.");
  };

  const handleProfileRevert = () => {
    setProfile(DEFAULT_COMPANY);
    localStorage.setItem("mfg-company-profile", JSON.stringify(DEFAULT_COMPANY));
    showToast("Company profile reverted to system default.");
  };

  // ── Tab 2: Users & Roles Permissions Matrix ──────────────────────────────
  const [permissions, setPermissions] = useState<ModulePermission[]>(() => {
    const saved = localStorage.getItem("mfg-permissions-matrix");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_PERMISSIONS;
      }
    }
    return INITIAL_PERMISSIONS;
  });

  const cyclePermission = (rowIndex: number, roleKey: keyof Omit<ModulePermission, "module" | "admin">) => {
    // Admin always stays "edit"
    setPermissions((prev) => {
      const next = [...prev];
      const current = next[rowIndex][roleKey] as PermissionLevel;
      const cycle: Record<PermissionLevel, PermissionLevel> = {
        none: "view",
        view: "edit",
        edit: "none"
      };
      next[rowIndex] = {
        ...next[rowIndex],
        [roleKey]: cycle[current]
      };
      localStorage.setItem("mfg-permissions-matrix", JSON.stringify(next));
      return next;
    });
  };

  // ── Tab 3: Notifications State ────────────────────────────────────────────
  const [notifSettings, setNotifSettings] = useState({
    production: true,
    stock: true,
    procurement: true,
    quality: true,
    shipping: true,
    people: false,
    morningDigest: true,
    channel: "bell" as "bell" | "bell-email" | "bell-phone"
  });

  // ── Tab 4: Appearance State ───────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(() => {
    const saved = localStorage.getItem("mfg-theme-mode");
    if (saved === "dark" || saved === "light" || saved === "system") return saved;
    return "light";
  });

  const [accentColor, setAccentColor] = useState<"amber" | "ocean" | "mono" | "sage" | "coral">(() => {
    return (localStorage.getItem("mfg-accent-color") as any) || "amber";
  });

  const [density, setDensity] = useState<"comfortable" | "compact">(() => {
    return (localStorage.getItem("mfg-ui-density") as any) || "comfortable";
  });

  const [weekStart, setWeekStart] = useState<"monday" | "sunday">(() => {
    return (localStorage.getItem("mfg-week-start") as any) || "monday";
  });

  useEffect(() => {
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
    } else if (themeMode === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System mode
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    localStorage.setItem("mfg-theme-mode", themeMode);
  }, [themeMode]);

  const handleAccentChange = (color: "amber" | "ocean" | "mono" | "sage" | "coral") => {
    setAccentColor(color);
    localStorage.setItem("mfg-accent-color", color);
    showToast(`Accent color set to ${color.toUpperCase()}`);
  };

  const handleDensityChange = (d: "comfortable" | "compact") => {
    setDensity(d);
    localStorage.setItem("mfg-ui-density", d);
    showToast(`Table density set to ${d}`);
  };

  // ── Tab 5: Integrations State ─────────────────────────────────────────────
  const [integrationsFilter, setIntegrationsFilter] = useState<"all" | "connected" | "available">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [integrations, setIntegrations] = useState([
    {
      id: "opc-ua",
      name: "OPC-UA / MQTT Telemetry",
      category: "Industrial IoT",
      desc: "Streams live PLC sensor counts, machine vibration, and cycle telemetry directly from shop-floor edge nodes.",
      status: "connected",
      meta: "Synced 2 min ago · 4 edge nodes active"
    },
    {
      id: "sap-gateway",
      name: "SAP & ERP Master Gateway",
      category: "Enterprise Connector",
      desc: "Synchronizes official Purchase Orders, vendor master data, and general ledger journal postings.",
      status: "attention",
      meta: "OAuth token expired Oct 28 — reconnect to backfill 14 days"
    },
    {
      id: "barcode-rfid",
      name: "Shop-Floor Barcode Scanners",
      category: "Hardware Terminals",
      desc: "Direct socket feed from Honeywell & Zebra handhelds for instant goods receipt and batch scans.",
      status: "connected",
      meta: "Online · last scan at 10:14 AM (Dock 2)"
    },
    {
      id: "pallet-carrier",
      name: "Logistics Freight Dispatch",
      category: "Carrier Services",
      desc: "Automates pallet bill of lading, generates shipping labels, and retrieves inbound tracking numbers.",
      status: "connected",
      meta: "Next freight pickup: Thursday 2:00 PM"
    },
    {
      id: "alert-webhooks",
      name: "Plant Notification Webhooks",
      category: "Messaging",
      desc: "Dispatches critical machine stoppage and low-stock alerts to designated Slack / Teams operational channels.",
      status: "connected",
      meta: "42 alerts dispatched this week · 0 failed"
    },
    {
      id: "weigh-scale",
      name: "Digital Inline Weighing Scales",
      category: "Hardware",
      desc: "Captures weight verification for raw metal ingots and finished goods packaging batches via RS232 bridge.",
      status: "connected",
      meta: "Calibrated today at 06:30 AM"
    },
    {
      id: "bi-data-lake",
      name: "PowerBI / Live Data Lake",
      category: "Reporting & BI",
      desc: "Exposes real-time OEE, defect yield rates, and inventory valuation to external corporate analytics.",
      status: "available",
      meta: "Not connected · REST API ready"
    },
    {
      id: "cmms-maintenance",
      name: "CMMS Preventative Maintenance",
      category: "Equipment",
      desc: "Triggers automated maintenance work orders when machine operating hours exceed calibration limits.",
      status: "available",
      meta: "Not connected · Webhook sync ready"
    }
  ]);

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === "available" ? "connected" : "available";
          showToast(`${item.name} is now ${nextStatus === "connected" ? "connected" : "disconnected"}.`);
          return {
            ...item,
            status: nextStatus,
            meta: nextStatus === "connected" ? "Connected just now" : "Not connected"
          };
        }
        return item;
      })
    );
  };

  const filteredIntegrations = integrations.filter((item) => {
    const matchesFilter = 
      integrationsFilter === "all" ||
      (integrationsFilter === "connected" && (item.status === "connected" || item.status === "attention")) ||
      (integrationsFilter === "available" && item.status === "available");
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#18181B] text-white text-xs px-4 py-2.5 rounded-full shadow-2xl border border-stone-700/80 flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Settings Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-stone-100">
            Platform Settings
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Manage company profile, RBAC matrix, alert routing, interface themes, and equipment integrations.
          </p>
        </div>
        <div className="text-[11px] text-stone-400 dark:text-stone-500 font-mono flex items-center gap-2 self-start sm:self-center">
          <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-sans font-semibold">
            {user?.name || "Operator"} · {user?.role || "Staff"}
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-stone-400" />
            Config saved locally
          </span>
        </div>
      </div>

      {/* 2-Column Responsive Layout: Left Sidebar Nav + Right Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── Left Navigation Sub-Sidebar ───────────────────────────────────── */}
        <aside className="lg:col-span-3 bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-2xl p-2.5 shadow-xs space-y-1">
          <button
            onClick={() => setActiveTab("company")}
            className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
              activeTab === "company"
                ? "bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-300 shadow-2xs font-bold"
                : "text-slate-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900/60"
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${activeTab === "company" ? "bg-amber-600 text-white" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"}`}>
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight">Company</div>
              <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 font-normal truncate">
                Name, address, tax ID
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("roles")}
            className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
              activeTab === "roles"
                ? "bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-300 shadow-2xs font-bold"
                : "text-slate-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900/60"
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${activeTab === "roles" ? "bg-amber-600 text-white" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight">Users & roles</div>
              <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 font-normal truncate">
                Who can see and change what
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
              activeTab === "notifications"
                ? "bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-300 shadow-2xs font-bold"
                : "text-slate-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900/60"
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${activeTab === "notifications" ? "bg-amber-600 text-white" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"}`}>
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight">Notifications</div>
              <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 font-normal truncate">
                What reaches your bell
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("appearance")}
            className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
              activeTab === "appearance"
                ? "bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-300 shadow-2xs font-bold"
                : "text-slate-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900/60"
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${activeTab === "appearance" ? "bg-amber-600 text-white" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"}`}>
              <Palette className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight">Appearance</div>
              <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 font-normal truncate">
                Theme, accent, density
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("integrations")}
            className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
              activeTab === "integrations"
                ? "bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-300 shadow-2xs font-bold"
                : "text-slate-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900/60"
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${activeTab === "integrations" ? "bg-amber-600 text-white" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"}`}>
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight">Integrations</div>
              <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 font-normal truncate">
                SCADA, ERP, terminals
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("data")}
            className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
              activeTab === "data"
                ? "bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-300 shadow-2xs font-bold"
                : "text-slate-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900/60"
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${activeTab === "data" ? "bg-amber-600 text-white" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"}`}>
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold leading-tight">Data</div>
              <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 font-normal truncate">
                Export or start over
              </div>
            </div>
          </button>
        </aside>

        {/* ── Right Content Panel ───────────────────────────────────────────── */}
        <div className="lg:col-span-9 space-y-6">

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1: COMPANY / FACILITY PROFILE
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "company" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Left: Form */}
              <div className="xl:col-span-7 bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-2xl p-6 shadow-xs">
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-stone-100">
                      Company profile
                    </h2>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Heads every purchase order, goods receipt note and dispatch traveler.
                  </p>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300 mb-1">
                      Trading name
                    </label>
                    <input
                      type="text"
                      value={profile.tradingName}
                      onChange={(e) => setProfile({ ...profile, tradingName: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50/50 dark:bg-stone-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                      placeholder="e.g. MfgOps Precision Assembly"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300 mb-1">
                      Legal entity
                    </label>
                    <input
                      type="text"
                      value={profile.legalEntity}
                      onChange={(e) => setProfile({ ...profile, legalEntity: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50/50 dark:bg-stone-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                      placeholder="e.g. MfgOps Industrial Solutions Corp LLC"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300 mb-1">
                      Registered address
                    </label>
                    <input
                      type="text"
                      value={profile.registeredAddress}
                      onChange={(e) => setProfile({ ...profile, registeredAddress: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50/50 dark:bg-stone-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                      placeholder="Street, City, State / Province, Postal Code"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300 mb-1">
                        EIN / Tax ID
                      </label>
                      <input
                        type="text"
                        value={profile.taxId}
                        onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50/50 dark:bg-stone-900/60 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                        placeholder="e.g. 93-4418207"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300 mb-1">
                        Billing email
                      </label>
                      <input
                        type="email"
                        value={profile.billingEmail}
                        onChange={(e) => setProfile({ ...profile, billingEmail: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50/50 dark:bg-stone-900/60 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                        placeholder="billing@domain.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300 mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50/50 dark:bg-stone-900/60 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300 mb-1">
                        Currency
                      </label>
                      <select
                        value={profile.currency}
                        onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50/50 dark:bg-stone-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="IDR">IDR (Rp)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="JPY">JPY (¥)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300 mb-1">
                        Fiscal year starts
                      </label>
                      <select
                        value={profile.fiscalYearStart}
                        onChange={(e) => setProfile({ ...profile, fiscalYearStart: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50/50 dark:bg-stone-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                      >
                        <option value="January">January</option>
                        <option value="April">April</option>
                        <option value="July">July</option>
                        <option value="October">October</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300 mb-1">
                        Time zone
                      </label>
                      <select
                        value={profile.timezone}
                        onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50/50 dark:bg-stone-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                      >
                        <option value="America/Los_Angeles (PT)">America/Los_Angeles (PT)</option>
                        <option value="Asia/Jakarta (WIB)">Asia/Jakarta (WIB)</option>
                        <option value="America/New_York (ET)">America/New_York (ET)</option>
                        <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                        <option value="Asia/Tokyo (JST)">Asia/Tokyo (JST)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={handleProfileRevert}
                      className="px-4 py-2 rounded-full text-xs font-semibold text-stone-500 hover:text-slate-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      Revert
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-full bg-slate-900 dark:bg-amber-600 text-white font-semibold text-xs hover:bg-slate-800 dark:hover:bg-amber-500 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Save profile
                    </button>
                  </div>
                </form>
              </div>

              {/* Right: Live Document Preview */}
              <div className="xl:col-span-5 bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-stone-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-stone-100">
                      On your documents
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 text-[10px] font-bold tracking-wider uppercase">
                    Live preview
                  </span>
                </div>

                {/* Simulated Document Box */}
                <div className="p-4 bg-stone-50/70 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 rounded-xl space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {profile.tradingName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {profile.tradingName || "Trading Name"}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400">
                          {profile.legalEntity || "Legal Entity"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
                        Purchase Order
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        PO-2026-0814
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[10px] pt-3 border-t border-stone-200/60 dark:border-stone-800">
                    <div>
                      <span className="text-stone-400 uppercase tracking-wider block font-semibold mb-0.5">Facility From:</span>
                      <p className="text-slate-700 dark:text-stone-300 leading-tight">
                        {profile.registeredAddress || "Address here"}
                      </p>
                    </div>
                    <div>
                      <span className="text-stone-400 uppercase tracking-wider block font-semibold mb-0.5">Plant Tax ID:</span>
                      <p className="text-slate-700 dark:text-stone-300 font-mono">
                        {profile.taxId || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div>
                      <span className="text-stone-400 uppercase tracking-wider block font-semibold mb-0.5">Contact:</span>
                      <p className="text-slate-700 dark:text-stone-300 truncate font-mono">
                        {profile.billingEmail}
                      </p>
                      <p className="text-slate-700 dark:text-stone-300 font-mono">
                        {profile.phone}
                      </p>
                    </div>
                    <div>
                      <span className="text-stone-400 uppercase tracking-wider block font-semibold mb-0.5">Amounts in:</span>
                      <p className="font-bold text-slate-900 dark:text-white font-mono">
                        {profile.currency}
                      </p>
                    </div>
                  </div>

                  {/* Skeleton lines for document body */}
                  <div className="pt-3 border-t border-dashed border-stone-200 dark:border-stone-700 space-y-1.5 opacity-60">
                    <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full w-full" />
                    <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full w-5/6" />
                    <div className="h-2 bg-stone-200 dark:bg-stone-700 rounded-full w-2/3" />
                  </div>
                </div>

                <div className="mt-3 text-[10px] text-stone-400 dark:text-stone-500 font-mono text-center">
                  Fiscal year from {profile.fiscalYearStart} · times in {profile.timezone}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2: USERS & ROLES (PERMISSIONS MATRIX)
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "roles" && (
            <div className="space-y-6">
              {/* Top Roles Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {ROLE_DEFINITIONS.map((r) => {
                  const isSelected = selectedRoleModal?.title === r.title;
                  return (
                    <div
                      key={r.title}
                      onClick={() => {
                        setSelectedRoleModal(r);
                        setRoleMemberSearch("");
                      }}
                      className={`bg-white dark:bg-[#18181B] border rounded-xl p-3 shadow-2xs flex flex-col justify-between cursor-pointer transition-all duration-150 group select-none ${
                        isSelected
                          ? "border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs"
                          : "border-stone-200/90 dark:border-stone-800 hover:border-amber-500/70 dark:hover:border-amber-500/70 hover:shadow-md hover:-translate-y-0.5"
                      }`}
                      title={`Click to view all ${r.count} ${r.title} members`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {r.title}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full group-hover:bg-amber-100 dark:group-hover:bg-amber-950 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                            {r.count}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight line-clamp-2">
                          {r.desc}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {r.initials.map((init, idx) => (
                            <div
                              key={idx}
                              className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-[9px] font-bold flex items-center justify-center border border-white dark:border-stone-900 shadow-2xs"
                            >
                              {init}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                            View <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
                          </span>
                          <div className={`h-1 w-6 rounded-full ${r.color}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Permissions Table Matrix */}
              <div className="bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <h2 className="text-base font-bold text-slate-900 dark:text-stone-100">
                        Permissions Matrix
                      </h2>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Click a cell to cycle <span className="font-semibold text-stone-400 dark:text-stone-500">None</span> → <span className="font-semibold text-blue-600 dark:text-blue-400">View</span> → <span className="font-semibold text-amber-600 dark:text-amber-400">Edit</span>. Administrators always maintain full edit access.
                    </p>
                  </div>
                  <button
                    onClick={() => showToast("Role assignment drawer opened.")}
                    className="px-3.5 py-1.5 rounded-full bg-slate-900 dark:bg-amber-600 text-white font-semibold text-xs hover:bg-slate-800 dark:hover:bg-amber-500 flex items-center gap-1.5 self-start sm:self-center transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Assign a role
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-800 text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500">
                        <th className="py-2.5 px-3 font-semibold">Module</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Administrator</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Manager</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Purchasing</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Warehouse</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Shop Floor</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Quality</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-medium">
                      {permissions.map((row, idx) => {
                        const renderBadge = (level: PermissionLevel, isLocked = false, onClick?: () => void) => {
                          if (level === "edit") {
                            return (
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={onClick}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 transition-all ${isLocked ? "opacity-75 cursor-default" : "hover:scale-105 cursor-pointer"}`}
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                                Edit
                              </button>
                            );
                          }
                          if (level === "view") {
                            return (
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={onClick}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 transition-all hover:scale-105 cursor-pointer"
                              >
                                <Eye className="w-2.5 h-2.5" />
                                View
                              </button>
                            );
                          }
                          return (
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={onClick}
                              className="inline-flex items-center justify-center text-[11px] text-stone-400 dark:text-stone-500 font-mono hover:text-slate-900 dark:hover:text-white px-2 py-0.5 rounded cursor-pointer"
                            >
                              — No access
                            </button>
                          );
                        };

                        return (
                          <tr key={row.module} className="hover:bg-stone-50/60 dark:hover:bg-stone-900/40">
                            <td className="py-3 px-3 font-semibold text-slate-900 dark:text-stone-100">
                              {row.module}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {renderBadge("edit", true)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {renderBadge(row.manager, false, () => cyclePermission(idx, "manager"))}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {renderBadge(row.purchasing, false, () => cyclePermission(idx, "purchasing"))}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {renderBadge(row.warehouse, false, () => cyclePermission(idx, "warehouse"))}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {renderBadge(row.production, false, () => cyclePermission(idx, "production"))}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {renderBadge(row.quality, false, () => cyclePermission(idx, "quality"))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 3: NOTIFICATIONS ROUTING
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "notifications" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Left: Toggles */}
              <div className="xl:col-span-7 bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-stone-100">
                      What reaches you
                    </h2>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Turn off a category and it stops ringing the operational bell. It still remains logged in the Audit Activity trail.
                  </p>
                </div>

                <div className="space-y-3.5 divide-y divide-stone-100 dark:divide-stone-800">
                  {/* 1. Production */}
                  <div className="pt-3.5 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-amber-600" /> Production & Work Orders
                      </span>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        A work order falls behind schedule, a rush batch starts, or a machine run completes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifSettings({ ...notifSettings, production: !notifSettings.production })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifSettings.production ? "bg-slate-900 dark:bg-amber-600" : "bg-stone-200 dark:bg-stone-700"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifSettings.production ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* 2. Stock */}
                  <div className="pt-3.5 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-blue-600" /> Inventory & Raw Materials
                      </span>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        Anything drops below reorder point or safety stock; a goods receipt (GRN) is received.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifSettings({ ...notifSettings, stock: !notifSettings.stock })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifSettings.stock ? "bg-slate-900 dark:bg-amber-600" : "bg-stone-200 dark:bg-stone-700"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifSettings.stock ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* 3. Procurement */}
                  <div className="pt-3.5 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" /> Procurement & Supplier POs
                      </span>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        A purchase requisition requires manager authorization; supplier delays notice.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifSettings({ ...notifSettings, procurement: !notifSettings.procurement })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifSettings.procurement ? "bg-slate-900 dark:bg-amber-600" : "bg-stone-200 dark:bg-stone-700"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifSettings.procurement ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* 4. Quality */}
                  <div className="pt-3.5 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Quality Control & Inspections
                      </span>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        A batch fails dimension check, defect threshold is breached, or quarantine is locked.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifSettings({ ...notifSettings, quality: !notifSettings.quality })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifSettings.quality ? "bg-slate-900 dark:bg-amber-600" : "bg-stone-200 dark:bg-stone-700"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifSettings.quality ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* 5. Shipping & Pallet Freight */}
                  <div className="pt-3.5 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-indigo-600" /> Freight & Loading Dock
                      </span>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        An inbound freight container is delayed or a pallet shipment departs the facility.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifSettings({ ...notifSettings, shipping: !notifSettings.shipping })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifSettings.shipping ? "bg-slate-900 dark:bg-amber-600" : "bg-stone-200 dark:bg-stone-700"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifSettings.shipping ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* 6. People & Shift Handover */}
                  <div className="pt-3.5 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-600" /> Shift Handovers & Attendance
                      </span>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        Operator shift handover logs, station reassignment, and overtime approvals.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifSettings({ ...notifSettings, people: !notifSettings.people })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notifSettings.people ? "bg-slate-900 dark:bg-amber-600" : "bg-stone-200 dark:bg-stone-700"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifSettings.people ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Morning Digest Banner */}
                <div className="p-3.5 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-600" /> Morning Shift Digest
                    </span>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      Yesterday&apos;s OEE numbers and today&apos;s master schedule, delivered at 07:00 AM.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifSettings({ ...notifSettings, morningDigest: !notifSettings.morningDigest })}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifSettings.morningDigest ? "bg-slate-900 dark:bg-amber-600" : "bg-stone-200 dark:bg-stone-700"
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      notifSettings.morningDigest ? "translate-x-4" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Dispatch Channel Selector */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300 mb-1.5">
                    Send them to
                  </label>
                  <div className="inline-flex rounded-full p-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setNotifSettings({ ...notifSettings, channel: "bell" })}
                      className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                        notifSettings.channel === "bell"
                          ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs"
                          : "text-stone-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Bell only
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotifSettings({ ...notifSettings, channel: "bell-email" })}
                      className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                        notifSettings.channel === "bell-email"
                          ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs"
                          : "text-stone-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Bell + Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotifSettings({ ...notifSettings, channel: "bell-phone" })}
                      className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                        notifSettings.channel === "bell-phone"
                          ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs"
                          : "text-stone-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Bell + Phone SMS
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Simulated "Today with these settings" */}
              <div className="xl:col-span-5 bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-stone-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-stone-100">
                      Today, with these settings
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-mono text-[10px] font-bold">
                    4 of 5 active
                  </span>
                </div>

                <div className="space-y-3">
                  {notifSettings.production && (
                    <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200/60 dark:border-stone-800 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Sliders className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-stone-200 leading-tight">
                          WO-2042 TIG welding is 2 hrs behind
                        </p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                          Harbor & Hill batch is flagged as rush order · 1h ago
                        </p>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    </div>
                  )}

                  {notifSettings.stock && (
                    <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200/60 dark:border-stone-800 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Database className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-stone-200 leading-tight">
                          Bearing 6204-2RS below reorder level
                        </p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                          12 remaining in Bin B-04 (50 required) · 2h ago
                        </p>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    </div>
                  )}

                  {notifSettings.shipping && (
                    <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200/60 dark:border-stone-800 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Radio className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-stone-200 leading-tight">
                          Pallet SHP-7711 held at customs
                        </p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                          Commercial invoice requires HS classification code · 3h ago
                        </p>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    </div>
                  )}

                  {notifSettings.procurement && (
                    <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200/60 dark:border-stone-800 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-stone-200 leading-tight">
                          PO-2026-0043 approved by Plant Manager
                        </p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                          Issued to Pacific Steel Wire LLC for 5,000 kg wire · 5h ago
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 text-[11px] text-stone-400 dark:text-stone-500 text-center font-mono">
                  1 muted notice still logged in Audit Trail.
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 4: APPEARANCE (THEME, ACCENT, DENSITY)
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "appearance" && (
            <div className="bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-7">
              {/* Section 1: Theme */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Palette className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-stone-100">
                    Theme
                  </h2>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
                  Choose between high-contrast daylight mode or industrial graphite night mode.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Light */}
                  <div
                    onClick={() => setThemeMode("light")}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between h-36 ${
                      themeMode === "light"
                        ? "border-amber-600 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs"
                        : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-900/30"
                    }`}
                  >
                    <div className="w-full h-16 rounded-lg bg-[#FAF9F6] border border-stone-200 p-2 flex gap-2">
                      <div className="w-1/4 h-full bg-[#18181B] rounded-sm" />
                      <div className="w-3/4 space-y-1.5">
                        <div className="h-3 bg-amber-600 rounded-sm w-1/2" />
                        <div className="h-2 bg-stone-200 rounded-sm w-full" />
                        <div className="h-2 bg-stone-200 rounded-sm w-3/4" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Light</span>
                      {themeMode === "light" && (
                        <div className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dark */}
                  <div
                    onClick={() => setThemeMode("dark")}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between h-36 ${
                      themeMode === "dark"
                        ? "border-amber-600 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs"
                        : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-900/30"
                    }`}
                  >
                    <div className="w-full h-16 rounded-lg bg-[#0F1013] border border-stone-800 p-2 flex gap-2">
                      <div className="w-1/4 h-full bg-[#18181B] rounded-sm border border-stone-800" />
                      <div className="w-3/4 space-y-1.5">
                        <div className="h-3 bg-amber-600 rounded-sm w-1/2" />
                        <div className="h-2 bg-stone-800 rounded-sm w-full" />
                        <div className="h-2 bg-stone-800 rounded-sm w-3/4" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Dark</span>
                      {themeMode === "dark" && (
                        <div className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* System */}
                  <div
                    onClick={() => setThemeMode("system")}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between h-36 ${
                      themeMode === "system"
                        ? "border-amber-600 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs"
                        : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-900/30"
                    }`}
                  >
                    <div className="w-full h-16 rounded-lg overflow-hidden border border-stone-300 dark:border-stone-700 flex">
                      <div className="w-1/2 h-full bg-[#FAF9F6] p-1.5 space-y-1">
                        <div className="h-2.5 bg-amber-600 rounded-xs w-3/4" />
                        <div className="h-1.5 bg-stone-200 rounded-xs w-full" />
                      </div>
                      <div className="w-1/2 h-full bg-[#0F1013] p-1.5 space-y-1">
                        <div className="h-2.5 bg-amber-600 rounded-xs w-3/4" />
                        <div className="h-1.5 bg-stone-800 rounded-xs w-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">System</span>
                      {themeMode === "system" && (
                        <div className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Accent Colour */}
              <div className="pt-5 border-t border-stone-100 dark:border-stone-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-stone-100 mb-1">
                  Accent colour
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                  The background always stays neutral. The accent tints the active brand highlights and CTAs.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { id: "amber", name: "Amber", sub: "Warm industrial (default)", bg: "bg-amber-600" },
                    { id: "ocean", name: "Ocean", sub: "Calm precision blue", bg: "bg-blue-600" },
                    { id: "mono", name: "Mono", sub: "Black and graphite", bg: "bg-stone-900" },
                    { id: "sage", name: "Sage", sub: "Cleanroom soft green", bg: "bg-emerald-600" },
                    { id: "coral", name: "Coral", sub: "High-alert red", bg: "bg-rose-600" }
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleAccentChange(c.id as any)}
                      className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        accentColor === c.id
                          ? "border-slate-900 dark:border-white bg-stone-50 dark:bg-stone-800/80 shadow-xs"
                          : "border-stone-200 dark:border-stone-800 hover:border-stone-300"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full ${c.bg} shrink-0 flex items-center justify-center`}>
                        {accentColor === c.id && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="text-left">
                        <span className="block text-slate-900 dark:text-white leading-tight">{c.name}</span>
                        <span className="text-[10px] text-stone-400 dark:text-stone-500 font-normal">{c.sub}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 3: Density with Live Preview */}
              <div className="pt-5 border-t border-stone-100 dark:border-stone-800 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-stone-100 mb-1">
                    Density
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                    Compact fits more rows on desktop laptops; comfortable is easier on touch-screen tablets on the plant floor.
                  </p>

                  <div className="inline-flex rounded-full p-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs mb-4">
                    <button
                      type="button"
                      onClick={() => handleDensityChange("comfortable")}
                      className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                        density === "comfortable"
                          ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs"
                          : "text-stone-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Comfortable
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDensityChange("compact")}
                      className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                        density === "compact"
                          ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs"
                          : "text-stone-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Compact
                    </button>
                  </div>

                  <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-stone-50/50 dark:bg-stone-900/40">
                    <div className="px-3 py-1.5 bg-stone-100/70 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                      Live Grid Preview ({density})
                    </div>
                    <div className="divide-y divide-stone-200/60 dark:divide-stone-800">
                      {[
                        { code: "WO-2041", name: "Alloy Precision Bracket", qty: "×12", status: "On track" },
                        { code: "WO-2042", name: "TIG Welded Frame Sub-Assembly", qty: "×6", status: "Delayed" },
                        { code: "WO-2043", name: "Industrial Stator Casing", qty: "×4", status: "Ready" }
                      ].map((item) => (
                        <div
                          key={item.code}
                          className={`flex items-center justify-between text-xs transition-all ${
                            density === "compact" ? "py-1.5 px-3" : "py-3 px-3.5"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span className="font-mono font-bold text-slate-800 dark:text-stone-200">{item.code}</span>
                            <span className="text-stone-500 dark:text-stone-400 truncate">{item.name}</span>
                          </div>
                          <div className="font-mono text-stone-500 font-semibold">{item.qty}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 4: Calendar Weeks Start On */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-stone-100 mb-1">
                    Calendar weeks start on
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                    Used by the machine Gantt scheduler, time-off planner, and weekly line capacity.
                  </p>

                  <div className="inline-flex rounded-full p-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setWeekStart("monday");
                        localStorage.setItem("mfg-week-start", "monday");
                        showToast("Week schedule starts on Monday (ISO Standard)");
                      }}
                      className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                        weekStart === "monday"
                          ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs"
                          : "text-stone-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Monday
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWeekStart("sunday");
                        localStorage.setItem("mfg-week-start", "sunday");
                        showToast("Week schedule starts on Sunday");
                      }}
                      className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                        weekStart === "sunday"
                          ? "bg-white dark:bg-stone-800 text-slate-900 dark:text-white shadow-xs"
                          : "text-stone-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Sunday
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 5: INTEGRATIONS (SCADA, ERP, TERMINALS)
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "integrations" && (
            <div className="bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-stone-100">
                      Integrations
                    </h2>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Industrial protocols and external services connected to MfgOps. Disconnecting stops live stream; existing audit logs remain intact.
                  </p>
                </div>
              </div>

              {/* Filter Pills + Search */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="inline-flex rounded-full p-1 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setIntegrationsFilter("all")}
                    className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                      integrationsFilter === "all"
                        ? "bg-slate-900 dark:bg-amber-600 text-white shadow-xs"
                        : "text-stone-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    All {integrations.length}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntegrationsFilter("connected")}
                    className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                      integrationsFilter === "connected"
                        ? "bg-slate-900 dark:bg-amber-600 text-white shadow-xs"
                        : "text-stone-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Connected {integrations.filter((i) => i.status !== "available").length}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntegrationsFilter("available")}
                    className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                      integrationsFilter === "available"
                        ? "bg-slate-900 dark:bg-amber-600 text-white shadow-xs"
                        : "text-stone-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Available {integrations.filter((i) => i.status === "available").length}
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search integrations..."
                    className="w-full pl-8 pr-3.5 py-1.5 text-xs rounded-full border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Integrations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredIntegrations.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                      item.status === "attention"
                        ? "border-rose-200/90 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20"
                        : "border-stone-200/90 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            item.status === "connected"
                              ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              : item.status === "attention"
                              ? "bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                              : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700"
                          }`}>
                            <Server className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-slate-900 dark:text-stone-100 leading-tight">
                              {item.name}
                            </h3>
                            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        {item.status === "connected" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Connected
                          </span>
                        )}
                        {item.status === "attention" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Needs attention
                          </span>
                        )}
                        {item.status === "available" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-500">
                            Available
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-stone-400 leading-relaxed mb-3">
                        {item.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono truncate max-w-[200px]">
                        {item.meta}
                      </span>
                      {item.status === "connected" && (
                        <button
                          type="button"
                          onClick={() => toggleIntegration(item.id)}
                          className="px-3 py-1 rounded-full border border-stone-200 dark:border-stone-700 text-xs font-semibold text-slate-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                        >
                          Disconnect
                        </button>
                      )}
                      {item.status === "attention" && (
                        <button
                          type="button"
                          onClick={() => {
                            showToast("SAP Gateway OAuth re-authenticated successfully.");
                            setIntegrations((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, status: "connected", meta: "Connected & synced just now" } : i))
                            );
                          }}
                          className="px-3 py-1 rounded-full bg-slate-900 dark:bg-amber-600 text-white text-xs font-semibold hover:bg-slate-800 dark:hover:bg-amber-500 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Reconnect
                        </button>
                      )}
                      {item.status === "available" && (
                        <button
                          type="button"
                          onClick={() => toggleIntegration(item.id)}
                          className="px-3 py-1 rounded-full bg-slate-900 dark:bg-amber-600 text-white text-xs font-semibold hover:bg-slate-800 dark:hover:bg-amber-500 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 6: DATA EXPORT & RESET
             ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === "data" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Left / Center Card: Export everything (xl:col-span-8) */}
              <div className="xl:col-span-8 bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-1">
                  <Download className="w-4 h-4 text-slate-800 dark:text-stone-200" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-stone-100">
                    Export everything
                  </h2>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  One JSON file with every record in this workspace — yours to keep or load elsewhere.
                </p>

                {/* 12 Record Cards Grid (3 rows x 4 columns) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
                  {[
                    { label: "People", count: 22, icon: Users },
                    { label: "Contacts", count: 22, icon: Contact },
                    { label: "Items", count: 30, icon: Package },
                    { label: "Work orders", count: 12, icon: Factory },
                    { label: "Sales orders", count: 18, icon: Tag },
                    { label: "Purchase orders", count: 10, icon: ShoppingCart },
                    { label: "Invoices", count: 10, icon: Receipt },
                    { label: "Journal entries", count: 38, icon: BookOpen },
                    { label: "Shipments", count: 7, icon: Truck },
                    { label: "Stock movements", count: 13, icon: Layers },
                    { label: "Time-off requests", count: 8, icon: Calendar },
                    { label: "Activity", count: 44, icon: Sparkles }
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-stone-50/60 dark:bg-stone-900/40 border border-stone-200/70 dark:border-stone-800 rounded-xl p-3.5 flex flex-col justify-between h-20 transition-all hover:border-stone-300 dark:hover:border-stone-700"
                    >
                      <div className="text-amber-700 dark:text-amber-400">
                        <item.icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-slate-900 dark:text-stone-100 leading-none mb-1">
                          {item.count}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                          {item.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer bar */}
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                    About 70 KB · 234 records · saved in this browser
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const exportBundle = {
                        workspace: profile.tradingName,
                        exportedAt: new Date().toISOString(),
                        metadata: {
                          totalRecords: 234,
                          size: "69.8 KB",
                          format: "JSON-v1.0"
                        },
                        company: profile,
                        permissions,
                        notificationSettings: notifSettings,
                        counts: {
                          people: 22,
                          contacts: 22,
                          items: 30,
                          workOrders: 12,
                          salesOrders: 18,
                          purchaseOrders: 10,
                          invoices: 10,
                          journalEntries: 38,
                          shipments: 7,
                          stockMovements: 13,
                          timeOffRequests: 8,
                          activityLogs: 44
                        }
                      };
                      const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `mfgops-workspace-export-${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      showToast("Export complete: 234 records downloaded as JSON.");
                    }}
                    className="px-4 py-2 rounded-full bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download JSON
                  </button>
                </div>
              </div>

              {/* Right Card: Reset demo data (xl:col-span-4) */}
              <div className="xl:col-span-4 bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <RotateCcw className="w-4 h-4 text-slate-800 dark:text-stone-200" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-stone-100">
                      Reset demo data
                    </h2>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                    Puts MfgOps back to Wednesday morning: every order, payment, approval and setting you changed is undone.
                  </p>

                  <div className="my-5 p-3.5 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-900 dark:text-rose-300 leading-relaxed">
                      <strong>This can&apos;t be undone.</strong> Export first if you want to keep what you&apos;ve done. Your theme choice stays.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Reset demo data back to Wednesday morning? Every order, goods receipt, approval, and setting you changed will be undone. Your theme choice stays.")) {
                        localStorage.removeItem("mfg-company-profile");
                        localStorage.removeItem("mfg-permissions-matrix");
                        localStorage.removeItem("mfg-accent-color");
                        localStorage.removeItem("mfg-ui-density");
                        localStorage.removeItem("mfg-week-start");
                        setProfile(DEFAULT_COMPANY);
                        setPermissions(INITIAL_PERMISSIONS);
                        setAccentColor("amber");
                        setDensity("comfortable");
                        setWeekStart("monday");
                        showToast("Workspace demo data restored to Wednesday morning baseline.");
                      }
                    }}
                    className="px-4 py-2 rounded-full bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset everything
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Role Members Detail Modal ── */}
      {selectedRoleModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedRoleModal(null)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-2xl p-6 relative max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs ${selectedRoleModal.color}`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-stone-100">
                      {selectedRoleModal.title} Personnel
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono text-xs font-bold">
                      {selectedRoleModal.members.length} {selectedRoleModal.members.length === 1 ? "member" : "members"}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    {selectedRoleModal.desc}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRoleModal(null)}
                className="p-1.5 text-stone-400 hover:text-slate-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar for Members */}
            <div className="pt-3.5 pb-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={roleMemberSearch}
                  onChange={(e) => setRoleMemberSearch(e.target.value)}
                  placeholder={`Search ${selectedRoleModal.title} by name, employee ID, or position...`}
                  className="w-full pl-8 pr-3.5 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>
            </div>

            {/* Members List (Scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-2.5 py-2 pr-1 divide-y divide-stone-100 dark:divide-stone-800/60">
              {selectedRoleModal.members
                .filter((m) => {
                  if (!roleMemberSearch.trim()) return true;
                  const q = roleMemberSearch.toLowerCase();
                  return (
                    m.name.toLowerCase().includes(q) ||
                    m.employeeId.toLowerCase().includes(q) ||
                    m.jobTitle.toLowerCase().includes(q) ||
                    m.department.toLowerCase().includes(q) ||
                    m.email.toLowerCase().includes(q) ||
                    m.workCenter.toLowerCase().includes(q)
                  );
                })
                .map((m) => (
                  <div
                    key={m.id}
                    className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl hover:bg-stone-50/80 dark:hover:bg-stone-900/50 transition-colors border border-transparent hover:border-stone-200/60 dark:hover:border-stone-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar with status indicator dot */}
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-stone-700 text-white font-bold text-xs flex items-center justify-center border border-stone-300 dark:border-stone-600 shadow-2xs">
                          {m.initials}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#18181B] ${
                            m.status === "present"
                              ? "bg-emerald-500"
                              : m.status === "remote"
                              ? "bg-amber-500"
                              : "bg-stone-400"
                          }`}
                          title={`Status: ${m.status}`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-stone-100 truncate">
                            {m.name}
                          </span>
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-sm">
                            {m.employeeId}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                              m.status === "present"
                                ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80"
                                : m.status === "remote"
                                ? "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80"
                                : "bg-stone-100 dark:bg-stone-800 text-stone-500"
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400 mt-0.5 truncate">
                          {m.jobTitle}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-0.5 flex-wrap">
                          <span>{m.department}</span>
                          <span>•</span>
                          <span className="truncate">{m.workCenter}</span>
                          <span>•</span>
                          <span className="font-mono">{m.shift}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between shrink-0 gap-1 pt-1 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
                      <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                        {m.email}
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">
                        Tenure: <span className="font-mono text-slate-700 dark:text-stone-300 font-semibold">{m.tenure}</span>
                      </span>
                    </div>
                  </div>
                ))}

              {selectedRoleModal.members.filter((m) => {
                if (!roleMemberSearch.trim()) return true;
                const q = roleMemberSearch.toLowerCase();
                return (
                  m.name.toLowerCase().includes(q) ||
                  m.employeeId.toLowerCase().includes(q) ||
                  m.jobTitle.toLowerCase().includes(q)
                );
              }).length === 0 && (
                <div className="py-8 text-center text-xs text-stone-400">
                  No personnel matching &ldquo;{roleMemberSearch}&rdquo; in {selectedRoleModal.title}.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedRoleModal(null);
                  navigate("/staff");
                }}
                className="text-xs text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Open in Staff Directory</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedRoleModal(null)}
                className="px-4 py-1.5 rounded-full bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
