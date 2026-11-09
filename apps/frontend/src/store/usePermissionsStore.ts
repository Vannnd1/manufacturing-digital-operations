import { create } from "zustand";

export type PermissionLevel = "none" | "view" | "edit";

export interface ModulePermission {
  module: string;
  admin: PermissionLevel;
  manager: PermissionLevel;
  purchasing: PermissionLevel;
  warehouse: PermissionLevel;
  production: PermissionLevel;
  quality: PermissionLevel;
}

export type RoleKey = "admin" | "manager" | "purchasing" | "warehouse" | "production" | "quality";

/**
 * Default Permissions Matrix exactly reflecting the official system security matrix:
 *
 * | Module               | Admin | Manager | Purchasing | Warehouse | Shop Floor | Quality |
 * |----------------------|-------|---------|------------|-----------|------------|---------|
 * | Dashboard            | Edit  | View    | View       | View      | View       | View    |
 * | Procurement & POs    | Edit  | Edit    | Edit       | View      | None       | None    |
 * | Inventory & Stock    | Edit  | View    | View       | None      | View       | View    |
 * | Materials Master     | Edit  | Edit    | Edit       | View      | View       | View    |
 * | Production Orders    | Edit  | Edit    | None       | View      | Edit       | View    |
 * | Quality Control      | Edit  | View    | None       | None      | View       | Edit    |
 * | Staff & Shifts       | Edit  | View    | None       | None      | None       | None    |
 * | Reporting & OEE      | Edit  | Edit    | View       | View      | View       | View    |
 * | Audit & Traceability | Edit  | View    | None       | None      | None       | None    |
 * | System Settings      | Edit  | View    | None       | None      | None       | None    |
 */
export const DEFAULT_PERMISSIONS_MATRIX: ModulePermission[] = [
  { module: "Dashboard", admin: "edit", manager: "view", purchasing: "view", warehouse: "view", production: "view", quality: "view" },
  { module: "Procurement & POs", admin: "edit", manager: "edit", purchasing: "edit", warehouse: "view", production: "none", quality: "none" },
  { module: "Inventory & Stock", admin: "edit", manager: "view", purchasing: "view", warehouse: "none", production: "view", quality: "view" },
  { module: "Materials Master", admin: "edit", manager: "edit", purchasing: "edit", warehouse: "view", production: "view", quality: "view" },
  { module: "Production Orders", admin: "edit", manager: "edit", purchasing: "none", warehouse: "view", production: "edit", quality: "view" },
  { module: "Quality Control", admin: "edit", manager: "view", purchasing: "none", warehouse: "none", production: "view", quality: "edit" },
  { module: "Staff & Shifts", admin: "edit", manager: "view", purchasing: "none", warehouse: "none", production: "none", quality: "none" },
  { module: "Reporting & OEE", admin: "edit", manager: "edit", purchasing: "view", warehouse: "view", production: "view", quality: "view" },
  { module: "Audit & Traceability", admin: "edit", manager: "view", purchasing: "none", warehouse: "none", production: "none", quality: "none" },
  { module: "System Settings", admin: "edit", manager: "view", purchasing: "none", warehouse: "none", production: "none", quality: "none" },
];

const STORAGE_KEY = "mfg-permissions-matrix";

export function normalizeRoleKey(role?: string | null): RoleKey {
  if (!role) return "production";
  const r = role.toLowerCase().trim();
  if (r.includes("admin")) return "admin";
  if (r.includes("manager")) return "manager";
  if (r.includes("purchas") || r.includes("procure")) return "purchasing";
  if (r.includes("warehous") || r.includes("logist")) return "warehouse";
  if (r.includes("qual") || r === "qc") return "quality";
  if (r.includes("prod") || r.includes("floor") || r.includes("operat")) return "production";
  return "production";
}

export function getModuleForPath(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/procurement")) return "Procurement & POs";
  if (pathname.startsWith("/inventory")) return "Inventory & Stock";
  if (pathname.startsWith("/materials")) return "Materials Master";
  if (pathname.startsWith("/production")) return "Production Orders";
  if (pathname.startsWith("/quality")) return "Quality Control";
  if (pathname.startsWith("/staff")) return "Staff & Shifts";
  if (pathname.startsWith("/reports")) return "Reporting & OEE";
  if (pathname.startsWith("/audit")) return "Audit & Traceability";
  if (pathname.startsWith("/settings")) return "System Settings";
  return "Dashboard";
}

interface PermissionsState {
  matrix: ModulePermission[];
  getPermission: (role: string | null | undefined, moduleName: string) => PermissionLevel;
  canAccess: (role: string | null | undefined, moduleName: string) => boolean;
  canEdit: (role: string | null | undefined, moduleName: string) => boolean;
  canAccessPath: (role: string | null | undefined, pathname: string) => boolean;
  canEditPath: (role: string | null | undefined, pathname: string) => boolean;
  updateCell: (moduleName: string, roleKey: RoleKey, nextLevel: PermissionLevel) => void;
  cycleCell: (moduleName: string, roleKey: RoleKey) => void;
  resetPermissions: () => void;
}

const loadInitialMatrix = (): ModulePermission[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 8) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_PERMISSIONS_MATRIX;
};

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  matrix: loadInitialMatrix(),

  getPermission: (role, moduleName) => {
    const roleKey = normalizeRoleKey(role);
    // Administrators always maintain full edit access
    if (roleKey === "admin") return "edit";

    const row = get().matrix.find((m) => m.module.toLowerCase() === moduleName.toLowerCase());
    if (!row) return "view";
    return row[roleKey] || "none";
  },

  canAccess: (role, moduleName) => {
    const level = get().getPermission(role, moduleName);
    return level === "view" || level === "edit";
  },

  canEdit: (role, moduleName) => {
    return get().getPermission(role, moduleName) === "edit";
  },

  canAccessPath: (role, pathname) => {
    const mod = getModuleForPath(pathname);
    return get().canAccess(role, mod);
  },

  canEditPath: (role, pathname) => {
    const mod = getModuleForPath(pathname);
    return get().canEdit(role, mod);
  },

  updateCell: (moduleName, roleKey, nextLevel) => {
    if (roleKey === "admin") return; // Admin always retains edit
    set((state) => {
      const updated = state.matrix.map((row) => {
        if (row.module.toLowerCase() === moduleName.toLowerCase()) {
          return { ...row, [roleKey]: nextLevel };
        }
        return row;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { matrix: updated };
    });
  },

  cycleCell: (moduleName, roleKey) => {
    if (roleKey === "admin") return;
    const cycleMap: Record<PermissionLevel, PermissionLevel> = {
      none: "view",
      view: "edit",
      edit: "none",
    };
    set((state) => {
      const updated = state.matrix.map((row) => {
        if (row.module.toLowerCase() === moduleName.toLowerCase()) {
          const current = row[roleKey] || "none";
          return { ...row, [roleKey]: cycleMap[current] };
        }
        return row;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { matrix: updated };
    });
  },

  resetPermissions: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ matrix: DEFAULT_PERMISSIONS_MATRIX });
  },
}));
