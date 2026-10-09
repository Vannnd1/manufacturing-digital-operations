import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { apiClient } from "../api/client";
import { Factory, LogIn } from "lucide-react";
import { Button, Input, Label } from "../components/ui";

export function Login() {
  const [email, setEmail] = useState("admin@mfg.com");
  const [password, setPassword] = useState("admin123");
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
      {/* Abstract Background Element */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] border-[40px] border-amber-500 rounded-full blur-3xl"></div>
        <div className="absolute top-[80%] right-[10%] w-[30%] h-[30%] border-[20px] border-slate-500 rounded-full blur-2xl"></div>
      </div>

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
            <Input
              id="password"
              type="password"
              required
              className="py-2.5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
      <div className="mt-8 text-slate-400 text-xs tracking-wider z-10">
        &copy; {new Date().getFullYear()} MfgOps Inc. All rights reserved.
      </div>
    </div>
  );
}
