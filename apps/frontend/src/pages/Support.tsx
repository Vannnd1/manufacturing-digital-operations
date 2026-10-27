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
          message: "Tekanan gas turun tiba-tiba ke 9 bar saat memotong lembaran chassis ke-12.",
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
          message: "Part number busbar pada kotak fisik Cu-BUS-2026-09 berbeda kode revisi di sistem MES.",
          time: "3.5 hours ago",
        },
        {
          id: "r4",
          author: "Diego Alvarez",
          role: "Warehouse Lead",
          message: "Drawing Rev C terkonfirmasi sah. Barcode lot sudah diverifikasi dan di-unblock di sistem.",
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
      timeAgo: "Baru saja",
      reporter: `${userName} (${userRole})`,
      replies: [
        {
          id: `r-${Date.now()}`,
          author: `${userName}`,
          role: userRole,
          message: formDescription,
          time: "Baru saja",
        },
      ],
    };

    setTickets((prev) => [newTicket, ...prev]);
    setFormSubject("");
    setFormWorkOrder("");
    setFormDescription("");
    setFormSubmitted(true);
    showToast(`Tiket ${newTicket.id} berhasil diajukan ke tim shift!`);
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
      time: "Baru saja",
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
    showToast("Pembaruan observasi berhasil ditambahkan ke tiket.");
  };

  // Update ticket status
  const handleUpdateTicketStatus = (ticketId: string, newStatus: Ticket["status"]) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    showToast(`Status tiket ${ticketId} diubah ke ${newStatus}.`);
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
      desc: "Kalibrasi nozzle cutting, focal distance, dan tekanan gas nitrogen untuk pemotongan lembaran chassis galvannealed.",
      ppe: ["Kacamata Pelindung Laser (OD 6+)", "Sarung Tangan Tahan Potong Level 5", "Sepatu Safety Toe"],
      parameters: [
        { label: "Gas Assist", value: "Nitrogen (N2) @ 14.5 ± 0.5 Bar" },
        { label: "Kecepatan Potong", value: "3.2 m/min (2mm Galvannealed)" },
        { label: "Nozzle Orifice", value: "Ø 1.5 mm Double Chrome" },
        { label: "Focal Position", value: "-1.0 mm (Sub-surface)" },
      ],
      steps: [
        "Periksa kebersihan kaca pelindung optik laser, pastikan bebas dari partikel debu & percikan dross.",
        "Nyalakan suplai gas nitrogen dan pastikan regulator botol/manifold berada pada tekanan minimal 20 bar.",
        "Lakukan kalibrasi pemusatan nozzle (nozzle centering tape test) menggunakan selotip optik khusus.",
        "Jalankan uji pemotongan sampel lembaran 100x100mm dan periksa tepi potong dengan mikrometer digital.",
        "Konfirmasi toleransi kerf pemotongan (toleransi spesifikasi: ±0.05 mm) sebelum memulai batch produksi.",
      ],
      criteria: "Tepi potong harus bersih tanpa burr, bebas dross bawah, dan deviasi dimensi tidak melebihi ±0.05 mm.",
      icon: Cpu,
    },
    {
      code: "SOP-WLD-02",
      title: "TIG Welding Gas Shielding & Bead Verification",
      revision: "Rev 3.1 · Approved",
      workCenter: "WC-102 · Structural TIG Welding Bay",
      category: "Welding",
      readTime: "4 min",
      desc: "Prosedur gas argon 99.99%, sudut tungsten torch, dan inspeksi penetrasi las untuk kabinet switchgear industri.",
      ppe: ["Topeng Las Auto-Darkening (Shade 10-12)", "Sarung Tangan Las Kulit Kambing", "Apron Las Tahan Panas"],
      parameters: [
        { label: "Gas Lindung", value: "Argon Murni 99.99% @ 12 L/min" },
        { label: "Arus Pengelasan", value: "115 - 130 A (DCEN)" },
        { label: "Elektroda", value: "Tungsten EWTh-2 Ø 2.4 mm" },
        { label: "Post-Flow Gas", value: "5.0 Detik" },
      ],
      steps: [
        "Bersihkan permukaan plat dari minyak, oli, dan residu oksidasi menggunakan cairan pembersih non-korosif.",
        "Periksa sudut pengasahan elektroda tungsten (ujung runcing 30° untuk busur terfokus).",
        "Pasang klem grounding sedekat mungkin ke zona pengelasan untuk mencegah distorsi busur (arc wander).",
        "Lakukan pengelasan sambungan sudut dengan postur stabil dan jarak torch ke benda kerja 2-3 mm.",
        "Tunggu aliran gas post-flow selesai sebelum mengangkat torch agar kawah las tidak mengalami oksidasi.",
      ],
      criteria: "Penetrasi sambungan 100%, permukaan manik las rapat dan seragam, tanpa porositas atau retak.",
      icon: Wrench,
    },
    {
      code: "SOP-QC-04",
      title: "100% High-Voltage Dielectric Withstand Protocol",
      revision: "Rev 4.0 · Approved",
      workCenter: "WC-104 · Sub-assembly & QC Gate",
      category: "Quality",
      readTime: "3 min",
      desc: "Pengujian ketahanan insulasi tegangan tinggi (2.5 kV AC) dan kontinuitas grounding sebelum rilis produk.",
      ppe: ["Sepatu Sol Isolasi 10 kV", "Sarung Tangan Karet Dielektrik Kelas 0", "Gelang Grounding ESD"],
      parameters: [
        { label: "Tegangan Uji", value: "2.5 kV AC (50/60 Hz)" },
        { label: "Waktu Paparan", value: "60 Detik" },
        { label: "Ambang Arus Bocor", value: "< 5.0 mA (Trip Cut-off)" },
        { label: "Resistansi Isolasi", value: "> 100 MΩ (@ 500V DC)" },
      ],
      steps: [
        "Pastikan produk (PDU atau Modul Baterai) telah selesai dirakit dan semua baut terminal terkunci kuat.",
        "Sambungkan kabel ground tester ke sasis bodi logam produk dan probe tegangan ke terminal fasa.",
        "Tutup sangkar pelindung isolasi (safety interlock cage) sebelum menyalakan daya pengujian.",
        "Tekan tombol uji ganda dan monitor nilai arus bocor selama pengujian 60 detik penuh.",
        "Tempelkan label hijau lolos QC (QC Pass Sticker) jika hasil menunjukkan tidak ada kebocoran arus.",
      ],
      criteria: "Arus bocor terukur < 5.0 mA, tidak terjadi sparkover/arc, dan resistansi isolasi > 100 MΩ.",
      icon: Zap,
    },
    {
      code: "SOP-INV-03",
      title: "Component Lot Quarantine & BOM Re-Allocation Protocol",
      revision: "Rev 1.8 · Approved",
      workCenter: "Warehouse Bay 3 · Material Storage",
      category: "Inventory",
      readTime: "2 min",
      desc: "Langkah isolasi lot cacat, penandaan kartu merah (quarantine hold), dan alokasi lot pengganti di gudang.",
      ppe: ["Sepatu Safety", "Rompi Reflektor Gudang", "Sarung Tangan Handling"],
      parameters: [
        { label: "Tag Identifikasi", value: "Digital Red Quarantine Tag" },
        { label: "Lokasi Karantina", value: "Rak Khusus Bay 3G (Isolasi)" },
        { label: "SLA Alokasi Pengganti", value: "< 45 Menit" },
      ],
      steps: [
        "Pindai barcode lot material bermasalah menggunakan scanner terminal genggam.",
        "Ubah status inventaris lot dari 'Available' menjadi 'Quarantine Hold' di sistem MES.",
        "Pasang tag fisik merah bertuliskan 'HOLD - JANGAN DIPAKAI' pada palet/kotak komponen.",
        "Pindahkan fisik material ke area karantina berpagar di Bay 3G.",
        "Buat permintaan alokasi lot alternatif pada Work Order terdampak agar lini perakitan tidak terhenti.",
      ],
      criteria: "Lot terkarantina terisolasi total secara sistem dan fisik; Work Order dialokasikan lot pengganti valid.",
      icon: Package,
    },
    {
      code: "SOP-ASY-05",
      title: "Power Distribution Unit Terminal Block Crimping & Torque Spec",
      revision: "Rev 2.0 · Approved",
      workCenter: "WC-104 · Sub-assembly & QC Gate",
      category: "Assembly",
      readTime: "3 min",
      desc: "Pemasangan terminal ferrule berisolasi, crimping pneumatik, dan pengencangan baut torsi standar kabinet PDU.",
      ppe: ["Gelang ESD Anti-Statik", "Kacamata Keselamatan"],
      parameters: [
        { label: "Torsi Baut M6", value: "4.5 ± 0.3 N·m" },
        { label: "Torsi Baut M8", value: "9.0 ± 0.5 N·m" },
        { label: "Uji Tarik Crimping", value: "Min. 450 N (Pull Test)" },
      ],
      steps: [
        "Kupas isolasi kabel tembaga sesuai panjang selongsong ferrule (12 mm tepat tanpa merusak serabut).",
        "Masukkan ferrule tembaga berlapis timah dan lakukan crimping dengan alat pneumatik terkalibrasi.",
        "Kencangkan baut terminal block menggunakan obeng torsi digital hingga berbunyi 'klik'.",
        "Bubuhkan cairan penanda segel torsi (torque seal marker hijau) pada sambungan baut.",
      ],
      criteria: "Semua koneksi kabel kokoh tanpa serabut putus dan bertanda segel torsi inspeksi visual.",
      icon: Layers,
    },
    {
      code: "SOP-IOT-06",
      title: "PLC Edge Gateway Connectivity Reset & Buffer Flush Protocol",
      revision: "Rev 1.5 · Approved",
      workCenter: "WC-101 s/d WC-104",
      category: "IoT",
      readTime: "3 min",
      desc: "Prosedur penanganan offline edge gateway, verifikasi integritas buffer lokal, dan sinkronisasi data telemetri.",
      ppe: ["Sepatu Sol ESD"],
      parameters: [
        { label: "Protokol", value: "OPC UA / Modbus TCP over TLS" },
        { label: "Batas Latensi", value: "< 25 ms ke Server MES" },
        { label: "Ambang Buffer", value: "Maksimal 128 MB Local Cache" },
      ],
      steps: [
        "Periksa lampu LED status link pada switch industri di panel kontrol stasiun kerja.",
        "Jika gateway berkedip merah (offline), jalankan perintah 'Gateway Diagnostic Ping' di konsol.",
        "Biarkan local cache mengumpulkan data telemetri selama jaringan diperiksa.",
        "Saat koneksi pulih, klik 'Flush Buffer' agar data runtime & counter mesin masuk kembali ke MES.",
      ],
      criteria: "Data telemetri tersinkronisasi 100% tanpa adanya celah waktu (zero time-gap record).",
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
      q: "Apa tindakan standar saat terjadi Line Stoppage atau kendala mesin darurat (Andon)?",
      a: "Operator wajib menekan tombol sinyal kendala stasiun atau membuat tiket P1 Stoppage di portal ini. Teknisi pemeliharaan (Plant Maintenance) dan Supervisor Shift wajib merespons ke stasiun kerja dalam waktu < 5 menit sesuai target SLA operasional.",
      domain: "Mesin & Stasiun Kerja",
    },
    {
      q: "Bagaimana jika gateway PLC di stasiun kerja mengalami offline / putus koneksi jaringan?",
      a: "Setiap Work Center dilengkapi buffer memori lokal (Edge Cache). Selama koneksi offline, mesin tetap dapat beroperasi normal. Begitu koneksi Ethernet/Modbus pulih, data telemetri suhu, RPM, dan counter output akan otomatis disinkronkan ke sistem MES tanpa kehilangan data.",
      domain: "IoT & Gateway PLC",
    },
    {
      q: "Bagaimana prosedur pelepasan komponen yang terkena Quality Hold di QC Gate?",
      a: "Pemeriksaan ulang harus dilakukan oleh petugas Quality Control bersama supervisor stasiun. Jika hasil verifikasi memenuhi standar toleransi dan ditandatangani oleh QC Lead, status hold dapat dicabut melalui modul Quality Control sehingga Work Order dapat dilanjutkan.",
      domain: "Quality Gate & QC",
    },
    {
      q: "Apakah dua operator dapat mencatat progres operasi berbeda pada satu Work Order yang sama?",
      a: "Ya. Sistem Digital Operations mendukung pencatatan atomik per operasi (operation-level tracking). Contohnya, operator stasiun Laser Cutting dapat menyelesaikan proses potong sementara operator Wiring memulai sub-perakitan tanpa tumpang tindih data.",
      domain: "Perakitan & Wiring",
    },
    {
      q: "Bagaimana cara mengekspor silsilah lot (lot genealogy tree) untuk kebutuhan audit mutu pelanggan?",
      a: "Buka menu Audit & Traceability, cari nomor Work Order (misal WO-2042) atau nomor lot material. Sistem akan menghasilkan diagram silsilah multi-tier lengkap yang menghubungkan Purchase Order vendor, Goods Receipt, Work Center pengerjaan, hingga sertifikat uji QC dalam format PDF/CSV.",
      domain: "Audit & Traceability",
    },
    {
      q: "Di mana operator dapat memeriksa jadwal kalibrasi alat ukur dan perkakas bengkel?",
      a: "Daftar status kalibrasi alat (torsi meter, penguji dielektrik, micrometer) tercatat di modul Equipment Maintenance dan tercantum pada kartu stasiun kerja masing-masing Work Center dengan tanggal jatuh tempo berkala.",
      domain: "Mesin & Stasiun Kerja",
    },
    {
      q: "Bagaimana cara mencetak ulang barcode lot material yang rusak atau sobek di gudang?",
      a: "Pilih modul Inventory, cari kode item atau lot ID terkait, lalu klik tombol 'Print Lot Barcode'. Printer barcode termal di Bay 3 akan otomatis mencetak label pengganti dengan checksum terverifikasi.",
      domain: "Material & Gudang",
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
        (selectedDomain === "Mesin & Stasiun Kerja" && (sop.category === "Machining" || sop.category === "Welding")) ||
        (selectedDomain === "Perakitan & Wiring" && sop.category === "Assembly") ||
        (selectedDomain === "Quality Gate & QC" && sop.category === "Quality") ||
        (selectedDomain === "Material & Gudang" && sop.category === "Inventory") ||
        (selectedDomain === "IoT & Gateway PLC" && sop.category === "IoT") ||
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
        (selectedDomain === "Mesin & Stasiun Kerja" && t.category === "Machine & Tooling") ||
        (selectedDomain === "Perakitan & Wiring" && t.category === "Production Flow") ||
        (selectedDomain === "Quality Gate & QC" && t.category === "Quality Hold") ||
        (selectedDomain === "Material & Gudang" && t.category === "Material & BOM") ||
        (selectedDomain === "IoT & Gateway PLC" && t.category === "Digital Ops & IoT") ||
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
              <button
                type="button"
                onClick={() => setIsAllSopsOpen(true)}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Lihat Semua SOP ({allSops.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {filteredSops.slice(0, 4).map((sop) => (
                <div
                  key={sop.code}
                  onClick={() => setSelectedSop(sop)}
                  className="p-3 bg-white/90 dark:bg-stone-900/85 hover:bg-white dark:hover:bg-stone-900 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl border border-stone-200/80 dark:border-stone-800 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-2xs hover:shadow-xs"
                  title="Klik untuk membuka dokumen panduan SOP lengkap"
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
                  Tidak ada SOP yang cocok dengan &quot;{searchQuery}&quot;.
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedDomain(null);
                    }}
                    className="block mx-auto mt-2 text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Reset Filter Pencarian
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
            Kategori Bantuan & Spesialisasi Lantai Pabrik
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
                title={`Klik untuk memfilter bantuan ke kategori ${domain.title}`}
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
                  {isSelected && <span className="text-blue-600 font-bold">Aktif ✓</span>}
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
                  {(searchQuery || selectedDomain) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedDomain(null);
                      }}
                      className="block mx-auto mt-2 text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Bersihkan Filter Pencarian
                    </button>
                  )}
                </div>
              ) : (
                filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 hover:bg-stone-100/60 dark:hover:bg-stone-900/80 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer space-y-2.5 shadow-2xs group"
                    title="Klik untuk membuka detail tiket, histori obrolan, dan tindakan"
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
                            title="Klik untuk melihat Work Order ini di halaman Orders"
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
                          ● {t.status === "In Progress" ? "Sedang Diperiksa" : t.status === "Resolved" ? "Selesai Ditangani" : t.status}
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
                      <span className="text-stone-400">Pelapor: {t.reporter}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold ml-auto flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Buka Detail</span>
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
                Tanya Jawab & Pedoman Standar Operasional (FAQ)
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
                  Tidak ada FAQ yang cocok dengan filter aktif.
                </div>
              )}
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
                <div
                  key={idx}
                  onClick={() => setContactModalPerson(st)}
                  className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-stone-100/70 dark:hover:bg-stone-800/60 transition-colors cursor-pointer group"
                  title={`Klik untuk mengirim radio page / memanggil ${st.name}`}
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
              title="Klik untuk membuka hotline darurat dan protokol stoppage"
            >
              <div className="flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-stone-700 dark:text-stone-300 font-semibold group-hover:text-rose-600 transition-colors">
                  Control Desk Darurat Pabrik:
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
                <span>Alat Pelindung Diri (APD) Wajib</span>
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
                <span>Parameter & Nilai Setelan Standar Mesin</span>
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
                <span>Langkah Eksekusi Operasional</span>
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
              <div className="font-bold text-emerald-900 dark:text-emerald-300">Kriteria Keberhasilan & Syarat Mutu:</div>
              <p className="text-emerald-800 dark:text-emerald-200 text-[11px] leading-relaxed">
                {selectedSop.criteria}
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setFormSubject(`Konsultasi parameter untuk ${selectedSop.code}`);
                  setFormWorkCenter(selectedSop.workCenter);
                  setSelectedSop(null);
                  showToast(`Form pelaporan otomatis disesuaikan dengan ${selectedSop.code}.`);
                }}
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
              >
                + Buat Tiket Konsultasi Mengenai SOP Ini
              </button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    window.print();
                    showToast("Dokumen SOP dicetak untuk kartu stasiun.");
                  }}
                  className="text-xs gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak SOP Stasiun</span>
                </Button>
                <Button variant="primary" onClick={() => setSelectedSop(null)} className="text-xs px-4">
                  Selesai Membaca
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
                  Pustaka Lengkap Standar Operasional Prosedur (SOP)
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Daftar seluruh protokol standar permesinan, perakitan, dan kontrol mutu pabrik.
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
                    <span>Buka Lembar Kerja</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 text-right">
              <Button variant="secondary" onClick={() => setIsAllSopsOpen(false)} className="text-xs">
                Tutup Katalog
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
                  Belum ada tanggapan teknis. Tiket baru saja dicatat di antrean shift.
                </div>
              )}
            </div>

            {/* Follow-up reply box */}
            <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-stone-300">
                Tambahkan Catatan / Pembaruan Observasi Lapangan:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ticketFollowUpText}
                  onChange={(e) => setTicketFollowUpText(e.target.value)}
                  placeholder="Ketik catatan teknisi atau konfirmasi status..."
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
                  Kirim
                </Button>
              </div>
            </div>

            {/* Status change actions */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-stone-500">Ubah Status Tiket:</span>
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
                  Tandai Selesai ✓
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleUpdateTicketStatus(selectedTicket.id, "Closed")}
                  className="text-xs py-1 px-2.5 text-stone-500"
                >
                  Tutup
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
                <span>Ekstensi Telepon Lantai:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{contactModalPerson.ext}</span>
              </div>
              <div className="flex items-center justify-between text-stone-500">
                <span>Frekuensi Radio Walkie:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">CH-02 (Maintenance & Ops)</span>
              </div>
              <div className="flex items-center justify-between text-stone-500">
                <span>Status Kehadiran Shift:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Aktif di Lini Pabrik</span>
              </div>
            </div>

            {radioPagingSent ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sinyal panggilan radio paging berhasil dikirim ke {contactModalPerson.name}!</span>
              </div>
            ) : null}

            <div className="space-y-2 pt-1">
              <Button
                variant="primary"
                onClick={() => {
                  setRadioPagingSent(true);
                  showToast(`Paging radio dikirim ke ${contactModalPerson.name} (${contactModalPerson.ext}).`);
                }}
                className="w-full text-xs justify-center py-2"
              >
                <Radio className="w-4 h-4 mr-1.5" />
                Kirim Sinyal Panggilan Radio Stasiun
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  setFormSubject(`Permintaan bantuan langsung untuk ${contactModalPerson.name}`);
                  setFormDescription(`Memerlukan asistensi teknis langsung dari ${contactModalPerson.name} di stasiun kerja.`);
                  setContactModalPerson(null);
                  showToast(`Form pelaporan disiapkan untuk ${contactModalPerson.name}.`);
                }}
                className="w-full text-xs justify-center py-2"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Buka Tiket Langsung ke Petugas Ini
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
                    Control Desk Darurat Pabrik (24/7)
                  </h3>
                  <p className="text-xs text-stone-400">
                    Protokol penanganan darurat keselamatan & line stoppage
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
                Hotline Langsung Control Room:
              </div>
              <div className="text-xl font-mono font-extrabold text-rose-600 dark:text-rose-400">
                Ext. 299 / Line 1-800-MFG-911
              </div>
              <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                Gunakan saluran darurat ini jika terjadi insiden keselamatan, kebakaran, kegagalan hidrolik parah, atau kebocoran gas bertekanan.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">Daftar Langkah Tanggap Cepat:</div>
              <ul className="space-y-1.5 text-stone-600 dark:text-stone-300 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Tekan tombol E-Stop merah di stasiun kerja terdekat.
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Evakuasi personel dari zona bahaya mesin berputar/tegangan tinggi.
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Hubungi supervisor shift dan petugas K3 di Ext. 299.
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsEmergencyModalOpen(false)} className="text-xs">
                Tutup
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setFormSubject("EMERGENCY LINE STOPPAGE - WC-101 s/d WC-104");
                  setFormPriority("Critical (P1)");
                  setFormCategory("Machine & Tooling");
                  setIsEmergencyModalOpen(false);
                  showToast("Form darurat P1 Stoppage diaktifkan.");
                }}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white border-rose-600"
              >
                Picu Tiket P1 Line Stoppage
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
