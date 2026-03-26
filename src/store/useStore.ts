import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { getData, setData, getSingle, setSingle } from '@/lib/storage';
import type {
  User, Branch, Warehouse, Product, Customer, JobCard, Invoice, Supplier,
  PurchaseEntry, Refund, StockTransfer, AuditLog, UserRole
} from '@/types';

interface AppState {
  currentUser: User | null;
  currentBranchId: string;
  login: (username: string, password: string) => User | null;
  logout: () => void;
  setBranch: (branchId: string) => void;

  branches: Branch[];
  warehouses: Warehouse[];
  users: User[];
  products: Product[];
  customers: Customer[];
  jobCards: JobCard[];
  invoices: Invoice[];
  suppliers: Supplier[];
  purchases: PurchaseEntry[];
  refunds: Refund[];
  stockTransfers: StockTransfer[];
  auditLogs: AuditLog[];

  loadAll: () => void;
  addAuditLog: (action: string, module: string, details: string, entityId?: string, entityType?: string) => void;

  addProduct: (p: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, qty: number) => void;

  addCustomer: (c: Omit<Customer, 'id' | 'createdAt' | 'creditBalance'>) => void;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addJobCard: (j: Omit<JobCard, 'id' | 'jobNumber' | 'createdAt' | 'updatedAt'>) => void;
  updateJobCard: (id: string, j: Partial<JobCard>) => void;
  deleteJobCard: (id: string) => void;

  addInvoice: (inv: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'userId' | 'userName'>) => void;
  addRefund: (r: Omit<Refund, 'id' | 'refundNumber' | 'createdAt' | 'userId' | 'userName'>) => void;
  addStockTransfer: (t: Omit<StockTransfer, 'id' | 'createdAt' | 'userId' | 'userName'>) => void;

  addSupplier: (s: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, s: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  addPurchase: (p: Omit<PurchaseEntry, 'id' | 'createdAt' | 'userId' | 'userName'>) => void;
}

function persist<T>(key: string, data: T[]) { setData(key, data); }

export const useStore = create<AppState>((set, get) => ({
  currentUser: getSingle<User>('app_current_user'),
  currentBranchId: getSingle<string>('app_current_branch') || 'branch-1',

  branches: [], warehouses: [], users: [], products: [], customers: [],
  jobCards: [], invoices: [], suppliers: [], purchases: [],
  refunds: [], stockTransfers: [], auditLogs: [],

  login: (username, password) => {
    const users = getData<User>('app_users');
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setSingle('app_current_user', user);
      setSingle('app_current_branch', user.branchId);
      set({ currentUser: user, currentBranchId: user.branchId });
      // Audit
      const log: AuditLog = {
        id: uuid(), action: 'login', module: 'auth', details: `${user.name} logged in`,
        userId: user.id, userName: user.name, branchId: user.branchId, timestamp: new Date().toISOString(),
      };
      const logs = [...getData<AuditLog>('app_audit_logs'), log];
      persist('app_audit_logs', logs);
      set({ auditLogs: logs });
      return user;
    }
    return null;
  },
  logout: () => {
    const user = get().currentUser;
    if (user) {
      const log: AuditLog = {
        id: uuid(), action: 'logout', module: 'auth', details: `${user.name} logged out`,
        userId: user.id, userName: user.name, branchId: user.branchId, timestamp: new Date().toISOString(),
      };
      const logs = [...get().auditLogs, log];
      persist('app_audit_logs', logs);
    }
    localStorage.removeItem('app_current_user');
    set({ currentUser: null });
  },
  setBranch: (branchId) => {
    setSingle('app_current_branch', branchId);
    set({ currentBranchId: branchId });
  },

  loadAll: () => {
    set({
      branches: getData<Branch>('app_branches'),
      warehouses: getData<Warehouse>('app_warehouses'),
      users: getData<User>('app_users'),
      products: getData<Product>('app_products'),
      customers: getData<Customer>('app_customers'),
      jobCards: getData<JobCard>('app_jobcards'),
      invoices: getData<Invoice>('app_invoices'),
      suppliers: getData<Supplier>('app_suppliers'),
      purchases: getData<PurchaseEntry>('app_purchases'),
      refunds: getData<Refund>('app_refunds'),
      stockTransfers: getData<StockTransfer>('app_stock_transfers'),
      auditLogs: getData<AuditLog>('app_audit_logs'),
    });
  },

  addAuditLog: (action, module, details, entityId, entityType) => {
    const user = get().currentUser;
    if (!user) return;
    const log: AuditLog = {
      id: uuid(), action, module, details, entityId, entityType,
      userId: user.id, userName: user.name, branchId: get().currentBranchId, timestamp: new Date().toISOString(),
    };
    const auditLogs = [...get().auditLogs, log];
    persist('app_audit_logs', auditLogs);
    set({ auditLogs });
  },

  // Products
  addProduct: (p) => {
    const product = { ...p, id: uuid() } as Product;
    const products = [...get().products, product];
    persist('app_products', products);
    set({ products });
    get().addAuditLog('create', 'inventory', `Added product: ${product.name}`, product.id, 'product');
  },
  updateProduct: (id, p) => {
    const products = get().products.map(x => x.id === id ? { ...x, ...p } : x);
    persist('app_products', products);
    set({ products });
    get().addAuditLog('update', 'inventory', `Updated product: ${p.name || id}`, id, 'product');
  },
  deleteProduct: (id) => {
    const name = get().products.find(x => x.id === id)?.name;
    const products = get().products.filter(x => x.id !== id);
    persist('app_products', products);
    set({ products });
    get().addAuditLog('delete', 'inventory', `Deleted product: ${name}`, id, 'product');
  },
  adjustStock: (id, qty) => {
    const products = get().products.map(x => x.id === id ? { ...x, stock: Math.max(0, x.stock + qty) } : x);
    persist('app_products', products);
    set({ products });
    get().addAuditLog('stock_adjust', 'inventory', `Adjusted stock by ${qty} for product ${id}`, id, 'product');
  },

  // Customers
  addCustomer: (c) => {
    const customer = { ...c, id: uuid(), creditBalance: 0, createdAt: new Date().toISOString() } as Customer;
    const customers = [...get().customers, customer];
    persist('app_customers', customers);
    set({ customers });
    get().addAuditLog('create', 'customers', `Added customer: ${customer.name}`, customer.id, 'customer');
  },
  updateCustomer: (id, c) => {
    const customers = get().customers.map(x => x.id === id ? { ...x, ...c } : x);
    persist('app_customers', customers);
    set({ customers });
    get().addAuditLog('update', 'customers', `Updated customer: ${c.name || id}`, id, 'customer');
  },
  deleteCustomer: (id) => {
    const customers = get().customers.filter(x => x.id !== id);
    persist('app_customers', customers);
    set({ customers });
    get().addAuditLog('delete', 'customers', `Deleted customer ${id}`, id, 'customer');
  },

  // Job Cards
  addJobCard: (j) => {
    const count = get().jobCards.length + 1;
    const jobCard = {
      ...j, id: uuid(), jobNumber: `JOB-${String(count).padStart(4, '0')}`,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    } as JobCard;
    const jobCards = [...get().jobCards, jobCard];
    persist('app_jobcards', jobCards);
    set({ jobCards });
    get().addAuditLog('create', 'jobs', `Created job card: ${jobCard.jobNumber}`, jobCard.id, 'jobcard');
  },
  updateJobCard: (id, j) => {
    const jobCards = get().jobCards.map(x => x.id === id ? { ...x, ...j, updatedAt: new Date().toISOString() } : x);
    persist('app_jobcards', jobCards);
    set({ jobCards });
    get().addAuditLog('update', 'jobs', `Updated job card ${id}: ${JSON.stringify(j)}`, id, 'jobcard');
  },
  deleteJobCard: (id) => {
    const jobCards = get().jobCards.filter(x => x.id !== id);
    persist('app_jobcards', jobCards);
    set({ jobCards });
    get().addAuditLog('delete', 'jobs', `Deleted job card ${id}`, id, 'jobcard');
  },

  // Invoices
  addInvoice: (inv) => {
    const user = get().currentUser;
    const count = get().invoices.length + 1;
    const invoice = {
      ...inv, id: uuid(), invoiceNumber: `INV-${String(count).padStart(4, '0')}`,
      userId: user?.id || '', userName: user?.name || '',
      createdAt: new Date().toISOString(),
    } as Invoice;
    const invoices = [...get().invoices, invoice];
    persist('app_invoices', invoices);
    set({ invoices });
    inv.items.filter(i => i.type === 'product').forEach(item => {
      const product = get().products.find(p => p.name === item.name);
      if (product) get().adjustStock(product.id, -item.quantity);
    });
    get().addAuditLog('create', 'pos', `Created invoice: ${invoice.invoiceNumber} for $${invoice.total}`, invoice.id, 'invoice');
  },

  // Refunds
  addRefund: (r) => {
    const user = get().currentUser;
    const count = get().refunds.length + 1;
    const refund = {
      ...r, id: uuid(), refundNumber: `REF-${String(count).padStart(4, '0')}`,
      userId: user?.id || '', userName: user?.name || '',
      createdAt: new Date().toISOString(),
    } as Refund;
    const refunds = [...get().refunds, refund];
    persist('app_refunds', refunds);
    set({ refunds });

    // Update invoice totals
    const invoices = get().invoices.map(inv => {
      if (inv.id === refund.invoiceId) {
        const newTotal = Math.max(0, inv.total - refund.total);
        const newAmountDue = Math.max(0, inv.amountDue - refund.total);
        return { ...inv, total: newTotal, amountDue: newAmountDue, status: newTotal <= 0 ? 'paid' as const : inv.status };
      }
      return inv;
    });
    persist('app_invoices', invoices);
    set({ invoices });

    // Return products to stock
    refund.items.filter(i => i.type === 'product').forEach(item => {
      const product = get().products.find(p => p.name === item.name);
      if (product) get().adjustStock(product.id, item.quantity);
    });

    get().addAuditLog('create', 'refunds', `Created refund: ${refund.refundNumber} for $${refund.total}`, refund.id, 'refund');
  },

  // Stock Transfers
  addStockTransfer: (t) => {
    const user = get().currentUser;
    const transfer = {
      ...t, id: uuid(), userId: user?.id || '', userName: user?.name || '',
      createdAt: new Date().toISOString(),
    } as StockTransfer;
    const stockTransfers = [...get().stockTransfers, transfer];
    persist('app_stock_transfers', stockTransfers);
    set({ stockTransfers });

    // Deduct from source, create/add to destination
    const products = get().products;
    const sourceProduct = products.find(p => p.id === t.productId);
    if (sourceProduct) {
      // Deduct from source
      const updated = products.map(p => p.id === t.productId ? { ...p, stock: Math.max(0, p.stock - t.quantity) } : p);

      // Find or create destination product
      const destProduct = updated.find(p =>
        p.name === sourceProduct.name && p.branchId === t.toBranchId && p.warehouseId === t.toWarehouseId
      );
      let finalProducts: Product[];
      if (destProduct) {
        finalProducts = updated.map(p => p.id === destProduct.id ? { ...p, stock: p.stock + t.quantity } : p);
      } else {
        const newProd: Product = { ...sourceProduct, id: uuid(), branchId: t.toBranchId, warehouseId: t.toWarehouseId, stock: t.quantity };
        finalProducts = [...updated, newProd];
      }
      persist('app_products', finalProducts);
      set({ products: finalProducts });
    }
    get().addAuditLog('transfer', 'inventory', `Transferred ${t.quantity}x ${t.productName} from ${t.fromBranchName} to ${t.toBranchName}`, transfer.id, 'stock_transfer');
  },

  // Suppliers
  addSupplier: (s) => {
    const supplier = { ...s, id: uuid() } as Supplier;
    const suppliers = [...get().suppliers, supplier];
    persist('app_suppliers', suppliers);
    set({ suppliers });
    get().addAuditLog('create', 'suppliers', `Added supplier: ${supplier.name}`, supplier.id, 'supplier');
  },
  updateSupplier: (id, s) => {
    const suppliers = get().suppliers.map(x => x.id === id ? { ...x, ...s } : x);
    persist('app_suppliers', suppliers);
    set({ suppliers });
  },
  deleteSupplier: (id) => {
    const suppliers = get().suppliers.filter(x => x.id !== id);
    persist('app_suppliers', suppliers);
    set({ suppliers });
    get().addAuditLog('delete', 'suppliers', `Deleted supplier ${id}`, id, 'supplier');
  },

  // Purchases
  addPurchase: (p) => {
    const user = get().currentUser;
    const purchase = {
      ...p, id: uuid(), userId: user?.id || '', userName: user?.name || '',
      createdAt: new Date().toISOString(),
    } as PurchaseEntry;
    const purchases = [...get().purchases, purchase];
    persist('app_purchases', purchases);
    set({ purchases });
    p.items.forEach(item => get().adjustStock(item.productId, item.quantity));
    get().addAuditLog('create', 'purchases', `Created purchase from ${purchase.supplierName} for $${purchase.total}`, purchase.id, 'purchase');
  },
}));
