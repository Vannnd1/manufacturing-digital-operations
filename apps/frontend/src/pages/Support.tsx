import { useState } from "react";
import { Link } from "react-router-dom";
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
  Zap
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
}

export function Support() {
  const { user } = useAuthStore();
  const userName = user?.name?.split(" ")[0] || "Operator";
  const userRole = user?.role || "Production Operator";

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // FAQ Accordion state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Tickets filter & state
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
      timeAgo: "Baru saja",
      reporter: `${userName} (${userRole})`,
    };

    setTickets((prev) => [newTicket, ...prev]);
    setFormSubject("");
    setFormWorkOrder("");
    setFormDescription("");
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 4500);
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter === "All") return true;
    if (ticketFilter === "Active") return t.status === "Open" || t.status === "In Progress";
    if (ticketFilter === "Resolved") return t.status === "Resolved";
    if (ticketFilter === "Closed") return t.status === "Closed";
    return true;
  });

  // Manufacturing SOPs
  const sops = [
    {
      code: "SOP-PRD-01",
      title: "CNC Laser Cutting Setup & Assist Gas Regulation (WC-101)",
      desc: "Kalibrasi nozzle cutting, focal distance, dan tekanan gas nitrogen untuk pemotongan lembaran chassis galvannealed.",
      category: "Machining",
      readTime: "3 min",
      icon: Cpu,
    },
    {
      code: "SOP-WLD-02",
      title: "TIG Welding Gas Shielding & Bead Verification (WC-102)",
      desc: "Prosedur gas argon 99.99%, sudut tungsten torch, dan inspeksi penetrasi las untuk kabinet switchgear industri.",
      category: "Welding",
      readTime: "4 min",
      icon: Wrench,
    },
    {
      code: "SOP-QC-04",
      title: "100% High-Voltage Dielectric Withstand Protocol (WC-104)",
      desc: "Pengujian ketahanan insulasi tegangan tinggi (2.5 kV AC) dan kontinuitas grounding sebelum rilis produk.",
      category: "Quality",
      readTime: "3 min",
      icon: Zap,
    },
    {
      code: "SOP-INV-03",
      title: "Component Lot Quarantine & BOM Re-Allocation Protocol",
      desc: "Langkah isolasi lot cacat, penandaan kartu merah (quarantine hold), dan alokasi lot pengganti di gudang.",
      category: "Inventory",
      readTime: "2 min",
      icon: Package,
    },
  ];

  // Manufacturing FAQs
  const faqs = [
    {
      q: "Apa tindakan standar saat terjadi Line Stoppage atau kendala mesin darurat (Andon)?",
      a: "Operator wajib menekan tombol sinyal kendala stasiun atau membuat tiket P1 Stoppage di portal ini. Teknisi pemeliharaan (Plant Maintenance) dan Supervisor Shift wajib merespons ke stasiun kerja dalam waktu < 5 menit sesuai target SLA operasional.",
    },
    {
      q: "Bagaimana jika gateway PLC di stasiun kerja mengalami offline / putus koneksi jaringan?",
      a: "Setiap Work Center dilengkapi buffer memori lokal (Edge Cache). Selama koneksi offline, mesin tetap dapat beroperasi normal. Begitu koneksi Ethernet/Modbus pulih, data telemetri suhu, RPM, dan counter output akan otomatis disinkronkan ke sistem MES tanpa kehilangan data.",
    },
    {
      q: "Bagaimana prosedur pelepasan komponen yang terkena Quality Hold di QC Gate?",
      a: "Pemeriksaan ulang harus dilakukan oleh petugas Quality Control bersama supervisor stasiun. Jika hasil verifikasi memenuhi standar toleransi dan ditandatangani oleh QC Lead, status hold dapat dicabut melalui modul Quality Control sehingga Work Order dapat dilanjutkan.",
    },
    {
      q: "Apakah dua operator dapat mencatat progres operasi berbeda pada satu Work Order yang sama?",
      a: "Ya. Sistem Digital Operations mendukung pencatatan atomik per operasi (operation-level tracking). Contohnya, operator stasiun Laser Cutting dapat menyelesaikan proses potong sementara operator Wiring memulai sub-perakitan tanpa tumpang tindih data.",
    },
    {
      q: "Bagaimana cara mengekspor silsilah lot (lot genealogy tree) untuk kebutuhan audit mutu pelanggan?",
      a: "Buka menu Audit & Traceability, cari nomor Work Order (misal WO-2042) atau nomor lot material. Sistem akan menghasilkan diagram silsilah multi-tier lengkap yang menghubungkan Purchase Order vendor, Goods Receipt, Work Center pengerjaan, hingga sertifikat uji QC dalam format PDF/CSV.",
    },
    {
      q: "Di mana operator dapat memeriksa jadwal kalibrasi alat ukur dan perkakas bengkel?",
      a: "Daftar status kalibrasi alat (torsi meter, penguji dielektrik, micrometer) tercatat di modul Equipment Maintenance dan tercantum pada kartu stasiun kerja masing-masing Work Center dengan tanggal jatuh tempo berkala.",
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      
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
            Pusat bantuan teknis lini produksi, pemeliharaan mesin, kepatuhan mutu (QC), dan penanganan kendala stasiun kerja.
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
            <span className="font-bold text-slate-900 dark:text-white">4 Work Centers</span> · Lini Normal
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
              Ada kendala operasional, {userName}?
            </h2>

            {/* Quick Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Cari panduan SOP, kode error mesin, atau prosedur mutu (misal: "SOP-QC-04", "WC-101", "Dielektrik")...'
                className="w-full pl-11 pr-12 py-3 bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200 dark:border-stone-700 text-sm text-slate-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[11px] font-mono font-medium text-stone-500">
                /
              </div>
            </div>

            {/* Popular Factory Search Keywords */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-stone-500 dark:text-stone-400 font-medium">Topik Cepat:</span>
              {[
                "SOP-PRD-01 Laser",
                "TIG Welding Gas",
                "Dielektrik QC",
                "BOM Re-allocation",
                "PLC Reconnect",
                "Barcode Scanner",
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchQuery(tag)}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-slate-700 dark:text-stone-300 font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Operational SLA & Metrics */}
            <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800 grid grid-cols-3 gap-4">
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">&lt; 5 min</div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">SLA Respon Andon P1</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">99.85%</div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Konektivitas PLC Gateway</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">16</div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Dokumen SOP Standar</div>
              </div>
            </div>
          </div>

          {/* Right: Key Manufacturing SOPs Most Read */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-600 dark:text-stone-400 tracking-wider uppercase">
              <span>Prosedur Standar (SOP) Utama</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">
                Lihat Semua
              </span>
            </div>

            <div className="space-y-2">
              {sops.map((sop) => (
                <div
                  key={sop.code}
                  className="p-3 bg-white/90 dark:bg-stone-900/85 hover:bg-white dark:hover:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-2xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
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
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Operational Help Domains Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[
          {
            title: "Mesin & Stasiun Kerja",
            desc: "WC-101 Laser, WC-102 TIG Welding, Kalibrasi",
            guides: "4 SOP aktif",
            icon: Wrench,
            color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
          },
          {
            title: "Perakitan & Wiring",
            desc: "Modul Baterai, Switchgear & Power Unit",
            guides: "3 SOP aktif",
            icon: Layers,
            color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
          },
          {
            title: "Quality Gate & QC",
            desc: "Dielektrik Hi-Pot, Uji Kebocoran, Inspeksi",
            guides: "3 SOP aktif",
            icon: CheckCircle2,
            color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
          },
          {
            title: "Material & Gudang",
            desc: "Alokasi BOM, Transfer Bin, Lot Quarantine",
            guides: "3 SOP aktif",
            icon: Package,
            color: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
          },
          {
            title: "IoT & Gateway PLC",
            desc: "Telemetri Modbus, Scanner Barcode, Tablet",
            guides: "2 SOP aktif",
            icon: Cpu,
            color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
          },
          {
            title: "Audit & Traceability",
            desc: "Genealogy Tree, Log Kepatuhan, LOTO",
            guides: "1 SOP aktif",
            icon: ShieldCheck,
            color: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
          },
        ].map((domain, idx) => (
          <div
            key={idx}
            className="p-4 bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs hover:shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className={`w-8 h-8 rounded-xl ${domain.color} flex items-center justify-center mb-3 transition-transform group-hover:scale-105`}>
                <domain.icon className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight mb-1">
                {domain.title}
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug line-clamp-2">
                {domain.desc}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800 text-[10px] font-semibold text-stone-400">
              {domain.guides}
            </div>
          </div>
        ))}
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
                  Log Kendala & Eskalasi Lapangan (Tickets)
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
                    {tab === "All" ? `Semua (${tickets.length})` : tab === "Active" ? "Sedang Ditangani" : tab === "Resolved" ? "Selesai" : "Tutup"}
                  </button>
                ))}
              </div>
            </div>

            {/* Incident Tickets List */}
            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">
                  Tidak ada kendala dalam kategori ini. Semua stasiun berjalan normal.
                </div>
              ) : (
                filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-stone-100">{t.id}</span>
                        {t.workOrderId && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
                            {t.workOrderId}
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
                          ● {t.status === "In Progress" ? "Sedang Diperiksa" : t.status === "Resolved" ? "Selesai Ditangani" : t.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400">{t.timeAgo}</span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{t.title}</h4>

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
                      <span className="text-stone-400">Pelapor: {t.reporter}</span>
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
                Tanya Jawab & Pedoman Standar Operasional (FAQ)
              </h3>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {faqs.map((item, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between gap-3 text-left font-bold text-xs text-slate-900 dark:text-stone-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      <span>{item.q}</span>
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
            </div>
          </div>
        </div>

        {/* ── Right Column (5 cols): Incident Form, System Health & Shift Contacts ── */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Form: Laporkan Kendala / Escalation Form */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Send className="w-4 h-4 text-slate-700 dark:text-stone-300" />
                Laporkan Kendala Stasiun (Dispatch Ticket)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Tiket diteruskan langsung ke Teknisi Pemeliharaan dan Supervisor Shift aktif.
              </p>
            </div>

            {formSubmitted && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tiket berhasil diajukan! Teknisi pemeliharaan shift telah dinotifikasi.</span>
              </div>
            )}

            <form onSubmit={handleSubmitTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-stone-300 mb-1">
                  Judul Kendala / Deskripsi Singkat
                </label>
                <input
                  type="text"
                  required
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Contoh: Tekanan gas assist nitrogen turun di stasiun WC-101"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-stone-300 mb-1">
                    Stasiun / Work Center
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
                    Work Order Terkait (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formWorkOrder}
                    onChange={(e) => setFormWorkOrder(e.target.value)}
                    placeholder="Contoh: WO-2042"
                    className="w-full px-2.5 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-stone-300 mb-1">
                    Kategori Kendala
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Machine & Tooling">Mesin & Perkakas</option>
                    <option value="Production Flow">Alur Produksi</option>
                    <option value="Material & BOM">Material & BOM</option>
                    <option value="Quality Hold">Quality Hold (QC)</option>
                    <option value="Digital Ops & IoT">Digital Ops & IoT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-stone-300 mb-1">
                    Tingkat Keparahan
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none font-bold"
                  >
                    <option value="Critical (P1)">Critical (P1 - Line Stop)</option>
                    <option value="High (P2)">High (P2 - Impak Hasil)</option>
                    <option value="Normal (P3)">Normal (P3 - Operasional)</option>
                    <option value="Low (P4)">Low (P4 - Pertanyaan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-stone-300 mb-1">
                  Rincian Observasi di Lantai Pabrik
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Jelaskan kondisi mesin/material, kode indikator alarm, atau tindakan darurat yang sudah dilakukan..."
                  maxLength={1000}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Pelapor: {userName} ({userRole})</span>
                </div>

                <Button type="submit" variant="primary" className="gap-1.5 text-xs py-1.5 px-4 font-bold shadow-xs">
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim ke Tim Shift</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Plant Floor Service Health */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Status Sistem & Gateway Pabrik</h3>
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
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Kontak Petugas Shift Saat Ini</h3>
              </div>
              <span className="text-[11px] font-mono text-stone-400">Shift 1</span>
            </div>

            <div className="space-y-2.5">
              {onDutyRoster.map((st, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${st.color}`}>
                      {st.initial}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate text-[11px]">
                        {st.name}
                      </div>
                      <div className="text-[10px] text-stone-400 truncate">
                        {st.role}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-stone-300 shrink-0 px-2 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">
                    {st.ext}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px]">
              <span className="text-stone-500 dark:text-stone-400">Control Desk Darurat Pabrik:</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">Ext. 299 (24/7)</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
