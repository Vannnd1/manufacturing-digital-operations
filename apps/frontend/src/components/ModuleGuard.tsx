import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { usePermissionsStore } from "../store/usePermissionsStore";

interface ModuleGuardProps {
  moduleName: string;
  children: React.ReactNode;
}

export function ModuleGuard({ moduleName, children }: ModuleGuardProps) {
  const { user } = useAuthStore();
  const { canAccess, getPermission } = usePermissionsStore();
  const hasAccess = canAccess(user?.role, moduleName);
  const permission = getPermission(user?.role, moduleName);

  if (!hasAccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#18181B] border border-amber-200 dark:border-amber-900/60 rounded-2xl p-8 text-center shadow-lg space-y-5 animate-in fade-in duration-200">
          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/80">
              <Lock className="w-3 h-3" />
              <span>Status Akses: No Access</span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-stone-100">
              Akses Modul Dibatasi
            </h2>

            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Peran Anda <strong className="text-slate-800 dark:text-stone-200">"{user?.role || "Staff"}"</strong> tidak memiliki otorisasi untuk mengakses modul <strong className="text-slate-800 dark:text-stone-200">"{moduleName}"</strong> sesuai dengan ketentuan Permissions Matrix sistem.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 dark:bg-amber-600 text-white font-semibold text-xs hover:bg-slate-800 dark:hover:bg-amber-500 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {permission === "view" && (
        <div className="mb-4 px-4 py-2 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl flex items-center justify-between text-xs text-blue-800 dark:text-blue-300">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              <strong>Mode Lihat Saja (Read-Only):</strong> Peran Anda ({user?.role || "Staff"}) dapat meninjau data operasional modul ini namun tindakan mutasi/perubahan dibatasi.
            </span>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
