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
  AlertTriangle,
  Layers,
  ShoppingBag,
  Package,
  Activity,
  Users,
  ShieldCheck,
  Check,
  Radio,
  FileText,
  LifeBuoy
} from "lucide-react";
import { Button } from "../components/ui";

interface Ticket {
  id: string;
  title: string;
  category: "Production" | "Manufacturing" | "Procurement" | "Warehouse" | "Quality" | "Admin";
  priority: "Low" | "Normal" | "High";
  status: "Open" | "Answered" | "Closed";
  timeAgo: string;
  replyCount: number;
  agentReply?: {
    agentName: string;
    agentRole: string;
    message: string;
  };
}

export function Support() {
  const { user } = useAuthStore();
  const userName = user?.name?.split(" ")[0] || "Operator";

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // FAQ Accordion state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Tickets state
  const [ticketFilter, setTicketFilter] = useState<"All" | "Open" | "Answered" | "Closed">("All");
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: "CS-2210",
      title: "PLC telemetry stopped syncing after Shift 2",
      category: "Production",
      priority: "High",
      status: "Answered",
      timeAgo: "3 days ago",
      replyCount: 1,
      agentReply: {
        agentName: "Rosa",
        agentRole: "MfgOps support",
        message:
          "Your work center PLC gateway reconnected. The telemetry feed backfilled the missing operational records and all 4 lines are on track.",
      },
    },
    {
      id: "CS-2194",
      title: "Can work orders split across two work centers?",
      category: "Manufacturing",
      priority: "Normal",
      status: "Closed",
      timeAgo: "19 days ago",
      replyCount: 1,
      agentReply: {
        agentName: "Rosa",
        agentRole: "MfgOps support",
        message:
          "Yes — add a second operation on the other bench and link it with a dependency. Work center capacity counts both simultaneously.",
      },
    },
  ]);

  // Support Form state
  const [formSubject, setFormSubject] = useState("");
  const [formTopic, setFormTopic] = useState("Manufacturing");
  const [formPriority, setFormPriority] = useState<"Low" | "Normal" | "Urgent">("Normal");
  const [formDescription, setFormDescription] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formDescription.trim()) return;

    const newTicket: Ticket = {
      id: `CS-${Math.floor(1000 + Math.random() * 9000)}`,
      title: formSubject,
      category: (formTopic as any) || "Production",
      priority: formPriority === "Urgent" ? "High" : formPriority,
      status: "Open",
      timeAgo: "Just now",
      replyCount: 0,
    };

    setTickets((prev) => [newTicket, ...prev]);
    setFormSubject("");
    setFormDescription("");
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 4000);
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter === "All") return true;
    return t.status === ticketFilter;
  });

  const faqs = [
    {
      q: "Does MfgOps work on shop-floor tablets?",
      a: "Yes. Every page works from 390px wide up, with 44px touch targets. Set density to Comfortable in Settings for gloved hands on floor terminals.",
    },
    {
      q: "Can two operators edit the same work order at once?",
      a: "Yes. Work order updates are atomic at the operation level. One technician can record stator assembly while another verifies terminal crimping.",
    },
    {
      q: "How are shift attendance hours calculated?",
      a: "Attendance syncs from floor badge taps in the People directory. Overtime is flagged if active shift duration exceeds scheduled shift window.",
    },
    {
      q: "What happens to inventory when an order is cancelled?",
      a: "All reserved BOM raw materials are atomically released back into Available Stock in the inventory ledger with a Cancellation audit entry.",
    },
    {
      q: "Can we export operational genealogy for customer audits?",
      a: "Yes. The Audit & Traceability module generates full multi-tier provenance trees connecting supplier purchase orders to QC inspection passes.",
    },
    {
      q: "Where does the morning shift summary digest go?",
      a: "It is archived under Reports > Operational Insights and can be exported as standard sanitized CSV for daily standup reviews.",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* ── Breadcrumb & Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <Link to="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Main Facility
            </Link>
            <span>&rsaquo;</span>
            <span className="font-semibold text-slate-900 dark:text-white">Support</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Support
          </h1>
        </div>

        {/* Top Right Floor Telemetry & Clock */}
        <div className="flex items-center gap-3 bg-white dark:bg-[#18181B] px-3.5 py-1.5 rounded-full border border-stone-200 dark:border-stone-800 shadow-2xs self-start sm:self-auto">
          <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-700 dark:text-stone-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>10:55 AM</span>
          </div>
          <div className="h-3.5 w-px bg-stone-200 dark:bg-stone-700" />
          <div className="text-xs text-stone-500 dark:text-stone-400">
            <span className="font-bold text-slate-900 dark:text-white">4 on the floor</span> · 4 on track
          </div>
        </div>
      </div>

      {/* ── 1. Hero Help Center Card (Light Blue Tint) ── */}
      <div className="bg-[#EEF5F8] dark:bg-[#161B22] rounded-3xl p-6 sm:p-8 border border-blue-100/80 dark:border-stone-800 shadow-xs relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Greeting & Search Bar */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 text-xs font-semibold">
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>MfgOps help center</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How can we help, {userName}?
            </h2>

            {/* Search Input with / badge */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search guides — try "transfer stock" or "dielectric check"'
                className="w-full pl-11 pr-12 py-3 bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200 dark:border-stone-700 text-sm text-slate-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[11px] font-mono font-medium text-stone-500">
                /
              </div>
            </div>

            {/* Popular Topics */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-stone-500 dark:text-stone-400 font-medium">Popular:</span>
              {["transfer stock", "bom reserve", "dielectric check", "roles", "traceability"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchQuery(tag)}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-slate-700 dark:text-stone-300 font-medium transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Key Help Metrics */}
            <div className="pt-4 border-t border-blue-200/50 dark:border-stone-800 grid grid-cols-3 gap-4">
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">2.2 h</div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Median first reply</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">86%</div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Solved on first reply</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">12</div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Standard SOP guides</div>
              </div>
            </div>
          </div>

          {/* Right: Most Read This Week */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold text-stone-600 dark:text-stone-400 tracking-wider uppercase">
              Most read this week <span className="font-normal lowercase text-stone-400">· by Operations team</span>
            </div>

            <div className="space-y-2">
              {[
                {
                  title: "Transfer stock between locations",
                  desc: "Move materials and parts between Main Facility and Plant 2 Logistics Center.",
                  time: "2 min",
                  icon: Package,
                },
                {
                  title: "Re-link sensor and telemetry streams",
                  desc: "When work center PLC gateway resets, how telemetry backfills automatically.",
                  time: "1 min",
                  icon: Activity,
                },
                {
                  title: "Approve PR with coverage check",
                  desc: "Verify budget threshold and supplier lead time before signing off.",
                  time: "2 min",
                  icon: CheckCircle2,
                },
                {
                  title: "Run batch execution and post yield",
                  desc: "Reserve BOM, record output, and stream batch directly into QC Gate.",
                  time: "3 min",
                  icon: Layers,
                },
              ].map((art, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white/80 dark:bg-stone-900/80 hover:bg-white dark:hover:bg-stone-900 rounded-xl border border-blue-100/60 dark:border-stone-800 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-2xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 text-slate-700 dark:text-stone-300">
                      <art.icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {art.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                        {art.desc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-stone-400 shrink-0 font-medium">
                    <span>{art.time}</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Category Cards Row (6 Pastel Icons) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[
          {
            title: "Planning & production",
            desc: "Work orders, schedule, work centers",
            guides: "2 guides",
            icon: Layers,
            color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
          },
          {
            title: "Sourcing & procurement",
            desc: "Requisitions, approvals, vendor POs",
            guides: "2 guides",
            icon: ShoppingBag,
            color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
          },
          {
            title: "Stock & warehousing",
            desc: "Transfers, cycle counts, stock ledger",
            guides: "3 guides",
            icon: Package,
            color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
          },
          {
            title: "Quality & compliance",
            desc: "Inspection gates, defect Pareto",
            guides: "2 guides",
            icon: CheckCircle2,
            color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
          },
          {
            title: "People & floor team",
            desc: "Technicians, skills, plant roster",
            guides: "2 guides",
            icon: Users,
            color: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
          },
          {
            title: "Admin & governance",
            desc: "Roles, SoD rules, audit trail",
            guides: "1 guide",
            icon: ShieldCheck,
            color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
          },
        ].map((cat, idx) => (
          <div
            key={idx}
            className="p-4 bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs hover:shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className={`w-8 h-8 rounded-xl ${cat.color} flex items-center justify-center mb-3 transition-transform group-hover:scale-105`}>
                <cat.icon className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight mb-1">
                {cat.title}
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug line-clamp-2">
                {cat.desc}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800 text-[10px] font-semibold text-stone-400">
              {cat.guides}
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. Two-Column Lower Section: Tickets & FAQ (Left) vs Ask Team & Status (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column (Col 7): My Tickets + Common Questions (FAQ) ── */}
        <div className="lg:col-span-7 space-y-6">
          {/* My Tickets Card */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700 dark:text-stone-300" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">My tickets</h3>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 p-0.5 bg-stone-100 dark:bg-stone-800 rounded-full border border-stone-200 dark:border-stone-700 text-xs">
                {(["All", "Open", "Answered", "Closed"] as const).map((tab) => (
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
                    {tab} {tab === "All" && `(${tickets.length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Tickets List */}
            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs">No tickets in this category.</div>
              ) : (
                filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl border border-stone-200/70 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-stone-200">{t.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === "Answered"
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

                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{t.title}</h4>

                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium">
                        {t.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-medium ${
                          t.priority === "High"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                        }`}
                      >
                        {t.priority} priority
                      </span>
                      <span className="text-stone-400">{t.replyCount} reply</span>
                    </div>

                    {/* Agent Reply Box */}
                    {t.agentReply && (
                      <div className="mt-2.5 p-3 rounded-lg bg-white dark:bg-[#18181B] border border-stone-200/60 dark:border-stone-800 flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {t.agentReply.agentName[0]}
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-bold text-slate-900 dark:text-white">
                            {t.agentReply.agentName} · <span className="font-normal text-stone-500">{t.agentReply.agentRole}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-stone-300 leading-relaxed">
                            {t.agentReply.message}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Common Questions (Accordion FAQ) */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
              <BookOpen className="w-4 h-4 text-slate-700 dark:text-stone-300" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Common questions</h3>
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

        {/* ── Right Column (Col 5): Ask The Team + System Status ── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ask The Team Form */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Send className="w-4 h-4 text-slate-700 dark:text-stone-300" />
                Ask the team
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Real operations engineering support. Mon–Fri 7 AM – 6 PM PT.
              </p>
            </div>

            {formSubmitted && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Ticket submitted! Operations support will review shortly.</span>
              </div>
            )}

            <form onSubmit={handleSubmitTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-stone-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="e.g. Field sensor telemetry stopped syncing"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-stone-300 mb-1">
                    Topic
                  </label>
                  <select
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    className="w-full px-2.5 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Quality">Quality Gate</option>
                    <option value="Admin">Admin & Access</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-stone-300 mb-1">
                    Priority
                  </label>
                  <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
                    {(["Low", "Normal", "Urgent"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormPriority(p)}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          formPriority === p
                            ? "bg-white dark:bg-stone-700 text-slate-900 dark:text-white shadow-2xs"
                            : "text-stone-500 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-stone-300 mb-1">
                  What&apos;s happening?
                </label>
                <textarea
                  rows={4}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="What you expected, what happened instead, and any order or work center ID."
                  maxLength={1200}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
                <div className="text-right text-[10px] text-stone-400 mt-0.5">
                  {formDescription.length} / 1200
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Includes your role ({user?.role || "Operator"}).</span>
                </div>

                <Button type="submit" variant="primary" className="gap-1.5 text-xs py-1.5 px-4 font-bold shadow-xs">
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to support</span>
                </Button>
              </div>
            </form>
          </div>

          {/* System Status Card with 30-Day Uptime Blocks */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">System status</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>

            {/* Status Alert Banner */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 rounded-xl border border-amber-200/80 dark:border-amber-800/80 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                  Telemetry feeds are syncing normally
                </h4>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                  All 4 work center gateways are online. Next automated latency check in 14 minutes.
                </p>
              </div>
            </div>

            {/* Service Blocks with 30-day bars */}
            <div className="space-y-3.5 pt-1 text-xs">
              {[
                { name: "MfgOps Platform", uptime: "99.92%", status: "Operational", alert: false },
                { name: "Database & Storage", uptime: "99.98%", status: "Operational", alert: false },
                { name: "Sensor & Telemetry Feed", uptime: "98.90%", status: "Delayed syncs for 2 banks", alert: true },
                { name: "Traceability & Audit Ledger", uptime: "100.00%", status: "Operational", alert: false },
                { name: "Notification & Dispatch", uptime: "99.30%", status: "Operational", alert: false },
              ].map((svc, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-900 dark:text-stone-200">{svc.name}</span>
                    <span className={`font-mono text-[10px] ${svc.alert ? "text-amber-600 font-bold" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {svc.status}
                    </span>
                  </div>

                  {/* 30-Day mini tick boxes */}
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 30 }).map((_, barIdx) => {
                      const isAlertDay = svc.alert && (barIdx === 24 || barIdx === 25);
                      return (
                        <div
                          key={barIdx}
                          title={`Day ${barIdx + 1}: ${isAlertDay ? "Degraded" : "100% Operational"}`}
                          className={`h-4 flex-1 rounded-[2px] transition-colors ${
                            isAlertDay
                              ? "bg-amber-400 dark:bg-amber-500"
                              : "bg-emerald-500/80 dark:bg-emerald-600/80 hover:bg-emerald-400"
                          }`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                    <span>30 days ago</span>
                    <span>{svc.uptime} uptime</span>
                    <span>Today</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
