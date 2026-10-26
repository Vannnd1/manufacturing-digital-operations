import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { Login } from "./pages/Login";
import { Materials } from "./pages/Materials";
import { Inventory } from "./pages/Inventory";
import { Procurement } from "./pages/Procurement";
import { Production } from "./pages/Production";
import { Quality } from "./pages/Quality";
import { Dashboard } from "./pages/Dashboard";
import { AuditTrail } from "./pages/AuditTrail";
import { Reports } from "./pages/Reports";
import { Staff } from "./pages/Staff";
import { 
  LogOut, 
  Target, 
  ShieldCheck, 
  Bell,
  AlertTriangle,
  ChevronRight,
  Search,
  Plus,
  Moon,
  Sun,
  LifeBuoy,
  Settings,
  Factory
} from "lucide-react";
import { SearchModal, QuickCreateModal, SupportModal, SettingsModal } from "./components/QuickModals";
import { LiveTelemetryPill } from "./components/LiveTelemetryPill";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function MainLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const notifRef = useRef<HTMLDivElement>(null);

  // Operational Notification Center State
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  // Quick Utilities Modals State
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("mfg-theme-mode");
    if (saved === "dark" || saved === "light") return saved;
    return "light";
  });
  const [themeToast, setThemeToast] = useState<string | null>(null);

  // Sync theme mode to documentElement class (.dark) and localStorage
  useEffect(() => {
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("mfg-theme-mode", themeMode);
  }, [themeMode]);

  const toggleThemeMode = () => {
    const next = themeMode === "light" ? "dark" : "light";
    setThemeMode(next);
    setThemeToast(
      next === "dark"
        ? "Dark Mode active · Industrial graphite theme enabled"
        : "Light Mode active · Clean theme enabled"
    );
    setTimeout(() => setThemeToast(null), 3000);
  };

  // Keyboard shortcut Ctrl+K / Cmd+K for Quick Search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Close notifications popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationsOpen]);

  const currentPage = (() => {
    if (location.pathname === "/") return "Dashboard";
    if (location.pathname === "/procurement") return "Procurement";
    if (location.pathname === "/inventory") return "Inventory Management";
    if (location.pathname === "/materials") return "Material Master";
    if (location.pathname === "/production") return "Production Orders";
    if (location.pathname === "/quality") return "Quality Control";
    if (location.pathname === "/staff") return "People & Staff";
    if (location.pathname === "/reports") return "Reports & Insights";
    if (location.pathname === "/audit") return "Audit & Traceability";
    return "Operations";
  })();

  const domainInfo = (() => {
    if (location.pathname === "/production" || location.pathname === "/quality") {
      return { name: "Manufacturing", path: "/production" };
    }
    if (location.pathname === "/inventory" || location.pathname === "/materials") {
      return { name: "Stock & Materials", path: "/inventory" };
    }
    if (location.pathname === "/procurement") {
      return { name: "Procurement", path: "/procurement" };
    }
    if (location.pathname === "/staff") {
      return { name: "People & Staff", path: "/staff" };
    }
    if (location.pathname === "/reports") {
      return { name: "Reporting", path: "/reports" };
    }
    if (location.pathname === "/audit") {
      return { name: "Audit & Traceability", path: "/audit" };
    }
    return null;
  })();

  return (
    <div className="min-h-screen flex bg-[#FAF9F6] dark:bg-[#0F1013] text-slate-800 dark:text-stone-100 transition-colors duration-150">

      {/* ── Floating Dark Capsule Dock ── */}
      <aside
        aria-label="Quick Utility Dock"
        className="hidden md:flex fixed left-3.5 top-28 z-40 flex-col items-center py-3 px-1.5 bg-[#18181B] text-stone-300 rounded-full border border-stone-800/90 shadow-2xl shadow-black/40 gap-3 animate-in fade-in duration-200"
      >
        {/* 1. Quick Search */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="p-2 hover:text-white hover:bg-stone-800 rounded-full transition-colors cursor-pointer text-stone-300"
          title="Search (Ctrl+K)"
          aria-label="Search operations"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* 2. Quick Create (+) */}
        <button
          onClick={() => setQuickCreateOpen(true)}
          className="p-2 hover:text-white hover:bg-stone-800 rounded-full transition-colors cursor-pointer text-stone-300"
          title="Quick Action"
          aria-label="Quick Action"
        >
          <Plus className="w-4.5 h-4.5" />
        </button>

        {/* 3. Theme Toggle (Moon / Sun) */}
        <div className="relative group">
          <button
            onClick={toggleThemeMode}
            className="p-2 hover:text-white hover:bg-stone-800 rounded-full transition-colors cursor-pointer text-stone-300 relative"
            title={themeMode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme mode"
          >
            {themeMode === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-stone-300 transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-white dark:bg-stone-800 text-slate-900 dark:text-white font-semibold text-xs rounded-xl shadow-lg border border-stone-200/90 dark:border-stone-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 flex items-center">
            {themeMode === "dark" ? "Light Mode" : "Dark Mode"}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-white dark:border-r-stone-800" />
          </div>
        </div>

        {/* Divider */}
        <div className="w-5 h-px bg-stone-700/80 my-0.5" />

        {/* 4. Support (Circular button with signature tooltip badge) */}
        <div className="relative group">
          <button
            onClick={() => setSupportModalOpen(true)}
            className="w-9 h-9 rounded-full bg-[#27272A] text-white flex items-center justify-center hover:bg-stone-700 transition-colors shadow-xs cursor-pointer"
            title="Support & SOPs"
            aria-label="Support"
          >
            <LifeBuoy className="w-4 h-4" />
          </button>
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-white dark:bg-stone-800 text-slate-900 dark:text-white font-semibold text-xs rounded-xl shadow-lg border border-stone-200/90 dark:border-stone-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 flex items-center">
            Support
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-white dark:border-r-stone-800" />
          </div>
        </div>

        {/* 5. Settings (Gear) */}
        <button
          onClick={() => setSettingsModalOpen(true)}
          className="p-2 hover:text-white hover:bg-stone-800 rounded-full transition-colors cursor-pointer text-stone-300"
          title="Settings & System Preferences"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </aside>

      {/* ── Main Content Area (Full-width canvas) ── */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* ── Top Header with Navigation Options ── */}
        <header className="h-16 shrink-0 border-b border-stone-200/80 dark:border-stone-800 bg-[#FAF9F6] dark:bg-[#141519] flex justify-between items-center px-4 sm:px-6 z-20 relative gap-3 sm:gap-6 transition-colors duration-150">
          
          {/* Left: Brand Platform Logo & Navigation Buttons (Full to the left for spacious room) */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {/* Brand Platform Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center shadow-xs">
                <Factory className="w-4 h-4 text-white" />
              </div>
              <div className="leading-tight hidden sm:block">
                <span className="font-bold text-xs tracking-tight text-slate-900 dark:text-white uppercase block">
                  MfgOps
                </span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium tracking-wider uppercase block">
                  Platform
                </span>
              </div>
            </div>

            <div className="h-5 w-px bg-stone-200/80 dark:bg-stone-800 hidden sm:block shrink-0" />

            {/* Top Navigation Bar with Pill Choices - Full Left & Spacious */}
            <div className="flex items-center gap-1 bg-stone-100/90 dark:bg-stone-900/90 p-1 rounded-full border border-stone-200/80 dark:border-stone-800 shadow-2xs overflow-x-auto scrollbar-none">
              <Link
                to="/"
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  location.pathname === "/"
                    ? "bg-slate-900 dark:bg-amber-600 text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800/80"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/procurement"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  location.pathname === "/procurement"
                    ? "bg-slate-900 dark:bg-amber-600 text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800/80"
                }`}
              >
                <span>Procurement</span>
                <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.2 ${location.pathname === "/procurement" ? "bg-white/20 text-white" : "bg-amber-600 text-white"}`}>
                  4
                </span>
              </Link>
              <Link
                to="/inventory"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  location.pathname === "/inventory" || location.pathname === "/materials"
                    ? "bg-slate-900 dark:bg-amber-600 text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800/80"
                }`}
              >
                <span>Stock</span>
                <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.2 ${location.pathname === "/inventory" || location.pathname === "/materials" ? "bg-white/20 text-white" : "bg-amber-600 text-white"}`}>
                  6
                </span>
              </Link>
              <Link
                to="/production"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  location.pathname === "/production" || location.pathname === "/quality"
                    ? "bg-slate-900 dark:bg-amber-600 text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800/80"
                }`}
              >
                <span>Manufacturing</span>
                <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.2 ${location.pathname === "/production" || location.pathname === "/quality" ? "bg-white/20 text-white" : "bg-amber-600 text-white"}`}>
                  1
                </span>
              </Link>
              <Link
                to="/staff"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  location.pathname === "/staff"
                    ? "bg-slate-900 dark:bg-amber-600 text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800/80"
                }`}
              >
                <span>People</span>
                <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.2 ${location.pathname === "/staff" ? "bg-white/20 text-white" : "bg-stone-500 text-white"}`}>
                  22
                </span>
              </Link>
              <Link
                to="/reports"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  location.pathname === "/reports"
                    ? "bg-slate-900 dark:bg-amber-600 text-white shadow-xs font-bold"
                    : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800/80"
                }`}
              >
                Reporting
              </Link>
              {(user?.role === "Admin" || user?.role === "Manager") && (
                <Link
                  to="/audit"
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    location.pathname === "/audit"
                      ? "bg-slate-900 dark:bg-amber-600 text-white shadow-xs font-bold"
                      : "text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800/80"
                  }`}
                >
                  Audit
                </Link>
              )}
            </div>
          </div>

          {/* Right: Quick Tools, Alerts & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Search Button */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white transition-colors shadow-2xs cursor-pointer"
              title="Quick Search (Ctrl+K)"
              aria-label="Search operations"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <kbd className="px-1.5 py-0.2 text-[10px] bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded text-stone-500 dark:text-stone-400 font-mono">⌘K</kbd>
            </button>

            {/* Operational Notification Center */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-stone-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors focus:outline-none cursor-pointer"
                aria-label="Operational Notifications"
                aria-expanded={notificationsOpen}
                title="Operational Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#18181B] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-150">
                  <div className="p-3.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-stone-200">
                        Operational Alerts
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-[10px] rounded-full border border-amber-200 dark:border-amber-800/80">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => setUnreadCount(0)}
                        className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 font-medium transition-colors cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-80 overflow-y-auto">
                    <Link
                      to="/inventory"
                      onClick={() => setNotificationsOpen(false)}
                      className="p-3 hover:bg-stone-50 dark:hover:bg-stone-900/60 transition-colors flex items-start gap-3 text-left"
                    >
                      <div className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg shrink-0 mt-0.5 border border-amber-200/60 dark:border-amber-800/60">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-stone-200">
                          Materials below reorder threshold
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-stone-400 truncate">
                          Warehouse replenishment needed
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-stone-500 font-mono mt-1 block">15 min ago</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-400 dark:text-stone-600 self-center shrink-0" />
                    </Link>

                    <Link
                      to="/production"
                      onClick={() => setNotificationsOpen(false)}
                      className="p-3 hover:bg-stone-50 dark:hover:bg-stone-900/60 transition-colors flex items-start gap-3 text-left"
                    >
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg shrink-0 mt-0.5 border border-blue-200/60 dark:border-blue-800/60">
                        <Target className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-stone-200">
                          Work orders active on shop floor
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-stone-400 truncate">
                          Production lines executing planned orders
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-stone-500 font-mono mt-1 block">42 min ago</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-400 dark:text-stone-600 self-center shrink-0" />
                    </Link>

                    <Link
                      to="/quality"
                      onClick={() => setNotificationsOpen(false)}
                      className="p-3 hover:bg-stone-50 dark:hover:bg-stone-900/60 transition-colors flex items-start gap-3 text-left"
                    >
                      <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0 mt-0.5 border border-emerald-200/60 dark:border-emerald-800/60">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-stone-200">
                          Quality inspections logged
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-stone-400 truncate">
                          Batch released with digital genealogy stamp
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-stone-500 font-mono mt-1 block">1 hr ago</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-400 dark:text-stone-600 self-center shrink-0" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Role Badge, Name, Avatar & Sign Out */}
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200/80 dark:border-stone-800">
              <span className="text-xs font-medium bg-stone-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 px-2.5 py-1 rounded-full border border-stone-200 dark:border-stone-700 hidden sm:inline-block">
                {user?.role} Access
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-stone-200 hidden md:inline truncate max-w-[120px]">
                {user?.name}
              </span>
              <div
                className="w-8 h-8 rounded-full bg-slate-900 dark:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center shrink-0 border border-slate-700 dark:border-amber-500 shadow-2xs"
                title={`${user?.name} (${user?.role})`}
              >
                {(user?.name || "OP").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-400 hover:text-slate-800 dark:hover:text-white transition-colors focus:outline-none cursor-pointer"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* ── Page Content Canvas (with clearance for floating dock on md screens) ── */}
        <div className="flex-1 overflow-y-auto bg-[#FAF9F6] dark:bg-[#0F1013] p-4 md:p-8 md:pl-20 transition-colors duration-150">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Top Operational Bar (Below Dashboard Header): Breadcrumb Rollback (Left) + Live Telemetry Clock Pill (Right) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
              {/* Breadcrumb Alur Navigasi (Rollback ke page sebelumnya via alur '/') */}
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium">
                <Link
                  to="/"
                  className="text-stone-400 dark:text-stone-500 hover:text-slate-900 dark:hover:text-white hover:underline transition-colors cursor-pointer"
                  title="Rollback ke Operations (Dashboard)"
                >
                  Operations
                </Link>
                <span className="text-stone-300 dark:text-stone-700 select-none">/</span>

                {domainInfo && domainInfo.name !== currentPage && (
                  <>
                    <Link
                      to={domainInfo.path}
                      className="text-stone-500 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white hover:underline font-semibold transition-colors cursor-pointer"
                      title={`Rollback ke ${domainInfo.name}`}
                    >
                      {domainInfo.name}
                    </Link>
                    <span className="text-stone-300 dark:text-stone-700 select-none">/</span>
                  </>
                )}

                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  {currentPage}
                </span>
              </nav>

              {/* Live Operational Shift Clock & Floor Telemetry Capsule */}
              <LiveTelemetryPill />
            </div>

            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/procurement" element={<Procurement />} />
              <Route path="/production" element={<Production />} />
              <Route path="/quality" element={<Quality />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/audit" element={<AuditTrail />} />
            </Routes>
          </div>
        </div>
      </main>

      {/* ── Utility Modals ── */}
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
      <QuickCreateModal isOpen={quickCreateOpen} onClose={() => setQuickCreateOpen(false)} />
      <SupportModal isOpen={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
      <SettingsModal isOpen={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />

      {/* ── Theme Mode Indicator Toast ── */}
      {themeToast && (
        <div className="fixed top-20 right-8 z-50 bg-[#18181B] text-white text-xs px-4 py-2.5 rounded-full shadow-2xl border border-stone-700/80 flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200">
          {themeMode === "dark" ? (
            <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}
          <span className="font-medium">{themeToast}</span>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
