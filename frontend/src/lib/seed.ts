import { v4 as uuid } from 'uuid';
import type { User, Branch, Warehouse, Product, Customer, Supplier } from '@/types';

export const seedBranches: Branch[] = [
  { id: 'branch-1', name: 'Downtown Auto Center', address: '123 Main St, Metro City', phone: '(555) 100-2000' },
  { id: 'branch-2', name: 'Westside Workshop', address: '456 West Ave, Metro City', phone: '(555) 200-3000' },
];

export const seedWarehouses: Warehouse[] = [
  { id: 'wh-1', name: 'Main Warehouse', branchId: 'branch-1' },
  { id: 'wh-2', name: 'West Warehouse', branchId: 'branch-2' },
  { id: 'wh-3', name: 'Overflow Storage', branchId: 'branch-1' },
];

export const seedUsers: User[] = [
  { id: 'user-1', name: 'Alex Morgan', username: 'admin', password: 'admin123', email: 'alex@autopos.com', role: 'admin', permissions: [], branchId: 'branch-1' },
  { id: 'user-2', name: 'Sam Rivera', username: 'sam', password: 'sam123', email: 'sam@autopos.com', role: 'branch_manager', permissions: [], branchId: 'branch-1' },
  { id: 'user-3', name: 'Jordan Lee', username: 'jordan', password: 'jordan123', email: 'jordan@autopos.com', role: 'service_advisor', permissions: [], branchId: 'branch-1' },
  { id: 'user-4', name: 'Casey Park', username: 'casey', password: 'casey123', email: 'casey@autopos.com', role: 'technician', permissions: [], branchId: 'branch-1' },
  { id: 'user-5', name: 'Taylor Kim', username: 'taylor', password: 'taylor123', email: 'taylor@autopos.com', role: 'cashier', permissions: [], branchId: 'branch-1' },
  { id: 'user-6', name: 'Morgan Chen', username: 'morgan', password: 'morgan123', email: 'morgan@autopos.com', role: 'branch_manager', permissions: [], branchId: 'branch-2' },
  { id: 'user-7', name: 'Riley Adams', username: 'riley', password: 'riley123', email: 'riley@autopos.com', role: 'inventory_manager', permissions: [], branchId: 'branch-1' },
];

const categories = ['Engine Parts', 'Brakes', 'Filters', 'Electrical', 'Fluids', 'Tires', 'Suspension'];
const partNames = [
  'Oil Filter', 'Air Filter', 'Brake Pad Set', 'Spark Plug (x4)', 'Battery 12V', 'Serpentine Belt',
  'Brake Rotor', 'Transmission Fluid 1L', 'Engine Oil 5W-30 5L', 'Cabin Air Filter',
  'Alternator', 'Radiator Hose', 'Wiper Blade Set', 'Headlight Bulb H7', 'Tire 205/55R16',
  'Shock Absorber', 'CV Joint', 'Thermostat', 'Fuel Filter', 'Power Steering Fluid',
];

export const seedProducts: Product[] = partNames.map((name, i) => ({
  id: `prod-${i + 1}`,
  name,
  sku: `SKU-${String(1000 + i)}`,
  barcode: `899${String(100000 + i)}`,
  category: categories[i % categories.length],
  price: Math.round((20 + Math.random() * 180) * 100) / 100,
  cost: Math.round((10 + Math.random() * 100) * 100) / 100,
  branchId: i < 14 ? 'branch-1' : 'branch-2',
  warehouseId: i < 14 ? 'wh-1' : 'wh-2',
  stock: Math.floor(5 + Math.random() * 50),
  minStock: 5,
}));

export const seedCustomers: Customer[] = [
  {
    id: 'cust-1', name: 'David Wilson', phone: '(555) 111-1111', email: 'david@email.com', address: '10 Oak St',
    creditBalance: 0,
    vehicles: [
      { id: uuid(), make: 'Toyota', model: 'Camry', year: 2020, plateNumber: 'ABC-1234', color: 'Silver' },
      { id: uuid(), make: 'Honda', model: 'CR-V', year: 2019, plateNumber: 'DEF-5678', color: 'White' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cust-2', name: 'Maria Garcia', phone: '(555) 222-2222', email: 'maria@email.com', address: '25 Elm Ave',
    creditBalance: 150,
    vehicles: [
      { id: uuid(), make: 'Ford', model: 'F-150', year: 2021, plateNumber: 'GHI-9012', color: 'Blue' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cust-3', name: 'James Brown', phone: '(555) 333-3333', email: 'james@email.com', address: '77 Pine Rd',
    creditBalance: 0,
    vehicles: [
      { id: uuid(), make: 'BMW', model: '3 Series', year: 2022, plateNumber: 'JKL-3456', color: 'Black' },
    ],
    createdAt: new Date().toISOString(),
  },
];

export const seedSuppliers: Supplier[] = [
  { id: 'sup-1', name: 'AutoParts Pro', contactPerson: 'Mike Johnson', phone: '(555) 400-4000', email: 'mike@autopartspro.com', address: '100 Industrial Blvd' },
  { id: 'sup-2', name: 'Premium Motors Supply', contactPerson: 'Lisa Wang', phone: '(555) 500-5000', email: 'lisa@pmsupply.com', address: '200 Commerce Dr' },
];

export function initializeSeedData() {
  if (!localStorage.getItem('app_initialized')) {
    const keys = ['app_branches', 'app_warehouses', 'app_users', 'app_products', 'app_customers', 'app_suppliers'];
    const data = [seedBranches, seedWarehouses, seedUsers, seedProducts, seedCustomers, seedSuppliers];
    keys.forEach((key, i) => localStorage.setItem(key, JSON.stringify(data[i])));
    localStorage.setItem('app_initialized', 'true');
    localStorage.setItem('app_invoices', '[]');
    localStorage.setItem('app_jobcards', '[]');
    localStorage.setItem('app_purchases', '[]');
    localStorage.setItem('app_refunds', '[]');
    localStorage.setItem('app_stock_transfers', '[]');
    localStorage.setItem('app_audit_logs', '[]');
  }
}
