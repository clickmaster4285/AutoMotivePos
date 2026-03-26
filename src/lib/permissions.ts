import type { UserRole } from '@/types';

// Which roles can access which routes
export const routePermissions: Record<string, UserRole[]> = {
  '/': ['admin', 'branch_manager', 'service_advisor', 'technician', 'cashier', 'inventory_manager'],
  '/inventory': ['admin', 'branch_manager', 'service_advisor', 'inventory_manager'],
  '/transfers': ['admin', 'branch_manager', 'inventory_manager'],
  '/jobs': ['admin', 'branch_manager', 'service_advisor', 'technician'],
  '/pos': ['admin', 'branch_manager', 'cashier'],
  '/refunds': ['admin', 'branch_manager', 'cashier'],
  '/customers': ['admin', 'branch_manager', 'service_advisor'],
  '/suppliers': ['admin', 'branch_manager'],
  '/reports': ['admin', 'branch_manager'],
  '/audit': ['admin'],
};

// Which roles can perform CRUD actions per module
export const actionPermissions: Record<string, { create: UserRole[]; edit: UserRole[]; delete: UserRole[] }> = {
  inventory: {
    create: ['admin', 'branch_manager', 'inventory_manager'],
    edit: ['admin', 'branch_manager', 'inventory_manager'],
    delete: ['admin', 'branch_manager'],
  },
  jobs: {
    create: ['admin', 'branch_manager', 'service_advisor'],
    edit: ['admin', 'branch_manager', 'service_advisor', 'technician'],
    delete: ['admin', 'branch_manager'],
  },
  pos: {
    create: ['admin', 'branch_manager', 'cashier'],
    edit: ['admin', 'branch_manager'],
    delete: ['admin'],
  },
  refunds: {
    create: ['admin', 'branch_manager', 'cashier'],
    edit: ['admin'],
    delete: ['admin'],
  },
  customers: {
    create: ['admin', 'branch_manager', 'service_advisor'],
    edit: ['admin', 'branch_manager', 'service_advisor'],
    delete: ['admin', 'branch_manager'],
  },
  suppliers: {
    create: ['admin', 'branch_manager'],
    edit: ['admin', 'branch_manager'],
    delete: ['admin'],
  },
  transfers: {
    create: ['admin', 'branch_manager', 'inventory_manager'],
    edit: ['admin'],
    delete: ['admin'],
  },
};

export function canAccessRoute(role: UserRole | undefined, path: string): boolean {
  if (!role) return false;
  // Find the matching route key
  const routeKey = Object.keys(routePermissions).find(key => {
    if (key === '/') return path === '/';
    return path.startsWith(key);
  });
  if (!routeKey) return true; // unknown routes are accessible
  return routePermissions[routeKey].includes(role);
}

export function canPerformAction(role: UserRole | undefined, module: string, action: 'create' | 'edit' | 'delete'): boolean {
  if (!role) return false;
  const perms = actionPermissions[module];
  if (!perms) return role === 'admin';
  return perms[action].includes(role);
}
