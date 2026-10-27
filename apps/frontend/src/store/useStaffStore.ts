import { create } from "zustand";

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: "Operations" | "Fabrication" | "Finishing" | "Assembly" | "Quality" | "Warehouse" | "Purchasing" | "Finance";
  initials: string;
  avatarBg: string; // Tailwind bg class
  status: "present" | "remote" | "leave";
  statusText: string;
  skills: string[];
  location: string;
  tenure: string;
  badge?: "You" | "Part-time" | "Contractor";
}

const DEFAULT_STAFF: StaffMember[] = [
  {
    id: "st-1",
    name: "Lead Admin",
    role: "Plant Operations Admin",
    department: "Operations",
    initials: "LA",
    avatarBg: "bg-slate-900 text-white",
    status: "present",
    statusText: "In since 7:00 AM",
    skills: ["Planning", "Plant Operations", "ERP Administration"],
    location: "Main Facility",
    tenure: "5.0 yrs",
    badge: "You",
  },
  {
    id: "st-2",
    name: "Mateo Ruiz",
    role: "Head of Fabrication",
    department: "Fabrication",
    initials: "MR",
    avatarBg: "bg-orange-100 text-orange-800",
    status: "present",
    statusText: "In since 8:07 AM",
    skills: ["TIG", "Fixtures", "Geometry"],
    location: "Main Facility",
    tenure: "6.6 yrs",
  },
  {
    id: "st-3",
    name: "Aiko Tanaka",
    role: "TIG Welder",
    department: "Fabrication",
    initials: "AT",
    avatarBg: "bg-rose-100 text-rose-800",
    status: "present",
    statusText: "In since 7:14 AM",
    skills: ["TIG Welding", "Robotic Welding"],
    location: "Main Facility",
    tenure: "3.1 yrs",
  },
  {
    id: "st-4",
    name: "Kwame Mensah",
    role: "TIG Welder",
    department: "Fabrication",
    initials: "KM",
    avatarBg: "bg-amber-100 text-amber-800",
    status: "present",
    statusText: "In since 8:21 AM",
    skills: ["TIG Welding", "Stainless Sheet"],
    location: "Main Facility",
    tenure: "2.1 yrs",
  },
  {
    id: "st-5",
    name: "Felix Wagner",
    role: "CNC Machinist",
    department: "Fabrication",
    initials: "FW",
    avatarBg: "bg-slate-200 text-slate-800",
    status: "present",
    statusText: "In since 7:28 AM",
    skills: ["Mitering", "Lathe", "5-Axis CNC"],
    location: "Main Facility",
    tenure: "4.1 yrs",
  },
  {
    id: "st-6",
    name: "Lena Vogel",
    role: "Laser Alignment Tech",
    department: "Fabrication",
    initials: "LV",
    avatarBg: "bg-teal-100 text-teal-800",
    status: "present",
    statusText: "In since 8:35 AM",
    skills: ["Laser Alignment", "Tolerance Verification"],
    location: "Main Facility",
    tenure: "2.7 yrs",
  },
  {
    id: "st-7",
    name: "Jonas Berg",
    role: "Powder Coater",
    department: "Finishing",
    initials: "JB",
    avatarBg: "bg-blue-100 text-blue-800",
    status: "present",
    statusText: "In since 7:42 AM",
    skills: ["Powder Coat", "Masking", "Thermal Curing"],
    location: "Main Facility",
    tenure: "1.8 yrs",
  },
  {
    id: "st-8",
    name: "Amara Okafor",
    role: "Assembly Lead",
    department: "Assembly",
    initials: "AO",
    avatarBg: "bg-emerald-100 text-emerald-800",
    status: "present",
    statusText: "In since 8:49 AM",
    skills: ["Sub-Assembly", "Hydraulics", "Wiring"],
    location: "Main Facility",
    tenure: "3.5 yrs",
  },
  {
    id: "st-9",
    name: "Diego Alvarez",
    role: "Assembly Technician",
    department: "Assembly",
    initials: "DA",
    avatarBg: "bg-orange-100 text-orange-800",
    status: "present",
    statusText: "In since 7:56 AM",
    skills: ["Assembly", "Fastening", "Torque Spec"],
    location: "Main Facility",
    tenure: "1.1 yrs",
  },
  {
    id: "st-10",
    name: "Bo Andersen",
    role: "Electrical Wiring Tech",
    department: "Assembly",
    initials: "BA",
    avatarBg: "bg-amber-100 text-amber-800",
    status: "present",
    statusText: "In since 9:24 AM",
    skills: ["Wiring", "Terminal Crimping", "Dielectric Check"],
    location: "Main Facility",
    tenure: "2.4 yrs",
    badge: "Part-time",
  },
  {
    id: "st-11",
    name: "Hana Kim",
    role: "QC Inspector",
    department: "Quality",
    initials: "HK",
    avatarBg: "bg-teal-100 text-teal-800",
    status: "leave",
    statusText: "On leave",
    skills: ["Inspection", "CMM Audit", "ISO 9001"],
    location: "Main Facility",
    tenure: "2.0 yrs",
  },
  {
    id: "st-12",
    name: "Tomás Silva",
    role: "Warehouse Lead",
    department: "Warehouse",
    initials: "TS",
    avatarBg: "bg-emerald-100 text-emerald-800",
    status: "present",
    statusText: "In since 8:17 AM",
    skills: ["Receiving", "Cycle Counts", "WMS"],
    location: "Plant 2 - Logistics Center",
    tenure: "3.7 yrs",
  },
  {
    id: "st-13",
    name: "Ravi Patel",
    role: "Logistics Coordinator",
    department: "Warehouse",
    initials: "RP",
    avatarBg: "bg-blue-100 text-blue-800",
    status: "present",
    statusText: "In since 7:24 AM",
    skills: ["Freight", "Customs", "Shipping"],
    location: "Plant 2 - Logistics Center",
    tenure: "1.5 yrs",
  },
  {
    id: "st-14",
    name: "Yusuf Kaya",
    role: "Material Handler & Driver",
    department: "Warehouse",
    initials: "YK",
    avatarBg: "bg-stone-200 text-stone-800",
    status: "present",
    statusText: "In since 8:31 AM",
    skills: ["CDL-A", "Forklift Certified", "Hazardous Material"],
    location: "Plant 2 - Logistics Center",
    tenure: "10 mo",
  },
  {
    id: "st-15",
    name: "Grace Liu",
    role: "Purchasing Manager",
    department: "Purchasing",
    initials: "GL",
    avatarBg: "bg-amber-100 text-amber-800",
    status: "present",
    statusText: "In since 7:38 AM",
    skills: ["Sourcing", "Supplier Negotiation", "BOM Costing"],
    location: "Main Facility",
    tenure: "4.4 yrs",
  },
  {
    id: "st-16",
    name: "Omar Farouk",
    role: "Head of Operations & Sales",
    department: "Operations",
    initials: "OF",
    avatarBg: "bg-rose-100 text-rose-800",
    status: "remote",
    statusText: "Remote today",
    skills: ["OEM Accounts", "Client SLA", "Contracts"],
    location: "Regional Office",
    tenure: "3.2 yrs",
  },
  {
    id: "st-17",
    name: "Elif Demir",
    role: "Procurement Specialist",
    department: "Purchasing",
    initials: "ED",
    avatarBg: "bg-pink-100 text-pink-800",
    status: "present",
    statusText: "In since 7:52 AM",
    skills: ["Vendor Relations", "PO Tracking", "ERP"],
    location: "Main Facility",
    tenure: "1.3 yrs",
  },
  {
    id: "st-18",
    name: "Inès Moreau",
    role: "Production Scheduler",
    department: "Operations",
    initials: "IM",
    avatarBg: "bg-lime-100 text-lime-800",
    status: "present",
    statusText: "In since 8:59 AM",
    skills: ["Production Scheduling", "Capacity Planning", "Kanban"],
    location: "Main Facility",
    tenure: "2.8 yrs",
  },
  {
    id: "st-19",
    name: "Sam Whitfield",
    role: "Maintenance Technician",
    department: "Operations",
    initials: "SW",
    avatarBg: "bg-yellow-100 text-yellow-800",
    status: "leave",
    statusText: "Off today",
    skills: ["Preventive Maintenance", "Hydraulics", "PLC Automation"],
    location: "Main Facility",
    tenure: "6 mo",
    badge: "Part-time",
  },
  {
    id: "st-20",
    name: "Priya Raman",
    role: "Finance Manager",
    department: "Finance",
    initials: "PR",
    avatarBg: "bg-emerald-100 text-emerald-800",
    status: "present",
    statusText: "In since 8:13 AM",
    skills: ["Cost Accounting", "Forecasting", "GAAP"],
    location: "Main Facility",
    tenure: "4.7 yrs",
  },
  {
    id: "st-21",
    name: "Maya Cohen",
    role: "Staff Accountant",
    department: "Finance",
    initials: "MC",
    avatarBg: "bg-blue-100 text-blue-800",
    status: "remote",
    statusText: "Remote today",
    skills: ["AP/AR", "Reconciliation", "ERP Audit"],
    location: "Remote",
    tenure: "12 mo",
    badge: "Contractor",
  },
  {
    id: "st-22",
    name: "Zoe Martin",
    role: "HR & Plant Safety Specialist",
    department: "Operations",
    initials: "ZM",
    avatarBg: "bg-rose-100 text-rose-800",
    status: "present",
    statusText: "In since 8:27 AM",
    skills: ["EHS Compliance", "Workforce Training", "Payroll"],
    location: "Main Facility",
    tenure: "2.4 yrs",
  },
];

interface StaffState {
  staff: StaffMember[];
  updateStatus: (id: string, status: "present" | "remote" | "leave") => void;
  syncCurrentUser: (name: string, role?: string) => void;
  resetStaff: () => void;
}

const STORAGE_KEY = "mfg_staff_directory_v4";

const loadInitialStaff = (): StaffMember[] => {
  try {
    // Purge older legacy cache keys
    localStorage.removeItem("mfg_staff_directory");
    localStorage.removeItem("mfg_staff_directory_v1");
    localStorage.removeItem("mfg_staff_directory_v2");
    localStorage.removeItem("mfg_staff_directory_v3");

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: StaffMember[] = JSON.parse(saved);
      const rawText = JSON.stringify(parsed).toLowerCase();
      // Ensure no legacy bike or Cadra mock terms persist in cache
      if (
        rawText.includes("bike") ||
        rawText.includes("wheel") ||
        rawText.includes("showroom") ||
        rawText.includes("southeast works")
      ) {
        localStorage.removeItem(STORAGE_KEY);
        return DEFAULT_STAFF;
      }

      return parsed.map((m) =>
        m.id === "st-1" && m.name === "Noor Haddad"
          ? {
              ...m,
              name: "Lead Admin",
              role: "Plant Operations Admin",
              initials: "LA",
              avatarBg: "bg-slate-900 text-white",
            }
          : m
      );
    }
  } catch {
    // fallback
  }
  return DEFAULT_STAFF;
};

export const useStaffStore = create<StaffState>((set) => ({
  staff: loadInitialStaff(),
  syncCurrentUser: (name, role) => {
    if (!name) return;
    set((state) => {
      const initials = name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      const updated = state.staff.map((m) => {
        if (m.id === "st-1") {
          return {
            ...m,
            name,
            role: role ? `${role} Lead` : m.role,
            initials: initials || "AD",
            badge: "You" as const,
          };
        }
        return m;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return { staff: updated };
    });
  },
  updateStatus: (id, status) => {
    set((state) => {
      const updated = state.staff.map((member) => {
        if (member.id === id) {
          let statusText = "Present";
          if (status === "present") statusText = "In since 8:00 AM";
          else if (status === "remote") statusText = "Remote today";
          else if (status === "leave") statusText = "On leave";

          return { ...member, status, statusText };
        }
        return member;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return { staff: updated };
    });
  },
  resetStaff: () => {
    try {
      localStorage.removeItem("mfg_staff_directory_v2");
      localStorage.removeItem("mfg_staff_directory_v3");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STAFF));
    } catch {
      // ignore
    }
    set({ staff: DEFAULT_STAFF });
  },
}));
