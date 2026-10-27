import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import {
  Search,
  BookOpen,
  Send,
  Lock,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CheckCircle2,
  Layers,
  Package,
  Users,
  ShieldCheck,
  Check,
  Radio,
  FileText,
  Wrench,
  HardHat,
  Cpu,
  Zap,
  X,
  Printer,
  Phone,
  AlertOctagon
} from "lucide-react";
import { Button } from "../components/ui";

interface Ticket {
  id: string;
  title: string;
  workCenter: string;
  category: "Machine & Tooling" | "Production Flow" | "Material & BOM" | "Quality Hold" | "Digital Ops & IoT";
  priority: "Critical (P1)" | "High (P2)" | "Normal (P3)" | "Low (P4)";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  timeAgo: string;
  workOrderId?: string;
  reporter: string;
  responder?: {
    name: string;
    role: string;
    message: string;
    resolvedAt?: string;
  };
  replies?: {
    id: string;
    author: string;
    role: string;
    message: string;
    time: string;
  }[];
}

interface SOPItem {
  code: string;
  title: string;
  revision: string;
  workCenter: string;
  category: "Machining" | "Welding" | "Quality" | "Inventory" | "Assembly" | "IoT";
  readTime: string;
  desc: string;
  ppe: string[];
  parameters: { label: string; value: string }[];
  steps: string[];
  criteria: string;
  icon: any;
}

export function Support() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userName = user?.name?.split(" ")[0] || "Operator";
  const userRole = user?.role || "Production Operator";

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  // FAQ Accordion state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Modal states
  const [selectedSop, setSelectedSop] = useState<SOPItem | null>(null);
  const [isAllSopsOpen, setIsAllSopsOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [contactModalPerson, setContactModalPerson] = useState<{
    name: string;
    role: string;
    initial: string;
    color: string;
    ext: string;
  } | null>(null);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [radioPagingSent, setRadioPagingSent] = useState(false);
  const [ticketFollowUpText, setTicketFollowUpText] = useState("");

  // Feedback toast
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Tickets state
  const [ticketFilter, setTicketFilter] = useState<"All" | "Active" | "Resolved" | "Closed">("All");
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: "INC-2026-084",
      title: "Laser cutter WC-101 assist gas pressure warning during chassis sheet cutting",
      workCenter: "WC-101 · Laser Cutting & CNC Bending",
      workOrderId: "WO-2042",
      category: "Machine & Tooling",
      priority: "High (P2)",
      status: "In Progress",
      timeAgo: "22 min ago",
      reporter: "Felix Wagner",
      responder: {
        name: "Bo Andersen",
        role: "Lead Maintenance & Automation Tech",
        message:
          "Regulated nitrogen pressure valve to 14.5 bar and inspected optical nozzle alignment. Test cut on 2mm cold-rolled steel sheet passed with zero slag.",
      },
      replies: [
        {
          id: "r1",
          author: "Felix Wagner",
          role: "CNC Operator",
          message: "Gas assist pressure dropped suddenly to 9.2 bar while cutting the 12th chassis sheet blank.",
          time: "24 min ago",
        },
        {
          id: "r2",
          author: "Bo Andersen",
          role: "Lead Maintenance",
          message: "Regulated nitrogen pressure valve to 14.5 bar and inspected optical nozzle alignment. Running trial cut now.",
          time: "15 min ago",
        },
      ],
    },
    {
      id: "INC-2026-079",
      title: "BOM component lot allocation mismatch on Battery Module 10.5kWh copper busbars",
      workCenter: "WC-104 · Sub-assembly & QC Gate",
      workOrderId: "WO-2042",
      category: "Material & BOM",
      priority: "Normal (P3)",
      status: "Resolved",
      timeAgo: "3 hours ago",
      reporter: "Amara Okafor",
      responder: {
        name: "Diego Alvarez",
        role: "Warehouse & Logistics Supervisor",
        message:
          "Verified physical lot tag Cu-BUS-2026-09 against Engineering Drawing Rev C. Re-scanned barcode lot into Bay 3 inventory and released 50 busbars for WO-2042.",
      },
      replies: [
        {
          id: "r3",
          author: "Amara Okafor",
          role: "Assembly Tech",
          message: "Busbar physical lot tag Cu-BUS-2026-09 shows revision code discrepancy against the MES bill of materials.",
          time: "3.5 hours ago",
        },
        {
          id: "r4",
          author: "Diego Alvarez",
          role: "Warehouse Lead",
          message: "Engineering Drawing Rev C confirmed valid. Barcode lot verified and released in MES inventory.",
          time: "3 hours ago",
        },
      ],
    },
    {
      id: "INC-2026-071",
      title: "100% High-voltage dielectric withstand test protocol sign-off for PDU-03 cabinet",
      workCenter: "WC-104 · QC Gate & Release",
      workOrderId: "WO-2045",
      category: "Quality Hold",
      priority: "Normal (P3)",
      status: "Resolved",
      timeAgo: "Yesterday",
      reporter: "Hana Kim",
      responder: {
        name: "Hana Kim",
        role: "Quality Assurance Lead",
        message:
          "Applied 2.5 kV AC for 60 seconds per SOP-QC-04. Leakage current measured at 1.8 mA (well below 5.0 mA limit). Dielectric test release certificate attached.",
      },
    },
  ]);

  // Support / Incident Form state
  const [formSubject, setFormSubject] = useState("");
  const [formWorkCenter, setFormWorkCenter] = useState("WC-101 · Laser Cutting & CNC Bending");
  const [formWorkOrder, setFormWorkOrder] = useState("");
  const [formCategory, setFormCategory] = useState<Ticket["category"]>("Machine & Tooling");
  const [formPriority, setFormPriority] = useState<Ticket["priority"]>("Normal (P3)");
  const [formDescription, setFormDescription] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formDescription.trim()) return;

    const newTicket: Ticket = {
      id: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: formSubject,
      workCenter: formWorkCenter,
      workOrderId: formWorkOrder.trim() ? formWorkOrder.trim().toUpperCase() : undefined,
      category: formCategory,
      priority: formPriority,
      status: "Open",
      timeAgo: "Just now",
      reporter: `${userName} (${userRole})`,
      replies: [
        {
          id: `r-${Date.now()}`,
          author: `${userName}`,
          role: userRole,
          message: formDescription,
          time: "Just now",
        },
      ],
    };

    setTickets((prev) => [newTicket, ...prev]);
    setFormSubject("");
    setFormWorkOrder("");
    setFormDescription("");
    setFormSubmitted(true);
    showToast(`Ticket ${newTicket.id} successfully dispatched to shift team!`);
    setTimeout(() => setFormSubmitted(false), 4500);
  };

  // Add follow up comment to selected ticket
  const handleAddTicketReply = (ticketId: string) => {
    if (!ticketFollowUpText.trim()) return;
    const newReply = {
      id: `rep-${Date.now()}`,
      author: userName,
      role: userRole,
      message: ticketFollowUpText.trim(),
      time: "Just now",
    };

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          replies: [...(t.replies || []), newReply],
        };
      })
    );

    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket((prev) =>
        prev ? { ...prev, replies: [...(prev.replies || []), newReply] } : null
      );
    }

    setTicketFollowUpText("");
    showToast("Field observation note added to ticket.");
  };

  // Update ticket status
  const handleUpdateTicketStatus = (ticketId: string, newStatus: Ticket["status"]) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    showToast(`Ticket ${ticketId} status updated to ${newStatus}.`);
  };

  // All Manufacturing SOPs database
  const allSops: SOPItem[] = [
    {
      code: "SOP-PRD-01",
      title: "CNC Laser Cutting Setup & Assist Gas Regulation",
      revision: "Rev 2.4 · Approved",
      workCenter: "WC-101 · Laser Cutting & CNC Bending",
      category: "Machining",
      readTime: "3 min",
      desc: "Calibration of cutting nozzle, focal distance, and nitrogen assist gas pressure for galvannealed chassis sheet cutting.",
      ppe: ["Laser Protective Goggles (OD 6+)", "Cut-Resistant Gloves (Level 5)", "Steel-Toe Safety Boots"],
      parameters: [
        { label: "Assist Gas", value: "Nitrogen (N2) @ 14.5 ± 0.5 Bar" },
        { label: "Cutting Feed Rate", value: "3.2 m/min (2mm Galvannealed)" },
        { label: "Nozzle Orifice", value: "Ø 1.5 mm Double Chrome" },
        { label: "Focal Position", value: "-1.0 mm (Sub-surface)" },
      ],
      steps: [
        "Inspect laser optical protective lens; ensure clean and free from dust particles and dross spatter.",
        "Turn on nitrogen supply and verify manifold regulator delivers minimum 20 bar supply pressure.",
        "Execute nozzle centering tape test using dedicated optical alignment adhesive.",
        "Perform trial test cut on 100x100mm coupon sample and inspect edge kerf using digital micrometer.",
        "Verify cutting kerf tolerance within specification (±0.05 mm) before commencing batch production.",
      ],
      criteria: "Cut edge must be burr-free with zero underside dross and dimensional deviation within ±0.05 mm.",
      icon: Cpu,
    },
    {
      code: "SOP-WLD-02",
      title: "TIG Welding Gas Shielding & Bead Verification",
      revision: "Rev 3.1 · Approved",
      workCenter: "WC-102 · Structural TIG Welding Bay",
      category: "Welding",
      readTime: "4 min",
      desc: "Procedures for 99.99% pure argon shielding gas, tungsten torch angle, and weld penetration verification for switchgear cabinets.",
      ppe: ["Auto-Darkening Welding Helmet (Shade 10-12)", "Goatskin TIG Welding Gloves", "Flame-Retardant Leather Apron"],
      parameters: [
        { label: "Shielding Gas", value: "Pure Argon 99.99% @ 12 L/min" },
        { label: "Welding Current", value: "115 - 130 A (DCEN)" },
        { label: "Electrode Spec", value: "Tungsten EWTh-2 Ø 2.4 mm" },
        { label: "Gas Post-Flow", value: "5.0 Seconds" },
      ],
      steps: [
        "Clean joint surfaces free of oil, grease, and oxidation residues using non-corrosive industrial solvent.",
        "Verify tungsten electrode grind angle (sharp 30° conical tip for focused arc stability).",
        "Clamp work grounding cable as close as possible to the weld joint to prevent arc wander.",
        "Execute fillet weld pass maintaining stable posture and 2-3 mm torch standoff distance.",
        "Hold torch steady until post-flow gas timer expires to shield molten puddle against oxidation.",
      ],
      criteria: "100% root penetration, uniform bead contour, zero porosity, cracks, or undercut.",
      icon: Wrench,
    },
    {
      code: "SOP-QC-04",
      title: "100% High-Voltage Dielectric Withstand Protocol",
      revision: "Rev 4.0 · Approved",
      workCenter: "WC-104 · Sub-assembly & QC Gate",
      category: "Quality",
      readTime: "3 min",
      desc: "High-voltage insulation withstand testing (2.5 kV AC) and chassis grounding continuity check prior to final release.",
      ppe: ["10 kV Insulated Safety Boots", "Class 0 Dielectric Rubber Gloves", "ESD Grounding Wrist Strap"],
      parameters: [
        { label: "Test Voltage", value: "2.5 kV AC (50/60 Hz)" },
        { label: "Dwell Duration", value: "60 Seconds" },
        { label: "Leakage Threshold", value: "< 5.0 mA (Trip Cut-off)" },
        { label: "Insulation Resistance", value: "> 100 MΩ (@ 500V DC)" },
      ],
      steps: [
        "Ensure product (PDU or Battery Module) is fully assembled with all terminal lugs torqued.",
        "Connect ground return lead to metal chassis earth stud and high-voltage probe to live phase busbar.",
        "Close safety interlock cage before energizing high-voltage supply.",
        "Press dual test buttons and observe leakage current reading across the full 60-second dwell.",
        "Affix serialized green QC Pass sticker upon zero-breakdown confirmation.",
      ],
      criteria: "Measured leakage current < 5.0 mA, zero arc/flashover, and insulation resistance > 100 MΩ.",
      icon: Zap,
    },
    {
      code: "SOP-INV-03",
      title: "Component Lot Quarantine & BOM Re-Allocation Protocol",
      revision: "Rev 1.8 · Approved",
      workCenter: "Warehouse Bay 3 · Material Storage",
      category: "Inventory",
      readTime: "2 min",
      desc: "Procedures for isolating non-conforming lots, applying red quarantine holds, and re-allocating substitute inventory in warehouse.",
      ppe: ["Steel-Toe Safety Shoes", "High-Visibility Warehouse Vest", "Grip Handling Gloves"],
      parameters: [
        { label: "Identification Tag", value: "Digital Red Quarantine Tag" },
        { label: "Quarantine Zone", value: "Dedicated Bay 3G Secure Cage" },
        { label: "Re-allocation SLA", value: "< 45 Minutes" },
      ],
      steps: [
        "Scan non-conforming material lot barcode using handheld wireless terminal scanner.",
        "Update lot inventory status from 'Available' to 'Quarantine Hold' in MES.",
        "Affix physical red 'HOLD - DO NOT USE' tag to pallet or component container.",
        "Transfer physical lot into locked quarantine zone at Bay 3G.",
        "Trigger substitute lot reservation request on affected Work Order to maintain line continuity.",
      ],
      criteria: "Quarantined lot isolated both physically and digitally; Work Order allocated valid substitute lot.",
      icon: Package,
    },
    {
      code: "SOP-ASY-05",
      title: "Power Distribution Unit Terminal Block Crimping & Torque Spec",
      revision: "Rev 2.0 · Approved",
      workCenter: "WC-104 · Sub-assembly & QC Gate",
      category: "Assembly",
      readTime: "3 min",
      desc: "Insulated ferrule crimping, pneumatic compression, and standard torque fastening for PDU electrical terminal blocks.",
      ppe: ["Anti-Static ESD Wrist Strap", "Protective Safety Glasses"],
      parameters: [
        { label: "Torque Spec M6 Bolt", value: "4.5 ± 0.3 N·m" },
        { label: "Torque Spec M8 Bolt", value: "9.0 ± 0.5 N·m" },
        { label: "Crimp Pull Test", value: "Min. 450 N (Pull Test)" },
      ],
      steps: [
        "Strip copper cable insulation to exact ferrule sleeve depth (12 mm clean cut without fraying strands).",
        "Insert tin-plated copper ferrule and crimp using calibrated pneumatic crimping die.",
        "Fasten terminal block screw using calibrated digital torque screwdriver until audible click.",
        "Apply green torque seal inspection witness paint across the fastened bolt head.",
      ],
      criteria: "All connections mechanically secure with zero strand damage, verified by torque seal mark.",
      icon: Layers,
    },
    {
      code: "SOP-IOT-06",
      title: "PLC Edge Gateway Connectivity Reset & Buffer Flush Protocol",
      revision: "Rev 1.5 · Approved",
      workCenter: "WC-101 thru WC-104",
      category: "IoT",
      readTime: "3 min",
      desc: "Protocol for offline edge gateway recovery, local buffer verification, and telemetry resynchronization.",
      ppe: ["ESD Dissipative Footwear"],
      parameters: [
        { label: "Protocol", value: "OPC UA / Modbus TCP over TLS" },
        { label: "Target Latency", value: "< 25 ms to MES Server" },
        { label: "Buffer Capacity", value: "Max 128 MB Local Cache" },
      ],
      steps: [
        "Inspect industrial Ethernet switch link LEDs inside the work center control cabinet.",
        "If gateway LED flashes amber/red (offline), execute 'Gateway Diagnostic Ping' from console.",
        "Allow local edge cache to collect machine telemetry during network troubleshooting.",
        "Once link is restored, execute 'Flush Buffer' to resynchronize runtime and part counters into MES.",
      ],
      criteria: "100% telemetry synced to database with zero time-gap records or lost counters.",
      icon: Cpu,
    },
  ];

  // Plant Floor Service Health
  const floorServices = [
    { name: "Digital Operations MES Core API", uptime: "99.98%", status: "Operational", healthy: true },
    { name: "Work Centers IoT PLC Gateway (Modbus/OPC UA)", uptime: "99.85%", status: "4/4 Online (14ms)", healthy: true },
    { name: "Floor Barcode Scanners & Mobile Terminals", uptime: "100.0%", status: "12/12 Devices Active", healthy: true },
    { name: "Quality Gate Dielectric & Hi-Pot Station", uptime: "100.0%", status: "Calibrated (Exp: Nov 30)", healthy: true },
    { name: "Component Lot Traceability & Audit Ledger", uptime: "100.0%", status: "Active & Synced", healthy: true },
  ];

  // On-Duty Shift Roster
  const onDutyRoster = [
    { name: "Felix Wagner", role: "Shift 1 Supervisor · CNC & Laser", initial: "FW", color: "bg-slate-200 text-slate-800 dark:bg-stone-800 dark:text-stone-200", ext: "Ext. 201" },
    { name: "Bo Andersen", role: "Lead Maintenance & Automation Tech", initial: "BA", color: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200", ext: "Ext. 204" },
    { name: "Hana Kim", role: "Quality Assurance Lead Inspector", initial: "HK", color: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200", ext: "Ext. 209" },
    { name: "Diego Alvarez", role: "Warehouse & Materials Supervisor", initial: "DA", color: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200", ext: "Ext. 215" },
  ];

  // Manufacturing FAQs
  const allFaqs = [
    {
      q: "What is the standard procedure when a Line Stoppage or machine emergency (Andon) occurs?",
      a: "The operator must press the station Andon cord/button or log a P1 Stoppage ticket in this portal. Plant Maintenance and Shift Supervisors are dispatched immediately with a mandatory < 5 minute response SLA target.",
      domain: "Machining & Work Centers",
    },
    {
      q: "What happens if a work center PLC gateway disconnects or experiences a network outage?",
      a: "Each Work Center is equipped with local edge buffering (Edge Cache). Machines continue running uninterrupted offline. Once Ethernet/Modbus connectivity is restored, telemetry (temperatures, RPMs, output counts) automatically syncs to the MES server with zero data loss.",
      domain: "IoT & PLC Gateways",
    },
    {
      q: "What is the procedure to release components flagged with a Quality Hold at the QC Gate?",
      a: "Re-inspection must be conducted jointly by Quality Control and the station supervisor. If verified within engineering tolerances and approved with the QC Lead digital sign-off, the hold status is released in the Quality module and the Work Order proceeds.",
      domain: "Quality Gate & Inspection",
    },
    {
      q: "Can multiple operators log progress on different operations of the same Work Order concurrently?",
      a: "Yes. The Digital Operations system supports atomic, operation-level tracking. For example, a laser cutting operator can complete cutting sheets while a wiring technician begins sub-assembly on an earlier batch without concurrency conflicts.",
      domain: "Assembly & Electrical Wiring",
    },
    {
      q: "How can I export a full lot genealogy tree for a customer quality compliance audit?",
      a: "Navigate to the Audit & Traceability module, enter the Work Order (e.g. WO-2042) or material lot number. The system generates a complete multi-tier genealogy chart linking vendor Purchase Orders, Goods Receipts, Work Centers, and QC certificates in PDF/CSV.",
      domain: "Audit & Traceability",
    },
    {
      q: "Where can operators check calibration expiration dates for shop floor gauges and tools?",
      a: "Calibration records (torque screwdrivers, dielectric testers, micrometers) are maintained in the Equipment Maintenance module and displayed directly on each Work Center card with periodic expiration warnings.",
      domain: "Machining & Work Centers",
    },
    {
      q: "How do I re-print damaged or unreadable material lot barcode labels in the warehouse?",
      a: "Open the Inventory module, search for the item or lot number, and click 'Print Lot Barcode'. The industrial thermal barcode printer at Warehouse Bay 3 will immediately produce a replacement label with verified checksums.",
      domain: "Material & Inventory",
    },
  ];

  // Filtered SOPs by search and domain
  const filteredSops = useMemo(() => {
    return allSops.filter((sop) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        sop.code.toLowerCase().includes(q) ||
        sop.title.toLowerCase().includes(q) ||
        sop.desc.toLowerCase().includes(q) ||
        sop.category.toLowerCase().includes(q);

      const matchDomain =
        !selectedDomain ||
        (selectedDomain === "Machining & Work Centers" && (sop.category === "Machining" || sop.category === "Welding")) ||
        (selectedDomain === "Assembly & Electrical Wiring" && sop.category === "Assembly") ||
        (selectedDomain === "Quality Gate & Inspection" && sop.category === "Quality") ||
        (selectedDomain === "Material & Inventory" && sop.category === "Inventory") ||
        (selectedDomain === "IoT & PLC Gateways" && sop.category === "IoT") ||
        (selectedDomain === "Audit & Traceability" && (sop.category === "Quality" || sop.category === "Inventory"));

      return matchSearch && matchDomain;
    });
  }, [allSops, searchQuery, selectedDomain]);

  // Filtered FAQs by search and domain
  const filteredFaqs = useMemo(() => {
    return allFaqs.filter((faq) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q);
      const matchDomain = !selectedDomain || faq.domain === selectedDomain;
      return matchSearch && matchDomain;
    });
  }, [allFaqs, searchQuery, selectedDomain]);

  // Filtered Tickets by status, search, and domain
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchStatus =
        ticketFilter === "All"
          ? true
          : ticketFilter === "Active"
          ? t.status === "Open" || t.status === "In Progress"
          : ticketFilter === "Resolved"
          ? t.status === "Resolved"
          : t.status === "Closed";

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.workCenter.toLowerCase().includes(q) ||
        (t.workOrderId && t.workOrderId.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q);

      const matchDomain =
        !selectedDomain ||
        (selectedDomain === "Machining & Work Centers" && t.category === "Machine & Tooling") ||
        (selectedDomain === "Assembly & Electrical Wiring" && t.category === "Production Flow") ||
        (selectedDomain === "Quality Gate & Inspection" && t.category === "Quality Hold") ||
        (selectedDomain === "Material & Inventory" && t.category === "Material & BOM") ||
        (selectedDomain === "IoT & PLC Gateways" && t.category === "Digital Ops & IoT") ||
        (selectedDomain === "Audit & Traceability" && t.category === "Quality Hold");

      return matchStatus && matchSearch && matchDomain;
    });
  }, [tickets, ticketFilter, searchQuery, selectedDomain]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      
      {/* ── Toast Notification ── */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white rounded-2xl shadow-2xl text-xs font-semibold border border-stone-700 animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* ── Top Header & Shift Indicator ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <Link to="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Main Facility
            </Link>
            <span>&rsaquo;</span>
            <span className="font-semibold text-slate-900 dark:text-white">Floor Operations Support</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Operations & Technical Support Center
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Plant floor technical assistance, preventive maintenance, quality compliance (QC), and work center incident resolution.
          </p>
        </div>

        {/* Current Active Shift Badge */}
        <div className="flex items-center gap-3 bg-white dark:bg-[#18181B] px-4 py-2 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-2xs self-start sm:self-auto">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-700 dark:text-stone-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">Shift 1 (07:00 – 15:30)</span>
          </div>
          <div className="h-4 w-px bg-stone-200 dark:bg-stone-700" />
          <div className="text-xs text-stone-500 dark:text-stone-400">
            <span className="font-bold text-slate-900 dark:text-white">4 Work Centers</span> · Normal Line Rate
          </div>
        </div>
      </div>

      {/* ── 1. Hero Search & Operations Banner ── */}
      <div className="bg-gradient-to-br from-slate-50 via-sky-50/40 to-stone-50 dark:from-[#18181B] dark:via-stone-900/40 dark:to-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/90 dark:border-stone-800 shadow-xs relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Search SOPs, Work Centers, Technical Guidance */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 text-xs font-bold">
              <HardHat className="w-3.5 h-3.5" />
              <span>Plant Floor Helpdesk · Main Facility</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Need operational assistance, {userName}?
            </h2>

            {/* Quick Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search standard operating procedures (SOP), machine error codes, or QC protocols (e.g., "SOP-QC-04", "WC-101", "Dielectric")...'
                className="w-full pl-11 pr-24 py-3 bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200 dark:border-stone-700 text-sm text-slate-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-xs font-semibold text-stone-500 cursor-pointer"
                >
                  Clear
                </button>
              ) : (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[11px] font-mono font-medium text-stone-500">
                  /
                </div>
              )}
            </div>

            {/* Popular Factory Search Keywords */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-stone-500 dark:text-stone-400 font-medium">Quick Searches:</span>
              {[
                "SOP-PRD-01 Laser",
                "TIG Welding Gas",
                "Dielectric QC",
                "BOM Re-allocation",
                "PLC Reconnect",
                "Barcode Scanner",
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchQuery(tag)}
                  className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-all cursor-pointer shadow-2xs ${
                    searchQuery === tag
                      ? "bg-blue-600 border-blue-600 text-white font-bold"
                      : "bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-700 text-slate-700 dark:text-stone-300"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Operational SLA & Metrics */}
            <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800 grid grid-cols-3 gap-4">
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">&lt; 5 min</div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">P1 Andon Response SLA</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">99.85%</div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">PLC Gateway Connectivity</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">16</div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Standard SOP Documents</div>
              </div>
            </div>
          </div>

          {/* Right: Key Manufacturing SOPs Most Read */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-600 dark:text-stone-400 tracking-wider uppercase">
              <span>Core Standard Operating Procedures (SOP)</span>
              <button
                type="button"
                onClick={() => setIsAllSopsOpen(true)}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View All SOPs ({allSops.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {filteredSops.slice(0, 4).map((sop) => (
                <div
                  key={sop.code}
                  onClick={() => setSelectedSop(sop)}
                  className="p-3 bg-white/90 dark:bg-stone-900/85 hover:bg-white dark:hover:bg-stone-900 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl border border-stone-200/80 dark:border-stone-800 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-2xs hover:shadow-xs"
                  title="Click to open full SOP work instruction document"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                      <sop.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-slate-800 dark:text-stone-200">
                          {sop.code}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {sop.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                        {sop.desc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-stone-400 shrink-0 font-medium">
                    <span>{sop.readTime}</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}

              {filteredSops.length === 0 && (
                <div className="p-4 bg-white/60 dark:bg-stone-900/60 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 text-center text-xs text-stone-500">
                  No SOPs matched &quot;{searchQuery}&quot;.
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedDomain(null);
                    }}
                    className="block mx-auto mt-2 text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Reset Search Filter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Operational Help Domains Grid (Interactive Category Cards) ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Shop Floor Support Categories & Domain Specializations
          </span>
          {selectedDomain && (
            <button
              type="button"
              onClick={() => setSelectedDomain(null)}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Reset filter ({selectedDomain})</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            {
              title: "Machining & Work Centers",
              desc: "WC-101 Laser, WC-102 TIG Welding, Calibration",
              guides: "4 Active SOPs",
              icon: Wrench,
              color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
            },
            {
              title: "Assembly & Electrical Wiring",
              desc: "Battery Modules, Switchgears & Power Units",
              guides: "3 Active SOPs",
              icon: Layers,
              color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
            },
            {
              title: "Quality Gate & Inspection",
              desc: "Dielectric Hi-Pot, Leakage Tests, Inspection",
              guides: "3 Active SOPs",
              icon: CheckCircle2,
              color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
            },
            {
              title: "Material & Inventory",
              desc: "BOM Allocation, Bin Transfers, Lot Quarantine",
              guides: "3 Active SOPs",
              icon: Package,
              color: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
            },
            {
              title: "IoT & PLC Gateways",
              desc: "Modbus Telemetry, Barcode Scanners, Tablets",
              guides: "2 Active SOPs",
              icon: Cpu,
              color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
            },
            {
              title: "Audit & Traceability",
              desc: "Genealogy Tree, Compliance Audit Logs, LOTO",
              guides: "2 Active SOPs",
              icon: ShieldCheck,
              color: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
            },
          ].map((domain) => {
            const isSelected = selectedDomain === domain.title;
            return (
              <div
                key={domain.title}
                onClick={() => setSelectedDomain(isSelected ? null : domain.title)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group shadow-2xs ${
                  isSelected
                    ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/30 scale-[1.02]"
                    : "bg-white dark:bg-[#18181B] border-stone-200/80 dark:border-stone-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs"
                }`}
                title={`Click to filter support to ${domain.title}`}
              >
                <div>
                  <div className={`w-8 h-8 rounded-xl ${domain.color} flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
                    <domain.icon className="w-4 h-4" />
                  </div>
                  <h4 className={`text-xs font-bold leading-tight mb-1 transition-colors ${
                    isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  }`}>
                    {domain.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug line-clamp-2">
                    {domain.desc}
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800 text-[10px] font-semibold text-stone-400 flex items-center justify-between">
                  <span>{domain.guides}</span>
                  {isSelected && <span className="text-blue-600 font-bold">Active ✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Main Operational Action Grid (Left: Incidents & FAQs, Right: Incident Form & Status) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── Left Column (7 cols): Floor Incident Log + Operational FAQs ── */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Floor Incident & Escalation Log */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700 dark:text-stone-300" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Floor Incident & Escalation Log (Tickets)
                </h3>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 p-0.5 bg-stone-100 dark:bg-stone-800 rounded-full border border-stone-200 dark:border-stone-700 text-xs">
                {(["All", "Active", "Resolved", "Closed"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTicketFilter(tab)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      ticketFilter === tab
                        ? "bg-white dark:bg-stone-700 text-slate-900 dark:text-white shadow-xs font-bold"
                        : "text-stone-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {tab === "All" ? `All (${tickets.length})` : tab === "Active" ? "In Progress" : tab === "Resolved" ? "Resolved" : "Closed"}
                  </button>
                ))}
              </div>
            </div>

            {/* Incident Tickets List */}
            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  No incidents in this category. All work centers operating normally.
                  {(searchQuery || selectedDomain) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedDomain(null);
                      }}
                      className="block mx-auto mt-2 text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Clear Search Filter
                    </button>
                  )}
                </div>
              ) : (
                filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 hover:bg-stone-100/60 dark:hover:bg-stone-900/80 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer space-y-2.5 shadow-2xs group"
                    title="Click to view ticket thread, history, and status updates"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-stone-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {t.id}
                        </span>
                        {t.workOrderId && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/orders");
                            }}
                            className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 hover:bg-blue-200 text-blue-900 dark:bg-blue-950 dark:text-blue-300 cursor-pointer transition-colors"
                            title="Click to open this Work Order in Orders"
                          >
                            {t.workOrderId} ↗
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === "In Progress"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : t.status === "Resolved"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : t.status === "Open"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-400"
                          }`}
                        >
                          ● {t.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400">{t.timeAgo}</span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {t.title}
                    </h4>

                    <div className="flex items-center gap-2 text-[10px] flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium">
                        {t.workCenter}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          t.priority.startsWith("Critical")
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : t.priority.startsWith("High")
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                        }`}
                      >
                        {t.priority}
                      </span>
                      <span className="text-stone-400">Reporter: {t.reporter}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold ml-auto flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Open Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Maintenance / Supervisor Response Box */}
                    {t.responder && (
                      <div className="mt-2.5 p-3 rounded-lg bg-white dark:bg-[#18181B] border border-stone-200/70 dark:border-stone-800 flex items-start gap-2.5 shadow-2xs">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {t.responder.name[0]}
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-bold text-slate-900 dark:text-white">
                            {t.responder.name} · <span className="font-normal text-stone-500">{t.responder.role}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-stone-300 leading-relaxed">
                            {t.responder.message}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Operational FAQ Accordion */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
              <BookOpen className="w-4 h-4 text-slate-700 dark:text-stone-300" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Frequently Asked Questions & Standard Operating Procedures (FAQ)
              </h3>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {filteredFaqs.map((item, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between gap-3 text-left font-bold text-xs text-slate-900 dark:text-stone-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span>{item.q}</span>
                        {item.domain && (
                          <span className="text-[9px] font-normal px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 shrink-0">
                            {item.domain}
                          </span>
                        )}
                      </span>
                      <div className="w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                    {isOpen && (
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed pl-1 animate-in fade-in duration-150">
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}

              {filteredFaqs.length === 0 && (
                <div className="text-center py-6 text-xs text-stone-400">
                  No FAQs matched the current search criteria.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column (5 cols): Incident Form, System Health & Shift Contacts ── */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Form: Dispatch Incident Ticket */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Send className="w-4 h-4 text-slate-700 dark:text-stone-300" />
                Dispatch Station Incident Ticket
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Tickets are dispatched directly to on-duty Maintenance Technicians and Shift Supervisors.
              </p>
            </div>

            {formSubmitted && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Ticket successfully submitted! On-duty technicians have been notified.</span>
              </div>
            )}

            <form onSubmit={handleSubmitTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-stone-300 mb-1">
                  Incident Title / Brief Summary
                </label>
                <input
                  type="text"
                  required
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="e.g., Nitrogen assist gas pressure warning on laser station WC-101"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-stone-300 mb-1">
                    Work Center / Station
                  </label>
                  <select
                    value={formWorkCenter}
                    onChange={(e) => setFormWorkCenter(e.target.value)}
                    className="w-full px-2.5 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="WC-101 · Laser Cutting & CNC Bending">WC-101 Laser & CNC</option>
                    <option value="WC-102 · Structural TIG Welding Bay">WC-102 TIG Welding</option>
                    <option value="WC-103 · Industrial Powder Coating & Oven">WC-103 Powder Coating</option>
                    <option value="WC-104 · Sub-assembly & QC Gate">WC-104 Assembly & QC</option>
                    <option value="Warehouse Bay 3 · Material Storage">Warehouse Bay 3</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-stone-300 mb-1">
                    Associated Work Order (Optional)
                  </label>
                  <input
                    type="text"
                    value={formWorkOrder}
                    onChange={(e) => setFormWorkOrder(e.target.value)}
                    placeholder="e.g., WO-2042"
                    className="w-full px-2.5 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-stone-300 mb-1">
                    Incident Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Machine & Tooling">Machine & Tooling</option>
                    <option value="Production Flow">Production Flow</option>
                    <option value="Material & BOM">Material & BOM</option>
                    <option value="Quality Hold">Quality Hold (QC)</option>
                    <option value="Digital Ops & IoT">Digital Ops & IoT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-stone-300 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none font-bold"
                  >
                    <option value="Critical (P1)">Critical (P1 - Line Stop)</option>
                    <option value="High (P2)">High (P2 - Output Impact)</option>
                    <option value="Normal (P3)">Normal (P3 - Operational)</option>
                    <option value="Low (P4)">Low (P4 - Inquiry)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-stone-300 mb-1">
                  Shop Floor Observation Details
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detail the machine state, alarm indicator codes, or emergency containment actions taken..."
                  maxLength={1000}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Reporter: {userName} ({userRole})</span>
                </div>

                <Button type="submit" variant="primary" className="gap-1.5 text-xs py-1.5 px-4 font-bold shadow-xs">
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch to Shift Team</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Plant Floor Service Health */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Plant Floor Gateway & System Status</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Online
              </span>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              {floorServices.map((svc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50/70 dark:bg-stone-900/50 border border-stone-100 dark:border-stone-800/80">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-stone-200 truncate text-[11px]">
                      {svc.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
                      {svc.uptime}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono">
                      {svc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* On-Duty Shift Contacts */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-700 dark:text-stone-300" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Current Shift On-Duty Contacts</h3>
              </div>
              <span className="text-[11px] font-mono text-stone-400">Shift 1</span>
            </div>

            <div className="space-y-2.5">
              {onDutyRoster.map((st, idx) => (
                <div
                  key={idx}
                  onClick={() => setContactModalPerson(st)}
                  className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-stone-100/70 dark:hover:bg-stone-800/60 transition-colors cursor-pointer group"
                  title={`Click to radio page or call ${st.name}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${st.color}`}>
                      {st.initial}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate text-[11px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {st.name}
                      </div>
                      <div className="text-[10px] text-stone-400 truncate">
                        {st.role}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-stone-300 px-2 py-0.5 bg-stone-100 dark:bg-stone-800 rounded group-hover:bg-blue-100 dark:group-hover:bg-blue-950 group-hover:text-blue-900 dark:group-hover:text-blue-300 transition-colors">
                      {st.ext}
                    </span>
                    <Phone className="w-3.5 h-3.5 text-stone-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>

            <div
              onClick={() => setIsEmergencyModalOpen(true)}
              className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/20 p-1.5 rounded-xl transition-colors group"
              title="Click to open plant emergency hotline and line stoppage desk"
            >
              <div className="flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-stone-700 dark:text-stone-300 font-semibold group-hover:text-rose-600 transition-colors">
                  Plant Emergency Control Desk:
                </span>
              </div>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 group-hover:underline">
                Ext. 299 (24/7) ↗
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ── MODALS & DRAWERS FOR INTERACTIVE ACTIONS ── */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}

      {/* 1. SOP Detail Modal */}
      {selectedSop && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#18181B] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 p-6 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
                    {selectedSop.code}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedSop.revision}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {selectedSop.title}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {selectedSop.workCenter}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSop(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-stone-500 cursor-pointer shrink-0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Required PPE */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <HardHat className="w-3.5 h-3.5 text-amber-500" />
                <span>Mandatory Personal Protective Equipment (PPE)</span>
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedSop.ppe.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/80 text-[11px] font-medium text-amber-900 dark:text-amber-200"
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Standard Machine Parameters */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-500" />
                <span>Standard Machine Parameters & Setpoints</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {selectedSop.parameters.map((p, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800">
                    <div className="text-[10px] text-stone-400 font-medium">{p.label}</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-xs mt-0.5">{p.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Checklist Steps */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Operational Execution Checklist</span>
              </h4>
              <div className="space-y-2">
                {selectedSop.steps.map((st, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-stone-200 p-2 rounded-lg bg-stone-50/60 dark:bg-stone-900/40">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{st}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Criteria Box */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs space-y-1">
              <div className="font-bold text-emerald-900 dark:text-emerald-300">Success Criteria & Quality Standards:</div>
              <p className="text-emerald-800 dark:text-emerald-200 text-[11px] leading-relaxed">
                {selectedSop.criteria}
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setFormSubject(`Parameter inquiry for ${selectedSop.code}`);
                  setFormWorkCenter(selectedSop.workCenter);
                  setSelectedSop(null);
                  showToast(`Incident form pre-populated for ${selectedSop.code}.`);
                }}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
              >
                + Create Inquiry Ticket For This SOP
              </button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    window.print();
                    showToast("SOP work instruction sent to station printer.");
                  }}
                  className="text-xs gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Station SOP</span>
                </Button>
                <Button variant="primary" onClick={() => setSelectedSop(null)} className="text-xs px-4">
                  Done Reading
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. All SOPs Full Catalog Modal */}
      {isAllSopsOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#18181B] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-5 p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Standard Operating Procedures (SOP) Full Library
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Comprehensive catalog of plant machining, assembly, and quality control protocols.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAllSopsOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-stone-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allSops.map((sop) => (
                <div
                  key={sop.code}
                  onClick={() => {
                    setSelectedSop(sop);
                    setIsAllSopsOpen(false);
                  }}
                  className="p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 hover:bg-white dark:hover:bg-stone-900 hover:border-blue-500 transition-all cursor-pointer space-y-1.5 shadow-2xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
                      {sop.code}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">{sop.readTime}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {sop.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2">
                    {sop.desc}
                  </p>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold pt-1 flex items-center gap-1">
                    <span>Open Work Instruction</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 text-right">
              <Button variant="secondary" onClick={() => setIsAllSopsOpen(false)} className="text-xs">
                Close Catalog
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Ticket Detail & Thread Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#18181B] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 p-6 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {selectedTicket.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedTicket.status === "In Progress"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : selectedTicket.status === "Resolved"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : selectedTicket.status === "Open"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      : "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-400"
                  }`}>
                    ● {selectedTicket.status}
                  </span>
                  <span className="text-xs text-stone-400 font-mono">
                    {selectedTicket.priority}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {selectedTicket.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                  <span>{selectedTicket.workCenter}</span>
                  {selectedTicket.workOrderId && (
                    <>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTicket(null);
                          navigate("/orders");
                        }}
                        className="font-mono text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-bold"
                      >
                        {selectedTicket.workOrderId} ↗
                      </button>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-stone-500 cursor-pointer shrink-0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation Thread */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                selectedTicket.replies.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {r.author} <span className="font-normal text-stone-400">({r.role})</span>
                      </span>
                      <span className="text-[10px] text-stone-400">{r.time}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-stone-300 leading-relaxed">
                      {r.message}
                    </p>
                  </div>
                ))
              ) : selectedTicket.responder ? (
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedTicket.responder.name} <span className="font-normal text-stone-400">({selectedTicket.responder.role})</span>
                    </span>
                    <span className="text-[10px] text-stone-400">{selectedTicket.timeAgo}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-stone-300 leading-relaxed">
                    {selectedTicket.responder.message}
                  </p>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-stone-400">
                  No technical responses yet. Ticket logged into active shift queue.
                </div>
              )}
            </div>

            {/* Follow-up reply box */}
            <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300">
                Add Observation Note / Field Update:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ticketFollowUpText}
                  onChange={(e) => setTicketFollowUpText(e.target.value)}
                  placeholder="Type technician notes or status confirmation..."
                  className="flex-1 px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTicketReply(selectedTicket.id);
                    }
                  }}
                />
                <Button
                  variant="primary"
                  onClick={() => handleAddTicketReply(selectedTicket.id)}
                  disabled={!ticketFollowUpText.trim()}
                  className="text-xs px-3"
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Send
                </Button>
              </div>
            </div>

            {/* Status change actions */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-stone-500">Update Ticket Status:</span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  onClick={() => handleUpdateTicketStatus(selectedTicket.id, "In Progress")}
                  className="text-xs py-1 px-2.5"
                >
                  In Progress
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleUpdateTicketStatus(selectedTicket.id, "Resolved")}
                  className="text-xs py-1 px-2.5 text-emerald-600 border-emerald-300 dark:border-emerald-800"
                >
                  Mark Resolved ✓
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleUpdateTicketStatus(selectedTicket.id, "Closed")}
                  className="text-xs py-1 px-2.5 text-stone-500"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Radio Paging / Call Staff Modal */}
      {contactModalPerson && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#18181B] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${contactModalPerson.color}`}>
                  {contactModalPerson.initial}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {contactModalPerson.name}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {contactModalPerson.role}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setContactModalPerson(null);
                  setRadioPagingSent(false);
                }}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-stone-500">
                <span>Shop Floor Phone Extension:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{contactModalPerson.ext}</span>
              </div>
              <div className="flex items-center justify-between text-stone-500">
                <span>Two-Way Radio Channel:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">CH-02 (Maintenance & Ops)</span>
              </div>
              <div className="flex items-center justify-between text-stone-500">
                <span>Shift Attendance Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Active On-Site</span>
              </div>
            </div>

            {radioPagingSent ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Radio paging signal sent to {contactModalPerson.name}!</span>
              </div>
            ) : null}

            <div className="space-y-2 pt-1">
              <Button
                variant="primary"
                onClick={() => {
                  setRadioPagingSent(true);
                  showToast(`Radio paging sent to ${contactModalPerson.name} (${contactModalPerson.ext}).`);
                }}
                className="w-full text-xs justify-center py-2"
              >
                <Radio className="w-4 h-4 mr-1.5" />
                Dispatch Two-Way Radio Page
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  setFormSubject(`Direct assistance request for ${contactModalPerson.name}`);
                  setFormDescription(`Urgent station assistance requested from ${contactModalPerson.name}.`);
                  setContactModalPerson(null);
                  showToast(`Ticket form pre-populated for ${contactModalPerson.name}.`);
                }}
                className="w-full text-xs justify-center py-2"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Open Ticket Directly to This Specialist
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Emergency Stoppage & Control Desk Modal */}
      {isEmergencyModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#18181B] rounded-3xl border border-rose-300 dark:border-rose-900 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-rose-600">
                <AlertOctagon className="w-6 h-6 shrink-0" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Plant Emergency Control Desk (24/7)
                  </h3>
                  <p className="text-xs text-stone-400">
                    Emergency safety response and line stoppage protocol
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmergencyModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs space-y-2">
              <div className="font-bold text-rose-900 dark:text-rose-200">
                Control Room Direct Hotline:
              </div>
              <div className="text-xl font-mono font-extrabold text-rose-600 dark:text-rose-400">
                Ext. 299 / Line 1-800-MFG-911
              </div>
              <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                Use this emergency channel for severe personal injuries, fire, critical hydraulic burst, or high-pressure gas leaks.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">Emergency Response Actions:</div>
              <ul className="space-y-1.5 text-stone-600 dark:text-stone-300 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Hit the red E-Stop (Emergency Stop) button on the nearest station.
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Evacuate personnel immediately from rotating equipment or high-voltage zones.
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Contact Shift Supervisor and Safety Officer at Ext. 299.
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsEmergencyModalOpen(false)} className="text-xs">
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setFormSubject("EMERGENCY LINE STOPPAGE - WC-101 thru WC-104");
                  setFormPriority("Critical (P1)");
                  setFormCategory("Machine & Tooling");
                  setIsEmergencyModalOpen(false);
                  showToast("P1 Stoppage emergency ticket form primed.");
                }}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white border-rose-600"
              >
                Trigger P1 Line Stoppage Ticket
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
