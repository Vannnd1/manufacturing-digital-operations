import { create } from "zustand";

export interface StaffMember {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  department:
    | "Plant Operations"
    | "AC Manufacturing"
    | "Refrigerator Line"
    | "Washing Machine Line"
    | "Display & TV Line"
    | "Quality Assurance"
    | "Warehouse & Logistics"
    | "Procurement & Sourcing"
    | "Plant Engineering"
    | "Finance";
  workCenter: string;
  shift: string;
  initials: string;
  avatarBg: string; // Tailwind bg class
  status: "present" | "remote" | "leave";
  statusText: string;
  skills: string[];
  certifications: string[];
  location: string;
  tenure: string;
  badge?: "You" | "Part-time" | "Contractor";
}

const DEFAULT_STAFF: StaffMember[] = [
  {
    id: "st-1",
    employeeId: "PMI-OPS-001",
    name: "Lead Operations Admin",
    role: "Plant Operations Supervisor",
    department: "Plant Operations",
    workCenter: "Central Control & MES Dispatch",
    shift: "General Shift (08:00 – 17:00 WIB)",
    initials: "LA",
    avatarBg: "bg-slate-900 text-white dark:bg-amber-600 dark:text-white",
    status: "present",
    statusText: "In since 7:00 AM",
    skills: ["MES Administration", "Line Balancing", "Production Dispatch", "Kaizen"],
    certifications: ["ISO 9001 Lead Auditor", "Six Sigma Green Belt"],
    location: "Main Plant · Control Center",
    tenure: "5.0 yrs",
    badge: "You",
  },
  {
    id: "st-2",
    employeeId: "PMI-AC-002",
    name: "Felix Wagner",
    role: "AC Tooling & Forming Specialist",
    department: "AC Manufacturing",
    workCenter: "WC-AC-01 · AC Tube Bending & Heat Exchanger",
    shift: "Shift 1 (07:00 – 15:30 WIB)",
    initials: "FW",
    avatarBg: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
    status: "present",
    statusText: "In since 7:15 AM",
    skills: ["CNC Tube Bending", "Fin Expansion", "Hairpin Bending", "Dimensional QA"],
    certifications: ["CNC Master Operator", "Hydraulic Press Level 2"],
    location: "Plant 1 · AC Split Bay 1",
    tenure: "4.1 yrs",
  },
  {
    id: "st-3",
    employeeId: "PMI-AC-003",
    name: "Aiko Tanaka",
    role: "Refrigerant Brazing Lead",
    department: "AC Manufacturing",
    workCenter: "WC-AC-01 · AC Tube Bending & Heat Exchanger",
    shift: "Shift 1 (07:00 – 15:30 WIB)",
    initials: "AT",
    avatarBg: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    status: "present",
    statusText: "In since 7:14 AM",
    skills: ["Hermetic Copper Brazing", "Silver Solder Alloy", "Nitrogen Purging"],
    certifications: ["AWS D1.3 Sheet Welding", "EPA 608 Universal Brazing"],
    location: "Plant 1 · AC Split Bay 1",
    tenure: "3.1 yrs",
  },
  {
    id: "st-4",
    employeeId: "PMI-AC-004",
    name: "Jonas Berg",
    role: "Refrigerant Charging & Vacuum Tech",
    department: "AC Manufacturing",
    workCenter: "WC-AC-02 · Inverter & Refrigerant Vacuum Bay",
    shift: "Shift 1 (07:00 – 15:30 WIB)",
    initials: "JB",
    avatarBg: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
    status: "present",
    statusText: "In since 7:30 AM",
    skills: ["R32 Freon Charging", "Deep Vacuum Evacuation", "Ultrasonic Sniffing"],
    certifications: ["EPA 608 Universal", "F-Gas Safety Standard"],
    location: "Plant 1 · AC Split Bay 2",
    tenure: "1.8 yrs",
  },
  {
    id: "st-5",
    employeeId: "PMI-AC-005",
    name: "Lena Vogel",
    role: "Inverter Drive & PCB Specialist",
    department: "AC Manufacturing",
    workCenter: "WC-AC-02 · Inverter & Refrigerant Vacuum Bay",
    shift: "Shift 2 (15:30 – 23:00 WIB)",
    initials: "LV",
    avatarBg: "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200",
    status: "present",
    statusText: "Shift 2 Active",
    skills: ["Inverter PCB Harness", "DC Compressor Tuning", "EMC Grounding", "Acoustic Check"],
    certifications: ["IPC-A-610 Specialist", "Hi-Pot Safety Gate"],
    location: "Plant 1 · AC Split Bay 2",
    tenure: "2.7 yrs",
  },
  {
    id: "st-6",
    employeeId: "PMI-RF-006",
    name: "Mateo Ruiz",
    role: "Refrigerator Line Supervisor",
    department: "Refrigerator Line",
    workCenter: "WC-RF-01 · Refrigerator Cabinet & PU Foaming",
    shift: "Shift 1 (07:00 – 15:30 WIB)",
    initials: "MR",
    avatarBg: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
    status: "present",
    statusText: "In since 7:05 AM",
    skills: ["Cabinet Roll Forming", "HIPS Liner Vacuuming", "PU Foam Injection", "Die Setup"],
    certifications: ["ISO 9001 Process Lead", "Sheet Stamping Master"],
    location: "Plant 2 · Refrigerator Line A",
    tenure: "6.6 yrs",
  },
  {
    id: "st-7",
    employeeId: "PMI-RF-007",
    name: "Kwame Mensah",
    role: "Rigid PU Foam Injection Tech",
    department: "Refrigerator Line",
    workCenter: "WC-RF-01 · Refrigerator Cabinet & PU Foaming",
    shift: "Shift 1 (07:00 – 15:30 WIB)",
    initials: "KM",
    avatarBg: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    status: "present",
    statusText: "In since 7:20 AM",
    skills: ["PU Foam High-Pressure Metering", "Thermal Conductivity Check", "Door Gasket Seal"],
    certifications: ["Chemical Safety Hazard A", "Pressure Vessel Level 1"],
    location: "Plant 2 · Refrigerator Line A",
    tenure: "2.1 yrs",
  },
  {
    id: "st-8",
    employeeId: "PMI-WM-008",
    name: "Bo Andersen",
    role: "Washer Drum & Mechanics Lead",
    department: "Washing Machine Line",
    workCenter: "WC-WM-01 · Washing Machine Drum & Motor Integration",
    shift: "Shift 1 (07:00 – 15:30 WIB)",
    initials: "BA",
    avatarBg: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
    status: "present",
    statusText: "In since 7:10 AM",
    skills: ["Stainless Drum Seaming", "Flange Riveting", "PP Tub Injection", "Centrifugal Balance"],
    certifications: ["Rotary Dynamic Balance ISO 1940", "Injection Mold Setup"],
    location: "Plant 2 · Washing Machine Bay",
    tenure: "2.4 yrs",
  },
  {
    id: "st-9",
    employeeId: "PMI-WM-009",
    name: "Diego Alvarez",
    role: "BLDC Motor & Suspension Assembly",
    department: "Washing Machine Line",
    workCenter: "WC-WM-01 · Washing Machine Drum & Motor Integration",
    shift: "Shift 1 (07:00 – 15:30 WIB)",
    initials: "DA",
    avatarBg: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
    status: "present",
    statusText: "In since 7:25 AM",
    skills: ["BLDC Motor Mount", "Vibration Damper Tuning", "Water Flow Test", "Torque Spec"],
    certifications: ["Calibrated Torque Spec Tech"],
    location: "Plant 2 · Washing Machine Bay",
    tenure: "1.1 yrs",
  },
  {
    id: "st-10",
    employeeId: "PMI-TV-010",
    name: "Amara Okafor",
    role: "SMT Mainboard Cleanroom Lead",
    department: "Display & TV Line",
    workCenter: "WC-TV-01 · SMT & Display Panel Lamination",
    shift: "Shift 1 (07:00 – 15:30 WIB)",
    initials: "AO",
    avatarBg: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200",
    status: "present",
    statusText: "In since 7:00 AM",
    skills: ["SMT Pick & Place", "AOI Optical Inspection", "Reflow Oven Profiling", "ESD Class 0"],
    certifications: ["IPC-A-610 Class 3 Trainer", "ESD Coordinator"],
    location: "Plant 3 · Cleanroom Bay 1",
    tenure: "3.5 yrs",
  },
  {
    id: "st-11",
    employeeId: "PMI-TV-011",
    name: "Hana Kim",
    role: "Display Panel & Optical Bonding Tech",
    department: "Display & TV Line",
    workCenter: "WC-TV-01 · SMT & Display Panel Lamination",
    shift: "Shift 1 (07:00 – 15:30 WIB)",
    initials: "HK",
    avatarBg: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
    status: "present",
    statusText: "In since 7:15 AM",
    skills: ["Open-Cell Panel Bonding", "Backlight Matrix Lamination", "Pixel Uniformity QA"],
    certifications: ["Cleanroom Class 1000 Operator", "Colorimetry Calibration"],
    location: "Plant 3 · Cleanroom Bay 1",
    tenure: "2.0 yrs",
  },
  {
    id: "st-12",
    employeeId: "PMI-QAC-012",
    name: "Rendra Setiawan",
    role: "Head of Quality Assurance (QA)",
    department: "Quality Assurance",
    workCenter: "WC-QC-01 · High-Voltage Dielectric Gate",
    shift: "General Shift (08:00 – 17:00 WIB)",
    initials: "RS",
    avatarBg: "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200",
    status: "present",
    statusText: "In since 7:45 AM",
    skills: ["SNI / IEC Standard Compliance", "Dielectric Hi-Pot Safety", "Acoustic Noise dBA", "Six Sigma"],
    certifications: ["ISO 9001/14001 Lead Auditor", "Six Sigma Black Belt"],
    location: "Central QC Testing Lab",
    tenure: "7.2 yrs",
  },
  {
    id: "st-13",
    employeeId: "PMI-QAC-013",
    name: "Dewi Anggraini",
    role: "Electrical Safety & Dielectric Inspector",
    department: "Quality Assurance",
    workCenter: "WC-QC-01 · High-Voltage Dielectric Gate",
    shift: "Shift 1 (07:00 – 15:30 WIB)",
    initials: "DA",
    avatarBg: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
    status: "present",
    statusText: "In since 7:10 AM",
    skills: ["Hi-Pot Dielectric Insulation", "Earth Continuity Test", "Leakage Current Check"],
    certifications: ["IEC 60335 Safety Gate", "High-Voltage Level 2"],
    location: "Central QC Testing Lab",
    tenure: "3.4 yrs",
  },
  {
    id: "st-14",
    employeeId: "PMI-LOG-014",
    name: "Tomás Silva",
    role: "Warehouse Logistics Supervisor",
    department: "Warehouse & Logistics",
    workCenter: "Warehouse Bay 1 · Raw Material Hub",
    shift: "Shift 1 (07:00 – 15:30 WIB)",
    initials: "TS",
    avatarBg: "bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-stone-200",
    status: "present",
    statusText: "In since 7:12 AM",
    skills: ["Inventory Replenishment", "Customs HS Tracking", "FIFO Storage Management"],
    certifications: ["WMS Lead", "Hazardous Material Handler"],
    location: "Logistics Hub Bay 1",
    tenure: "3.7 yrs",
  },
  {
    id: "st-15",
    employeeId: "PMI-LOG-015",
    name: "Ravi Patel",
    role: "Customs & Trade Compliance Officer",
    department: "Warehouse & Logistics",
    workCenter: "Warehouse Bay 2 · Bonded Customs Zone",
    shift: "General Shift (08:00 – 17:00 WIB)",
    initials: "RP",
    avatarBg: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
    status: "present",
    statusText: "In since 7:50 AM",
    skills: ["BTKI/HS Code Compliance", "Customs Declaration (BC 2.0)", "Freight Audit"],
    certifications: ["Customs Broker License (PPJK)", "Trade Compliance Specialist"],
    location: "Logistics Hub Bay 2",
    tenure: "1.5 yrs",
  },
  {
    id: "st-16",
    employeeId: "PMI-LOG-016",
    name: "Yusuf Kaya",
    role: "Heavy Material Handler & Driver",
    department: "Warehouse & Logistics",
    workCenter: "Warehouse Bay 3 · Heavy Coil Staging",
    shift: "Shift 1 (07:00 – 15:30 WIB)",
    initials: "YK",
    avatarBg: "bg-stone-300 text-stone-900 dark:bg-stone-700 dark:text-stone-200",
    status: "present",
    statusText: "In since 7:00 AM",
    skills: ["Overhead Crane Staging", "Forklift 5-Ton Operations", "Steel Coil Stacking"],
    certifications: ["SIO Crane Class A", "SIO Forklift Operator"],
    location: "Logistics Hub Bay 3",
    tenure: "10 mo",
  },
  {
    id: "st-17",
    employeeId: "PMI-PRC-017",
    name: "Grace Liu",
    role: "Procurement & Sourcing Manager",
    department: "Procurement & Sourcing",
    workCenter: "Procurement Operations",
    shift: "General Shift (08:00 – 17:00 WIB)",
    initials: "GL",
    avatarBg: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    status: "present",
    statusText: "In since 7:40 AM",
    skills: ["Strategic Raw Material Sourcing", "Supplier Evaluation", "BOM Price Forecasting"],
    certifications: ["CPIM APICS", "Contract Negotiation Lead"],
    location: "Administrative Office",
    tenure: "4.4 yrs",
  },
  {
    id: "st-18",
    employeeId: "PMI-PRC-018",
    name: "Elif Demir",
    role: "Vendor Relations & PO Specialist",
    department: "Procurement & Sourcing",
    workCenter: "Procurement Operations",
    shift: "General Shift (08:00 – 17:00 WIB)",
    initials: "ED",
    avatarBg: "bg-pink-100 text-pink-900 dark:bg-pink-950 dark:text-pink-200",
    status: "remote",
    statusText: "Supplier Audit (Nippon Steel)",
    skills: ["PO Tracking", "Supplier Quality Agreements", "ERP Procurement"],
    certifications: ["Certified Procurement Professional"],
    location: "Supplier Field Audit",
    tenure: "1.3 yrs",
  },
  {
    id: "st-19",
    employeeId: "PMI-OPS-019",
    name: "Inès Moreau",
    role: "Master Production Scheduler (MPS)",
    department: "Plant Operations",
    workCenter: "Central Control & MES Dispatch",
    shift: "General Shift (08:00 – 17:00 WIB)",
    initials: "IM",
    avatarBg: "bg-lime-100 text-lime-900 dark:bg-lime-950 dark:text-lime-200",
    status: "present",
    statusText: "In since 7:35 AM",
    skills: ["Gantt Sequenced Scheduling", "Capacity Planning", "OEE Optimization"],
    certifications: ["APICS CSCP", "OEE Specialist"],
    location: "Central Control Office",
    tenure: "2.8 yrs",
  },
  {
    id: "st-20",
    employeeId: "PMI-ENG-020",
    name: "Sam Whitfield",
    role: "Automation & Maintenance Tech",
    department: "Plant Engineering",
    workCenter: "Plant Tooling & Maintenance Bay",
    shift: "Shift 2 (15:30 – 23:00 WIB)",
    initials: "SW",
    avatarBg: "bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200",
    status: "present",
    statusText: "Shift 2 Active",
    skills: ["Omron & Panasonic PLC", "Robotic Arm Calibration", "Hydraulics Maintenance"],
    certifications: ["PLC Automation Level 3", "Lockout/Tagout (LOTO)"],
    location: "Maintenance Workshop",
    tenure: "2.1 yrs",
  },
  {
    id: "st-21",
    employeeId: "PMI-FIN-021",
    name: "Priya Raman",
    role: "Plant Cost Accountant Lead",
    department: "Finance",
    workCenter: "Plant Administration",
    shift: "General Shift (08:00 – 17:00 WIB)",
    initials: "PR",
    avatarBg: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
    status: "present",
    statusText: "In since 8:15 AM",
    skills: ["Standard Cost Variance", "BOM Valuation", "ERP Financial Reporting"],
    certifications: ["CPA", "SAP ERP Finance"],
    location: "Administrative Office",
    tenure: "4.7 yrs",
  },
  {
    id: "st-22",
    employeeId: "PMI-EHS-022",
    name: "Zoe Martin",
    role: "Plant EHS & Safety Specialist",
    department: "Plant Operations",
    workCenter: "Central Safety & EHS Desk",
    shift: "General Shift (08:00 – 17:00 WIB)",
    initials: "ZM",
    avatarBg: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
    status: "leave",
    statusText: "On leave (Annual Leave)",
    skills: ["SMK3 Occupational Safety", "Incident Investigation", "Ergonomics Assessment"],
    certifications: ["Ahli K3 Umum Kemenaker", "ISO 45001 Auditor"],
    location: "Administrative Office",
    tenure: "2.4 yrs",
  },
];

interface StaffState {
  staff: StaffMember[];
  updateStatus: (id: string, status: "present" | "remote" | "leave") => void;
  syncCurrentUser: (name: string, role?: string) => void;
  resetStaff: () => void;
}

const STORAGE_KEY = "mfg_staff_directory_v5";

const loadInitialStaff = (): StaffMember[] => {
  try {
    // Purge older legacy cache keys
    localStorage.removeItem("mfg_staff_directory");
    localStorage.removeItem("mfg_staff_directory_v1");
    localStorage.removeItem("mfg_staff_directory_v2");
    localStorage.removeItem("mfg_staff_directory_v3");
    localStorage.removeItem("mfg_staff_directory_v4");

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: StaffMember[] = JSON.parse(saved);
      const rawText = JSON.stringify(parsed).toLowerCase();
      if (
        rawText.includes("bike") ||
        rawText.includes("wheel") ||
        rawText.includes("showroom") ||
        rawText.includes("southeast works")
      ) {
        localStorage.removeItem(STORAGE_KEY);
        return DEFAULT_STAFF;
      }
      return parsed;
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
          else if (status === "remote") statusText = "Remote / Field Duty";
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
      localStorage.removeItem("mfg_staff_directory_v4");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STAFF));
    } catch {
      // ignore
    }
    set({ staff: DEFAULT_STAFF });
  },
}));
