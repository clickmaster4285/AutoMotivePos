/** Labels for backend `user.role` values (see `backend/models/user.model.js`). */
export const ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "general_staff", label: "General staff" },
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Cashier" },
  { value: "technician", label: "Technician" },
  { value: "staff", label: "Staff" },
] as const;
