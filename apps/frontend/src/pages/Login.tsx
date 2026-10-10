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
      setError(err.response?.data?.error || "An error occurred during login.");
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
      </div>
      <div className="mt-8 text-slate-400 text-xs tracking-wider z-10 flex flex-col items-center gap-4">
        <div>&copy; {currentYear} MfgOps Inc. All rights reserved.</div>
        <button 
          type="button" 
          onClick={async () => {
            try {
              const { apiClient } = await import("../api/client");
              const res = await apiClient.get("/auth/seed-demo-users");
              alert(res.data.message || "Success!");
            } catch (err: any) {
              alert("Failed: " + (err.response?.data?.error || err.message));
            }
          }}
          className="text-amber-500/70 hover:text-amber-500 underline transition-colors"
        >
          Developer: Auto-Generate Test Accounts
        </button>
      </div>
    </div>
  );
}
