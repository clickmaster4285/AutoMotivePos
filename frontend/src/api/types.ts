/** Shape returned by POST /api/auth/login */
export type BackendLoginUser = {
  userId: string;
  firstName: string;
  lastName?: string;
  email: string;
  role: string;
  permissions?: string[];
};

/** Normalized user for app session (maps backend fields) */
export type ApiLoginUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  branchId?: string;
};

// Add to your existing types file
export interface Category {
  id: string;
  categoryName: string;
  categoryCode: string;
  description?: string;
  department: 'Men' | 'Women' | 'Kids' | 'Unisex' | 'All';
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: string; // User ID
  createdAt?: string;
  updatedAt?: string;
}