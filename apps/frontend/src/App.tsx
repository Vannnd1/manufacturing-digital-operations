import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { Login } from "./pages/Login";
import { Materials } from "./pages/Materials";
import { Inventory } from "./pages/Inventory";
import { Procurement } from "./pages/Procurement";
import { Production } from "./pages/Production";
import { Quality } from "./pages/Quality";
import { Dashboard } from "./pages/Dashboard";
import { LogOut, User } from "lucide-react";

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

  const navItem = (path: string, label: string) => {
    const isActive = location.pathname === path;
    return (
      <Link 
        to={path} 
        className={`block px-4 py-2 text-sm transition-colors border-l-2 ${isActive ? 'bg-white/10 text-white border-amber-500 font-medium' : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--color-background)]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 text-slate-50 border-r border-slate-800 flex flex-col shadow-xl z-10">
        <div className="px-6 py-5 border-b border-slate-800/50 mb-4 flex items-center gap-3">
          <div className="w-6 h-6 bg-amber-600 rounded-sm"></div>
          <div className="font-bold text-base tracking-tight uppercase">MfgOps System</div>
        </div>
        
        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Operations</div>
        <nav className="space-y-0.5 flex-1">
          {navItem("/", "Command Center")}
          {navItem("/materials", "Material Master")}
          {navItem("/inventory", "Inventory Management")}
          {navItem("/procurement", "Procurement")}
          {navItem("/production", "Production Orders")}
          {navItem("/quality", "Quality Control")}
        </nav>
        
        {/* User Profile Snippet */}
        <div className="p-4 mt-auto border-t border-slate-800/50 bg-slate-900/50">
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-sm bg-slate-800 flex items-center justify-center mr-3 border border-slate-700">
              <User className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">{user?.name}</p>
              <p className="text-xs text-amber-500/90 font-medium truncate">{user?.role}</p>
            </div>
            <button onClick={logout} className="p-2 hover:bg-slate-800 rounded-sm text-slate-400 hover:text-white transition-colors" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white flex justify-between items-center px-8 shadow-sm z-0">
          <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Manufacturing Digital Operations MVP</div>
        </header>
        <div className="flex-1 p-8 overflow-y-auto">
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
