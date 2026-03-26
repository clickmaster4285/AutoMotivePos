export type UserRole = 'admin' | 'branch_manager' | 'service_advisor' | 'technician' | 'cashier' | 'inventory_manager';

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  email: string;
  role: UserRole;
  branchId: string;
  avatar?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface Warehouse {
  id: string;
  name: string;
  branchId: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  price: number;
  cost: number;
  branchId: string;
  warehouseId: string;
  stock: number;
  minStock: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  vehicles: Vehicle[];
  creditBalance: number;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  vin?: string;
  color?: string;
}

export type JobStatus = 'pending' | 'in_progress' | 'waiting_parts' | 'completed' | 'delivered';

export interface JobService {
  id: string;
  name: string;
  price: number;
}

export interface JobPart {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface JobCard {
  id: string;
  jobNumber: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleName: string;
  branchId: string;
  technicianId?: string;
  technicianName?: string;
  status: JobStatus;
  services: JobService[];
  parts: JobPart[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  estimatedCompletion?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'split';

export interface InvoiceItem {
  id: string;
  type: 'product' | 'service';
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  branchId: string;
  userId: string;
  userName: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  paymentMethod: PaymentMethod;
  jobCardId?: string;
  createdAt: string;
  status: 'paid' | 'unpaid' | 'partial';
}

export interface Refund {
  id: string;
  refundNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  branchId: string;
  userId: string;
  userName: string;
  type: 'full' | 'partial';
  reason: string;
  items: RefundItem[];
  total: number;
  createdAt: string;
}

export interface RefundItem {
  id: string;
  invoiceItemId: string;
  name: string;
  type: 'product' | 'service';
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface StockTransfer {
  id: string;
  fromBranchId: string;
  fromBranchName: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toBranchId: string;
  toBranchName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  productId: string;
  productName: string;
  quantity: number;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

export interface PurchaseEntry {
  id: string;
  supplierId: string;
  supplierName: string;
  branchId: string;
  userId: string;
  userName: string;
  items: { productId: string; productName: string; quantity: number; unitCost: number }[];
  total: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  module: string;
  entityId?: string;
  entityType?: string;
  details: string;
  userId: string;
  userName: string;
  branchId: string;
  timestamp: string;
}
