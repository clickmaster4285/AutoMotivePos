import type { User } from "@/types";
import { PID } from "@/lib/permissionIds";

/** At least one of these permission IDs is required to open the route. */
export const routePermissionRequirements: Record<string, string[]> = {
  "/": [PID.dashboard.main.read],
  "/branches": [PID.branch.management.read],
  "/inventory": [PID.inventory.product.read, PID.inventory.stock.read],
  "/transfers": [PID.inventory.stock.read],
  "/jobs": [PID.employee.shift.read, PID.employee.performance.read],
  "/pos": [PID.pos.transaction.read],
  "/refunds": [PID.pos.returns.read],
  "/customers": [PID.customer.database.read],
  "/user-management": [PID.employee.database.read, PID.settings.users.read],
  "/suppliers": [PID.inventory.vendor.read],
  "/reports": [PID.reporting.sales.read],
  "/audit": [PID.settings.security.read, PID.settings.users.read],

   
};

/** Maps UI module keys to backend permission IDs for CRUD. */
const actionPermissionMap: Record<
  string,
  { create: string; edit: string; delete: string }
> = {
  branches: {
    create: PID.branch.management.create,
    edit: PID.branch.management.update,
    delete: PID.branch.management.delete,
  },
  inventory: {
    create: PID.inventory.product.create,
    edit: PID.inventory.product.update,
    delete: PID.inventory.product.delete,
  },
  jobs: {
    create: PID.employee.shift.create,
    edit: PID.employee.shift.update,
    delete: PID.employee.shift.delete,
  },
  pos: {
    create: PID.pos.transaction.create,
    edit: PID.pos.transaction.update,
    delete: PID.pos.transaction.delete,
  },
  refunds: {
    create: PID.pos.returns.create,
    edit: PID.pos.returns.update,
    delete: PID.pos.returns.delete,
  },
  customers: {
    create: PID.customer.database.create,
    edit: PID.customer.database.update,
    delete: PID.customer.database.delete,
  },
  suppliers: {
    create: PID.inventory.vendor.create,
    edit: PID.inventory.vendor.update,
    delete: PID.inventory.vendor.delete,
  },
  transfers: {
    create: PID.inventory.stock.create,
    edit: PID.inventory.stock.update,
    delete: PID.inventory.stock.delete,
  },
  users: {
    create: PID.employee.database.create,
    edit: PID.employee.database.update,
    delete: PID.employee.database.delete,
  },
};

/** Backend role `admin` is treated as having every permission (UI + API alignment). */
export function isAdminUser(user: User | null | undefined): boolean {
  return String(user?.role ?? "").toLowerCase() === "admin";
}

export function permissionSet(user: User | null | undefined): Set<string> {
  return new Set(user?.permissions ?? []);
}

export function hasPermission(user: User | null | undefined, permissionId: string): boolean {
  if (!permissionId) return false;
  if (isAdminUser(user)) return true;
  return permissionSet(user).has(permissionId);
}

export function hasAnyPermission(user: User | null | undefined, permissionIds: string[]): boolean {
  if (isAdminUser(user)) return true;
  if (!user?.permissions?.length || !permissionIds.length) return false;
  const set = permissionSet(user);
  return permissionIds.some((id) => set.has(id));
}

export function hasAllPermissions(user: User | null | undefined, permissionIds: string[]): boolean {
  if (isAdminUser(user)) return true;
  if (!user?.permissions?.length || !permissionIds.length) return false;
  const set = permissionSet(user);
  return permissionIds.every((id) => set.has(id));
}

export function canAccessRoute(user: User | null | undefined, path: string): boolean {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  if (!user.permissions?.length) return false;
  const routeKey = Object.keys(routePermissionRequirements).find((key) => {
    if (key === "/") return path === "/";
    return path === key || path.startsWith(`${key}/`);
  });
  if (!routeKey) return true;
  return hasAnyPermission(user, routePermissionRequirements[routeKey]);
}

export function canPerformAction(
  user: User | null | undefined,
  module: string,
  action: "create" | "edit" | "delete"
): boolean {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  if (!user.permissions?.length) return false;
  const mapped = actionPermissionMap[module];
  if (!mapped) return false;
  const id = action === "edit" ? mapped.edit : mapped[action];
  return hasPermission(user, id);
}

/** Branch switcher in header: users who can read branch management. */
export function canSelectBranchContext(user: User | null | undefined): boolean {
  return hasPermission(user, PID.branch.management.read);
}

/** Cross-branch analytics (org-wide demo data). */
export function canViewAllBranchesData(user: User | null | undefined): boolean {
  return isAdminUser(user);
}
