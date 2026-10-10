import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { Login } from "./pages/Login";
import { Materials } from "./pages/Materials";
import { Inventory } from "./pages/Inventory";
import { Procurement } from "./pages/Procurement";
import { Production } from "./pages/Production";
import { Quality } from "./pages/Quality";
import { Dashboard } from "./pages/Dashboard";
import { 
  LogOut, 
  User, 
  LayoutDashboard, 
  Box, 
  Archive, 
  ShoppingCart, 
  Target, 
  ShieldCheck, 
  Menu, 
  X, 
  PanelLeftClose, 
  PanelLeftOpen 
} from "lucide-react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/materials", label: "Material Master", icon: Box },
  { path: "/inventory", label: "Inventory Management", icon: Archive },
  { path: "/procurement", label: "Procurement", icon: ShoppingCart },
  { path: "/production", label: "Production Orders", icon: Target },
  { path: "/quality", label: "Quality Control", icon: ShieldCheck },
];

function MainLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  // Desktop: persisted collapse state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  // Mobile: drawer open state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Refs for focus management
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const openMobileDrawer = () => {
    setIsMobileOpen(true);
  };

  const closeMobileDrawer = useCallback(() => {
    setIsMobileOpen(false);
    // Return focus to the hamburger button when drawer closes
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  // Escape key closes mobile drawer
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileDrawer();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, closeMobileDrawer]);

  // Body scroll lock while drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  // Move focus to close button when drawer opens
  useEffect(() => {
    if (isMobileOpen) {
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    }
  }, [isMobileOpen]);

  const currentPage = NAV_ITEMS.find(item => item.path === location.pathname)?.label || "Operations";

  const navLinks = NAV_ITEMS.map((item) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={closeMobileDrawer}
        title={isCollapsed ? item.label : undefined}
        aria-current={isActive ? "page" : undefined}
        className={`flex items-center px-3 py-2.5 text-sm transition-colors border-l-2 rounded-r-sm
          ${isActive
            ? "bg-white/10 text-white border-amber-500 font-medium"
            : "text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200"}
          ${isCollapsed ? "justify-center md:justify-center" : "justify-start"}
        `}
      >
        <Icon className={`w-5 h-5 shrink-0 ${isCollapsed ? "md:mr-0 mr-3" : "mr-3"} ${isActive ? "text-amber-500" : ""}`} />
        {/* Always show label on mobile drawer; respect collapse on desktop */}
        <span className={`whitespace-nowrap ${isCollapsed ? "md:hidden" : ""}`}>{item.label}</span>
      </Link>
    );
  });

  return (
    <div className="min-h-screen flex bg-[var(--color-background)]">

      {/* ── Mobile Backdrop ── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden"
          onClick={closeMobileDrawer}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        id="main-sidebar"
        aria-label="Main navigation"
        // inert makes hidden sidebar invisible to keyboard / AT on mobile
        {...(!isMobileOpen ? { inert: "" as unknown as boolean } : {})}
        className={[
          // Base styles
          "fixed inset-y-0 left-0 z-50",
          "bg-slate-950 text-slate-50",
          "border-r border-slate-800",
          "flex flex-col shadow-xl",
          // Motion — translate for mobile, width for desktop
          "transition-transform md:transition-[width] duration-300 ease-in-out motion-reduce:transition-none",
          // Mobile: slide in/out; width is always full-drawer (w-72)
          "w-72 md:w-auto",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Desktop: switch width based on collapsed state
          isCollapsed ? "md:w-20" : "md:w-64",
        ].join(" ")}
      >
        {/* ── Sidebar header: logo + collapse toggle ── */}
        <div className={`p-4 border-b border-slate-800/50 flex items-center ${isCollapsed ? "md:flex-col md:gap-3 justify-between md:justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-6 h-6 bg-amber-600 rounded-sm shrink-0" aria-hidden="true" />
            <span className={`font-bold text-base tracking-tight uppercase whitespace-nowrap ${isCollapsed ? "md:hidden" : ""}`}>
              MfgOps System
            </span>
          </div>

          {/* Mobile: close button (X) */}
          <button
            ref={closeButtonRef}
            onClick={closeMobileDrawer}
            className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop: collapse toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-sm transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-expanded={!isCollapsed}
            aria-controls="main-sidebar"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

        {/* ── Operations label ── */}
        <div className={`px-5 pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider ${isCollapsed ? "md:hidden" : ""}`}>
          Operations
        </div>

        {/* ── Navigation ── */}
        <nav className="space-y-0.5 flex-1 px-2 overflow-y-auto">
          {navLinks}
        </nav>

        {/* ── User profile footer ── */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
          <div className={`flex items-center ${isCollapsed ? "md:flex-col md:gap-2 md:justify-center" : ""}`}>
            <div className="w-9 h-9 rounded-sm bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
              <User className="w-4 h-4 text-slate-300" aria-hidden="true" />
            </div>
            <div className={`flex-1 min-w-0 ml-3 mr-2 ${isCollapsed ? "md:hidden" : ""}`}>
              <p className="text-sm font-medium text-slate-100 truncate">{user?.name}</p>
              <p className="text-xs text-amber-500/90 font-medium truncate">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-slate-800 rounded-sm text-slate-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* ── Header ── */}
        <header className="h-16 shrink-0 border-b border-slate-200 bg-white flex justify-between items-center px-4 md:px-8 shadow-sm z-10">
          <div className="flex items-center">
            {/* Mobile hamburger */}
            <button
              ref={menuButtonRef}
              className="md:hidden p-2 mr-3 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              onClick={openMobileDrawer}
              aria-label="Open navigation menu"
              aria-expanded={isMobileOpen}
              aria-controls="main-sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:block">
                Manufacturing Digital Operations
              </span>
              <span className="text-sm font-semibold text-slate-800">{currentPage}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 border border-slate-200 hidden sm:block">
              {user?.role} Access
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/procurement" element={<Procurement />} />
            <Route path="/production" element={<Production />} />
            <Route path="/quality" element={<Quality />} />
          </Routes>
        </div>
      </main>
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
