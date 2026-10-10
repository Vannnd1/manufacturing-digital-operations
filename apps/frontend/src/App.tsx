import { useState } from "react";
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

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const currentPage = NAV_ITEMS.find(item => item.path === location.pathname)?.label || "Operations";

  return (
    <div className="min-h-screen flex bg-[var(--color-background)]">
      
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 bg-slate-950 text-slate-50 border-r border-slate-800 flex flex-col shadow-xl transition-all duration-300 ease-in-out motion-reduce:transition-none transform
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-20' : 'w-64'}
        `}
      >
        {/* Mobile close button (inside sidebar) */}
        <div className="absolute top-4 right-4 md:hidden">
          <button onClick={() => setIsMobileOpen(false)} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className={`p-4 border-b border-slate-800/50 mb-4 flex ${isCollapsed ? 'flex-col items-center gap-4' : 'items-center justify-between'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-6 h-6 bg-amber-600 rounded-sm shrink-0"></div>
            {!isCollapsed && <div className="font-bold text-base tracking-tight uppercase whitespace-nowrap">MfgOps System</div>}
          </div>
          
          {/* Desktop collapse toggle */}
          <button 
            onClick={toggleSidebar}
            className="hidden md:flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-sm transition-colors shrink-0"
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>
        
        {!isCollapsed && <div className="px-5 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Operations</div>}
        <nav className="space-y-0.5 flex-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path}
                to={item.path} 
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center px-3 py-2.5 text-sm transition-colors border-l-2 rounded-r-sm
                  ${isActive 
                    ? 'bg-white/10 text-white border-amber-500 font-medium' 
                    : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'}
                  ${isCollapsed ? 'justify-center' : 'justify-start'}
                `}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-amber-500' : ''}`} />
                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Snippet */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
          <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : ''}`}>
            <div className="w-9 h-9 rounded-sm bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
              <User className="w-4 h-4 text-slate-300" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 ml-3 mr-2">
                <p className="text-sm font-medium text-slate-100 truncate">{user?.name}</p>
                <p className="text-xs text-amber-500/90 font-medium truncate">{user?.role}</p>
              </div>
            )}
            <button 
              onClick={logout} 
              className={`p-2 hover:bg-slate-800 rounded-sm text-slate-400 hover:text-white transition-colors ${isCollapsed ? 'w-full flex justify-center' : ''}`} 
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 shrink-0 border-b border-slate-200 bg-white flex justify-between items-center px-4 md:px-8 shadow-sm z-10">
          <div className="flex items-center">
            {/* Mobile hamburger menu */}
            <button 
              className="md:hidden p-2 mr-3 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-sm transition-colors"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:block">Manufacturing Digital Operations</span>
              <span className="text-sm font-semibold text-slate-800">{currentPage}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {/* Header secondary content placeholder */}
             <div className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 border border-slate-200 hidden sm:block">
               {user?.role} Access
             </div>
          </div>
        </header>
        
        {/* Scrollable Page Content */}
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
