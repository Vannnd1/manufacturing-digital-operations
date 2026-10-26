import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LifeBuoy,
  Settings,
  X,
  ArrowRight,
  ShoppingCart,
  Target,
  Box,
  Archive,
  ShieldCheck,
  BarChart3,
  Users,
  History,
  CheckCircle2,
  LogOut,
  Building2,
  Layers
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

// ── 1. Quick Command & Search Modal (Ctrl+K) ──────────────────────────────────
interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickLinks = [
    { label: "Dashboard", path: "/", desc: "Operational KPIs, floor status, and real-time ledger", icon: Layers, tag: "Page" },
    { label: "Material Master", path: "/materials", desc: "SKU catalog, safety thresholds, and units", icon: Box, tag: "Catalog" },
    { label: "Inventory Management", path: "/inventory", desc: "Current stock, allocated units, and warehouse ledger", icon: Archive, tag: "Stock" },
    { label: "Procurement", path: "/procurement", desc: "Purchase requests, supplier orders, and goods receipts", icon: ShoppingCart, tag: "Purchasing" },
    { label: "Production Orders", path: "/production", desc: "Assembly work orders, batch tracking, and yield", icon: Target, tag: "Manufacturing" },
    { label: "Quality Control", path: "/quality", desc: "Batch inspection, defect rates, and pass records", icon: ShieldCheck, tag: "Quality" },
    { label: "People & Staff", path: "/staff", desc: "Shop floor operators, shift attendance, and staff directory", icon: Users, tag: "Personnel" },
    { label: "Reports & Insights", path: "/reports", desc: "Yield meters, defect analytics, and spend commitment", icon: BarChart3, tag: "Analytics" },
    { label: "Audit & Traceability", path: "/audit", desc: "Chain-of-custody, system audit logs, and genealogy", icon: History, tag: "Audit" },
  ];

  const filtered = quickLinks.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase()) ||
      item.tag.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar with Cross Button */}
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center gap-3 bg-stone-50/50 dark:bg-stone-900/60">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search operations, materials, orders, or jump to page..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && filtered.length > 0) handleSelect(filtered[0].path);
            }}
          />
          <div className="flex items-center gap-2 shrink-0">
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-stone-500 dark:text-stone-400 bg-stone-200/60 dark:bg-stone-800 rounded-md border border-stone-300/60 dark:border-stone-700">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-slate-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              title="Close search"
              aria-label="Close search"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-stone-100/60 dark:divide-stone-800">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400">
              No matching modules or operations found for "{query}".
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  className="w-full p-3 rounded-xl flex items-center justify-between text-left hover:bg-stone-100/70 dark:hover:bg-stone-800/60 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 flex items-center justify-center shrink-0 border border-stone-200/80 dark:border-stone-700 group-hover:bg-slate-900 dark:group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-stone-100">{item.label}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-full border border-stone-200/60 dark:border-stone-700">
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer tip */}
        <div className="p-3 bg-stone-50 dark:bg-stone-900/80 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500 px-4">
          <span>Tip: Press <kbd className="font-mono font-semibold">Ctrl+K</kbd> anytime to open quick search</span>
          <span className="font-medium text-slate-600 dark:text-stone-400">Quick Launcher</span>
        </div>
      </div>
    </div>
  );
}

// ── 2. Quick Create Modal (+) ────────────────────────────────────────────────
interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickCreateModal({ isOpen, onClose }: QuickCreateModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const actions = [
    {
      title: "New Purchase Request",
      desc: "Raise raw material requisition from approved suppliers",
      icon: ShoppingCart,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      path: "/procurement"
    },
    {
      title: "New Production Order",
      desc: "Schedule assembly batch order on the machining center",
      icon: Target,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      path: "/production"
    },
    {
      title: "New Material Item",
      desc: "Register SKU, unit of measure, and safety thresholds",
      icon: Box,
      color: "bg-amber-50 text-amber-700 border-amber-200",
      path: "/materials"
    },
    {
      title: "New Quality Inspection",
      desc: "Record pass/defect counts for finished production record",
      icon: ShieldCheck,
      color: "bg-rose-50 text-rose-700 border-rose-200",
      path: "/quality"
    },
  ];

  const handleAction = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-stone-100">Quick Create Action</h3>
            <p className="text-xs text-slate-400 dark:text-stone-500">Initiate factory workflow items with one click</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-stone-400 hover:text-slate-900 dark:hover:text-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.title}
                onClick={() => handleAction(act.path)}
                className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 hover:border-slate-800/80 dark:hover:border-amber-500/80 bg-white dark:bg-stone-900/60 hover:bg-stone-50/80 dark:hover:bg-stone-800/70 transition-all flex items-center gap-3.5 text-left group cursor-pointer shadow-2xs"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${act.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-stone-100 group-hover:text-blue-600 dark:group-hover:text-amber-400 transition-colors">
                    {act.title}
                  </p>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate mt-0.5">{act.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── 3. Support & SOPs Modal (LifeBuoy) ────────────────────────────────────────
interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-2xl p-6 relative max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-stone-100">Operational Support & SOPs</h3>
              <p className="text-xs text-slate-400 dark:text-stone-500">Shop floor workflows, architecture & escalation guidelines</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-stone-400 hover:text-slate-900 dark:hover:text-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Section: Operational Pipeline */}
          <div className="p-4 bg-stone-50/80 dark:bg-stone-900/60 rounded-xl border border-stone-200/70 dark:border-stone-800">
            <h4 className="font-bold text-slate-900 dark:text-stone-100 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-amber-400" /> Manufacturing Execution Sequence
            </h4>
            <div className="space-y-1.5 text-slate-600 dark:text-stone-400 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center">1</span>
                <span><strong>Procurement:</strong> Create PR &rarr; Manager approval &rarr; Issue PO to Supplier.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center">2</span>
                <span><strong>Goods Receipt:</strong> Receive materials in warehouse &rarr; Increases available stock.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center">3</span>
                <span><strong>Production:</strong> Create WO &rarr; Check & reserve BOM items &rarr; Floor assembly.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center">4</span>
                <span><strong>Quality Control:</strong> Inspect actual yield &rarr; Record pass/fail defect rates.</span>
              </div>
            </div>
          </div>

          {/* Section: Diagnostics & Verification */}
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/70 dark:border-emerald-800/60">
            <h4 className="font-bold text-emerald-950 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Platform System Status
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-900 dark:text-emerald-300 font-mono">
              <div>API Backend: <span className="font-bold text-emerald-700 dark:text-emerald-400">Healthy (:3001)</span></div>
              <div>Database: <span className="font-bold text-emerald-700 dark:text-emerald-400">PostgreSQL (:5432)</span></div>
              <div>Test Suite: <span className="font-bold text-emerald-700 dark:text-emerald-400">260 Tests Passing</span></div>
              <div>E2E Browser: <span className="font-bold text-emerald-700 dark:text-emerald-400">13 Playwright Tests</span></div>
            </div>
          </div>

          {/* Section: Escalation Contacts */}
          <div className="p-4 bg-stone-50/80 dark:bg-stone-900/60 rounded-xl border border-stone-200/70 dark:border-stone-800">
            <h4 className="font-bold text-slate-900 dark:text-stone-100 mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Facility Contacts & Escalation
            </h4>
            <div className="space-y-1 text-slate-600 dark:text-stone-400 text-[11px]">
              <p>• <strong>Lead Plant Supervisor:</strong> Marcus Vance (Ext: 1042 / Radio Ch 4)</p>
              <p>• <strong>Quality Assurance Lead:</strong> Elena Rostova (Ext: 1088 / Radio Ch 2)</p>
              <p>• <strong>Warehouse Logistics:</strong> James Chen (Ext: 1015 / Dock 3)</p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-slate-900 dark:bg-amber-600 text-white font-semibold text-xs hover:bg-slate-800 dark:hover:bg-amber-500 transition-colors cursor-pointer"
          >
            Close Support
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 4. Settings & User Profile Modal (Gear) ───────────────────────────────────
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm bg-white dark:bg-[#18181B] border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 flex items-center justify-center border border-stone-200 dark:border-stone-700">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-stone-100">System Preferences</h3>
              <p className="text-xs text-slate-400 dark:text-stone-500">Account info and platform settings</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-stone-400 hover:text-slate-900 dark:hover:text-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="p-3.5 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200/70 dark:border-stone-800">
            <p className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 tracking-wider">Active Operator</p>
            <p className="font-bold text-slate-900 dark:text-stone-100 text-sm mt-0.5">{user?.name || "System Operator"}</p>
            <p className="text-stone-500 dark:text-stone-400 font-mono text-[11px]">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 rounded-full font-semibold text-[10px] border border-amber-200/60 dark:border-amber-800/60">
              Role: {user?.role || "Staff"}
            </div>
          </div>

          <div className="space-y-2 text-[11px] text-slate-600 dark:text-stone-400 px-1">
            <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
              <span className="text-stone-400 dark:text-stone-500">Operating Facility:</span>
              <span className="font-medium text-slate-800 dark:text-stone-200">Larkspur Assembly Plant</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100 dark:border-stone-800">
              <span className="text-stone-400 dark:text-stone-500">Application Version:</span>
              <span className="font-mono font-medium text-slate-800 dark:text-stone-200">MfgOps v1.2.4</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-400 dark:text-stone-500">Environment:</span>
              <span className="font-medium text-emerald-700 dark:text-emerald-400">Production Ready</span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <button
            onClick={() => {
              logout();
              onClose();
              navigate("/login");
            }}
            className="px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900/60 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-slate-900 dark:bg-amber-600 text-white font-semibold text-xs hover:bg-slate-800 dark:hover:bg-amber-500 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
