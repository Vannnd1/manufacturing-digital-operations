import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { apiClient } from "../api/client";
import { Factory, LogIn, Eye, EyeOff } from "lucide-react";
import { Button, Input, Label } from "../components/ui";

const currentYear = new Date().getFullYear();

export function Login() {
  const [email, setEmail] = useState("admin@mfg.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await apiClient.post("/auth/login", { email, password });
      setAuth(data.token, data.user);
      navigate("/");
    } catch (err: any) {
      const serverError = err.response?.data?.error || err.response?.data?.message;
      if (serverError) {
        setError(serverError);
      } else if (err.message === "Network Error") {
        setError("Network error: Unable to reach the server. Please check your internet or wait for backend wake-up.");
      } else {
        setError(err.message || "An error occurred during login.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-sidebar)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl p-10 z-10 rounded-sm">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-amber-600 p-3 rounded-sm shadow-sm">
            <Factory className="text-white w-8 h-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 text-center tracking-tight mb-2">MfgOps System</h1>
        <p className="text-sm text-slate-500 text-center mb-8 font-medium">Enterprise Manufacturing Platform</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <Label htmlFor="email">Work Email</Label>
            <Input
              id="email"
              type="email"
              required
              className="py-2.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                className="py-2.5 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full py-3 mt-4 font-semibold text-sm"
          >
            {loading ? "Authenticating..." : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Access System
              </>
            )}
          </Button>
        </form>

        {/* Quick Fill Demo Roles */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            Quick Fill Demo Roles:
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { role: "Admin", email: "admin@mfg.com", pass: "admin123" },
              { role: "Manager", email: "manager@mfg.com", pass: "demo123" },
              { role: "Purchasing", email: "purchasing@mfg.com", pass: "demo123" },
              { role: "Warehouse", email: "warehouse@mfg.com", pass: "demo123" },
              { role: "Production", email: "production@mfg.com", pass: "demo123" },
              { role: "Quality", email: "qc@mfg.com", pass: "demo123" },
            ].map((d) => (
              <button
                key={d.role}
                type="button"
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.pass);
                  setError("");
                }}
                className={`py-1.5 px-2 text-xs font-medium border text-center transition-colors rounded-none ${
                  email === d.email
                    ? "bg-amber-50 border-amber-500 text-amber-900 font-bold"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                {d.role}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 text-slate-400 text-xs tracking-wider z-10 flex flex-col items-center gap-3">
        <div>&copy; {currentYear} MfgOps Portfolio Platform. All rights reserved.</div>
      </div>
    </div>
  );
}
