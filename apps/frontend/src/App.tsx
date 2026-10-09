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

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-50 border-r border-slate-800 p-4 flex flex-col">
        <div className="font-bold text-lg mb-6 tracking-tight">MfgOps System</div>
        <nav className="space-y-1 flex-1">
          <Link to="/" className="block px-3 py-2 rounded-sm hover:bg-slate-800 text-sm">Dashboard</Link>
          <Link to="/materials" className="block px-3 py-2 rounded-sm hover:bg-slate-800 text-sm">Material Master</Link>
          <Link to="/inventory" className="block px-3 py-2 rounded-sm hover:bg-slate-800 text-sm">Inventory</Link>
          <Link to="/procurement" className="block px-3 py-2 rounded-sm hover:bg-slate-800 text-sm">Procurement</Link>
          <Link to="/production" className="block px-3 py-2 rounded-sm hover:bg-slate-800 text-sm">Production</Link>
          <Link to="/quality" className="block px-3 py-2 rounded-sm hover:bg-slate-800 text-sm">Quality Control</Link>
        </nav>
        
        {/* User Profile Snippet */}
        <div className="pt-4 mt-4 border-t border-slate-800">
          <div className="flex items-center px-2 py-2">
            <div className="w-8 h-8 rounded-sm bg-slate-800 flex items-center justify-center mr-3">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
            <button onClick={logout} className="p-1 hover:bg-slate-800 rounded-sm text-slate-400 hover:text-white" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50">
        <header className="h-14 border-b border-slate-200 bg-white flex items-center px-6">
          <div className="text-sm font-medium text-slate-600">Manufacturing Operations (MVP)</div>
        </header>
        <div className="p-6">
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
