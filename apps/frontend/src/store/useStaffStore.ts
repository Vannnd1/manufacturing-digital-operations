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
    location: "Southeast Works",
    tenure: "5.0 yrs",
    badge: "You",
  },
  {
    id: "st-2",
    name: "Mateo Ruiz",
    role: "Head of fabrication",
    department: "Fabrication",
    initials: "MR",
    avatarBg: "bg-orange-100 text-orange-800",
    status: "present",
    statusText: "In since 8:07 AM",
    skills: ["TIG", "Fixtures", "Geometry"],
    location: "Southeast Works",
    tenure: "6.6 yrs",
  },
  {
    id: "st-3",
    name: "Aiko Tanaka",
    role: "TIG welder",
    department: "Fabrication",
    initials: "AT",
    avatarBg: "bg-rose-100 text-rose-800",
    status: "present",
    statusText: "In since 7:14 AM",
    skills: ["TIG", "Fillet brazing"],
    location: "Southeast Works",
    tenure: "3.1 yrs",
  },
  {
    id: "st-4",
    name: "Kwame Mensah",
    role: "TIG welder",
    department: "Fabrication",
    initials: "KM",
    avatarBg: "bg-amber-100 text-amber-800",
    status: "present",
    statusText: "In since 8:21 AM",
    skills: ["TIG", "Stainless"],
    location: "Southeast Works",
    tenure: "2.1 yrs",
  },
  {
    id: "st-5",
    name: "Felix Wagner",
    role: "Machinist",
    department: "Fabrication",
    initials: "FW",
    avatarBg: "bg-slate-200 text-slate-800",
    status: "present",
    statusText: "In since 7:28 AM",
    skills: ["Mitering", "Lathe", "CNC"],
    location: "Southeast Works",
    tenure: "4.1 yrs",
  },
  {
    id: "st-6",
    name: "Lena Vogel",
    role: "Alignment technician",
    department: "Fabrication",
    initials: "LV",
    avatarBg: "bg-teal-100 text-teal-800",
    status: "present",
    statusText: "In since 8:35 AM",
    skills: ["Alignment", "Facing & reaming"],
    location: "Southeast Works",
    tenure: "2.7 yrs",
  },
  {
    id: "st-7",
    name: "Jonas Berg",
    role: "Powder coater",
    department: "Finishing",
    initials: "JB",
    avatarBg: "bg-blue-100 text-blue-800",
    status: "present",
    statusText: "In since 7:42 AM",
    skills: ["Powder coat", "Masking", "Decals"],
    location: "Southeast Works",
    tenure: "1.8 yrs",
  },
  {
    id: "st-8",
    name: "Amara Okafor",
    role: "Assembly lead",
    department: "Assembly",
    initials: "AO",
    avatarBg: "bg-emerald-100 text-emerald-800",
    status: "present",
    statusText: "In since 8:49 AM",
    skills: ["Build", "Hydraulics", "Di2"],
    location: "Southeast Works",
    tenure: "3.5 yrs",
  },
  {
    id: "st-9",
    name: "Diego Alvarez",
    role: "Bike assembler",
    department: "Assembly",
    initials: "DA",
    avatarBg: "bg-orange-100 text-orange-800",
    status: "present",
    statusText: "In since 7:56 AM",
    skills: ["Build", "Cables"],
    location: "Southeast Works",
    tenure: "1.1 yrs",
  },
  {
    id: "st-10",
    name: "Bo Andersen",
    role: "Wheel builder",
    department: "Assembly",
    initials: "BA",
    avatarBg: "bg-amber-100 text-amber-800",
    status: "present",
    statusText: "In since 9:24 AM",
    skills: ["Wheels", "Truing"],
    location: "Southeast Works",
    tenure: "2.4 yrs",
    badge: "Part-time",
  },
  {
    id: "st-11",
    name: "Hana Kim",
    role: "QC inspector",
    department: "Quality",
    initials: "HK",
    avatarBg: "bg-teal-100 text-teal-800",
    status: "leave",
    statusText: "On leave",
    skills: ["Inspection", "Torque audit"],
    location: "Southeast Works",
    tenure: "2.0 yrs",
  },
  {
    id: "st-12",
    name: "Tomás Silva",
    role: "Warehouse lead",
    department: "Warehouse",
    initials: "TS",
    avatarBg: "bg-emerald-100 text-emerald-800",
    status: "present",
    statusText: "In since 8:17 AM",
    skills: ["Receiving", "Cycle counts"],
    location: "Southeast Works",
    tenure: "3.7 yrs",
  },
  {
    id: "st-13",
    name: "Ravi Patel",
    role: "Logistics coordinator",
    department: "Warehouse",
    initials: "RP",
    avatarBg: "bg-blue-100 text-blue-800",
    status: "present",
    statusText: "In since 7:24 AM",
    skills: ["Freight", "Customs"],
    location: "Southeast Works",
    tenure: "1.5 yrs",
  },
  {
    id: "st-14",
    name: "Yusuf Kaya",
    role: "Delivery driver",
    department: "Warehouse",
    initials: "YK",
    avatarBg: "bg-stone-200 text-stone-800",
    status: "present",
    statusText: "In since 8:31 AM",
    skills: ["CDL", "White glove"],
    location: "Southeast Works",
    tenure: "10 mo",
  },
  {
    id: "st-15",
    name: "Grace Liu",
    role: "Purchasing manager",
    department: "Purchasing",
    initials: "GL",
    avatarBg: "bg-amber-100 text-amber-800",
    status: "present",
    statusText: "In since 7:38 AM",
    skills: ["Sourcing", "Negotiation"],
    location: "Southeast Works",
    tenure: "4.4 yrs",
  },
  {
    id: "st-16",
    name: "Omar Farouk",
    role: "Head of sales",
    department: "Operations",
    initials: "OF",
    avatarBg: "bg-rose-100 text-rose-800",
    status: "remote",
    statusText: "Remote today",
    skills: ["Dealers", "Trade shows"],
    location: "Denver",
    tenure: "3.2 yrs",
  },
  {
    id: "st-17",
    name: "Elif Demir",
    role: "Account manager",
    department: "Purchasing",
    initials: "ED",
    avatarBg: "bg-pink-100 text-pink-800",
    status: "present",
    statusText: "In since 7:52 AM",
    skills: ["Dealers", "CRM"],
    location: "Southeast Works",
    tenure: "1.3 yrs",
  },
  {
    id: "st-18",
    name: "Inès Moreau",
    role: "Showroom manager",
    department: "Operations",
    initials: "IM",
    avatarBg: "bg-lime-100 text-lime-800",
    status: "present",
    statusText: "In since 8:59 AM",
    skills: ["Fitting", "Retail"],
    location: "Division St",
    tenure: "2.8 yrs",
  },
  {
    id: "st-19",
    name: "Sam Whitfield",
    role: "Showroom associate",
    department: "Operations",
    initials: "SW",
    avatarBg: "bg-yellow-100 text-yellow-800",
    status: "leave",
    statusText: "Off today",
    skills: ["Retail", "Repairs"],
    location: "Division St",
    tenure: "6 mo",
    badge: "Part-time",
  },
  {
    id: "st-20",
    name: "Priya Raman",
    role: "Finance manager",
    department: "Finance",
    initials: "PR",
    avatarBg: "bg-emerald-100 text-emerald-800",
    status: "present",
    statusText: "In since 8:13 AM",
    skills: ["GAAP", "Forecasting"],
    location: "Southeast Works",
    tenure: "4.7 yrs",
  },
  {
    id: "st-21",
    name: "Maya Cohen",
    role: "Accountant",
    department: "Finance",
    initials: "MC",
    avatarBg: "bg-blue-100 text-blue-800",
    status: "remote",
    statusText: "Remote today",
    skills: ["AP/AR", "Reconciliation"],
    location: "Seattle",
    tenure: "12 mo",
    badge: "Contractor",
  },
  {
    id: "st-22",
    name: "Zoe Martin",
    role: "People & culture",
    department: "Operations",
    initials: "ZM",
    avatarBg: "bg-rose-100 text-rose-800",
    status: "present",
    statusText: "In since 8:27 AM",
    skills: ["Hiring", "Payroll", "Benefits"],
    location: "Southeast Works",
    tenure: "2.4 yrs",
  },
];

interface StaffState {
  staff: StaffMember[];
  updateStatus: (id: string, status: "present" | "remote" | "leave") => void;
  syncCurrentUser: (name: string, role?: string) => void;
  resetStaff: () => void;
}

const STORAGE_KEY = "mfg_staff_directory_v2";

const loadInitialStaff = (): StaffMember[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: StaffMember[] = JSON.parse(saved);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STAFF));
    } catch {
      // ignore
    }
    set({ staff: DEFAULT_STAFF });
  },
}));
