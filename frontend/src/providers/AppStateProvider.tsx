// src/providers/AppStateProvider.tsx
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { v4 as uuid } from "uuid";
import { queryKeys } from "@/api/query-keys";
import { queryClient } from "@/lib/query-client";
import { getData, setData, getSingle, setSingle } from "@/lib/storage";
import type { ApiLoginUser } from "@/api/types";
import type {
  User,
  Branch,
  Warehouse,
  Product,
  Customer,
  JobCard,
  Invoice,
  Supplier,
  PurchaseEntry,
  Refund,
  StockTransfer,
  AuditLog,
  Category 
} from "@/types";
import { customerService } from "@/services/customer-service";
import { categoryService } from "@/services/category-service";


function persist<T>(key: string, data: T[]) {
  setData(key, data);
}

type AppStateContextValue = {
  currentUser: User | null;
  authToken: string | null;
  currentBranchId: string;
   categories: Category[]; 
  logout: () => void;
  setBranch: (branchId: string) => void;
  applyAdminSession: (token: string, apiUser: ApiLoginUser) => void;

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

  loading: {
    customers: boolean;
    products: boolean;
       categories: boolean; 
    // add more as needed
  };

  loadAll: () => void;
  loadCustomers: () => Promise<void>;
   loadCategories: () => Promise<void>;
  addAuditLog: (
    action: string,
    module: string,
    details: string,
    entityId?: string,
    entityType?: string
  ) => void;

  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, qty: number) => void;

  addCustomer: (c: Omit<Customer, "id" | "createdAt" | "creditBalance">) => Promise<void>;
  updateCustomer: (id: string, c: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;


  addCategory: (c: Omit<Category, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateCategory: (id: string, c: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  toggleCategoryStatus: (id: string) => Promise<void>;


  addJobCard: (j: Omit<JobCard, "id" | "jobNumber" | "createdAt" | "updatedAt">) => void;
  updateJobCard: (id: string, j: Partial<JobCard>) => void;
  deleteJobCard: (id: string) => void;

  addInvoice: (inv: Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "userId" | "userName">) => void;
  addRefund: (r: Omit<Refund, "id" | "refundNumber" | "createdAt" | "userId" | "userName">) => void;
  addStockTransfer: (t: Omit<StockTransfer, "id" | "createdAt" | "userId" | "userName">) => void;

  addSupplier: (s: Omit<Supplier, "id">) => void;
  updateSupplier: (id: string, s: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  addPurchase: (p: Omit<PurchaseEntry, "id" | "createdAt" | "userId" | "userName">) => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

function loadStoredSession(): { user: User | null; token: string | null; branchId: string } {
  const token = getSingle<string>("app_auth_token");
  const raw = getSingle<User>("app_current_user");
  const isAdmin = String(raw?.role ?? "").toLowerCase() === "admin";
  if (raw && !isAdmin && (!Array.isArray(raw.permissions) || raw.permissions.length === 0)) {
    localStorage.removeItem("app_current_user");
    localStorage.removeItem("app_auth_token");
    return { user: null, token: null, branchId: "branch-1" };
  }
  return {
    user: raw,
    token,
    branchId: getSingle<string>("app_current_branch") || raw?.branchId || "branch-1",
  };
}

function buildInitialState() {
  const session = loadStoredSession();
  return {
    currentUser: session.user,
    authToken: session.token,
    currentBranchId: session.branchId,
    branches: [] as Branch[],
    warehouses: [] as Warehouse[],
    users: [] as User[],
    products: [] as Product[],
    customers: [] as Customer[],
     categories: [] as Category[], 
    jobCards: [] as JobCard[],
    invoices: [] as Invoice[],
    suppliers: [] as Supplier[],
    purchases: [] as PurchaseEntry[],
    refunds: [] as Refund[],
    stockTransfers: [] as StockTransfer[],
    auditLogs: [] as AuditLog[],
    loading: {
      customers: false,
      products: false,
      categories: false,
    },
  };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(buildInitialState);

  const loadAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      branches: getData<Branch>("app_branches"),
      warehouses: getData<Warehouse>("app_warehouses"),
      users: getData<User>("app_users"),
      products: getData<Product>("app_products"),
      customers: getData<Customer>("app_customers"),
        categories: getData<Category>("app_categories"),
      jobCards: getData<JobCard>("app_jobcards"),
      invoices: getData<Invoice>("app_invoices"),
      suppliers: getData<Supplier>("app_suppliers"),
      purchases: getData<PurchaseEntry>("app_purchases"),
      refunds: getData<Refund>("app_refunds"),
      stockTransfers: getData<StockTransfer>("app_stock_transfers"),
      auditLogs: getData<AuditLog>("app_audit_logs"),
    }));
  }, []);

  // Load customers from backend
  const loadCustomers = useCallback(async () => {
    setState(prev => ({ ...prev, loading: { ...prev.loading, customers: true } }));
    try {
      const data = await customerService.getAll();
      setState(prev => ({ ...prev, customers: data, loading: { ...prev.loading, customers: false } }));
    } catch (error) {
      console.error('Failed to load customers:', error);
      setState(prev => ({ ...prev, loading: { ...prev.loading, customers: false } }));
      throw error;
    }
  }, []);

  // Load categories from backend
const loadCategories = useCallback(async () => {
  setState(prev => ({ ...prev, loading: { ...prev.loading, categories: true } }));
  try {
    const data = await categoryService.getAll();
    setState(prev => ({ ...prev, categories: data, loading: { ...prev.loading, categories: false } }));
    // Persist categories to localStorage for offline availability
    persist("app_categories", data);
  } catch (error) {
    console.error('Failed to load categories:', error);
    setState(prev => ({ ...prev, loading: { ...prev.loading, categories: false } }));
    throw error;
  }
}, []);
  

  const applyAdminSession = useCallback((token: string, u: ApiLoginUser) => {
    const roleNorm = String(u.role || "general_staff")
      .toLowerCase()
      .replace(/\s+/g, "_");
    const user: User = {
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.email,
      password: "",
      role: roleNorm,
      permissions: u.permissions ?? [],
      branchId: u.branchId ?? "branch-1",
    };
    setSingle("app_auth_token", token);
    setSingle("app_current_user", user);
    setSingle("app_current_branch", user.branchId);
    const log: AuditLog = {
      id: uuid(),
      action: "login",
      module: "auth",
      details: `${user.name} logged in`,
      userId: user.id,
      userName: user.name,
      branchId: user.branchId,
      timestamp: new Date().toISOString(),
    };
    const logs = [...getData<AuditLog>("app_audit_logs"), log];
    persist("app_audit_logs", logs);
    setState((prev) => ({
      ...prev,
      authToken: token,
      currentUser: user,
      currentBranchId: user.branchId,
      auditLogs: logs,
    }));
    
    // Load customers after login
    loadCustomers();
    loadCategories();
  }, [loadCustomers , loadCategories]);

  const logout = useCallback(() => {
    queryClient.removeQueries({ queryKey: queryKeys.auth.session() });
    setState((prev) => {
      const user = prev.currentUser;
      let auditLogs = prev.auditLogs;
      if (user) {
        const log: AuditLog = {
          id: uuid(),
          action: "logout",
          module: "auth",
          details: `${user.name} logged out`,
          userId: user.id,
          userName: user.name,
          branchId: user.branchId,
          timestamp: new Date().toISOString(),
        };
        auditLogs = [...prev.auditLogs, log];
        persist("app_audit_logs", auditLogs);
      }
      localStorage.removeItem("app_current_user");
      localStorage.removeItem("app_auth_token");
      return { ...prev, currentUser: null, authToken: null, auditLogs };
    });
  }, []);

  const setBranch = useCallback((branchId: string) => {
    setSingle("app_current_branch", branchId);
    setState((prev) => ({ ...prev, currentBranchId: branchId }));
  }, []);

  const addAuditLog = useCallback(
    (action: string, module: string, details: string, entityId?: string, entityType?: string) => {
      setState((prev) => {
        const user = prev.currentUser;
        if (!user) return prev;
        const log: AuditLog = {
          id: uuid(),
          action,
          module,
          details,
          entityId,
          entityType,
          userId: user.id,
          userName: user.name,
          branchId: prev.currentBranchId,
          timestamp: new Date().toISOString(),
        };
        const auditLogs = [...prev.auditLogs, log];
        persist("app_audit_logs", auditLogs);
        return { ...prev, auditLogs };
      });
    },
    []
  );

  // Customer CRUD operations with backend
  const addCustomer = useCallback(async (c: Omit<Customer, "id" | "createdAt" | "creditBalance">) => {
    try {
      const newCustomer = await customerService.create(c);
      setState((prev) => {
        const customers = [...prev.customers, newCustomer];
        persist("app_customers", customers);
        
        const user = prev.currentUser;
        if (user) {
          const log: AuditLog = {
            id: uuid(),
            action: "create",
            module: "customers",
            details: `Added customer: ${newCustomer.name}`,
            entityId: newCustomer.id,
            entityType: "customer",
            userId: user.id,
            userName: user.name,
            branchId: prev.currentBranchId,
            timestamp: new Date().toISOString(),
          };
          const auditLogs = [...prev.auditLogs, log];
          persist("app_audit_logs", auditLogs);
          return { ...prev, customers, auditLogs };
        }
        return { ...prev, customers };
      });
    } catch (error) {
      console.error('Failed to add customer:', error);
      throw error;
    }
  }, []);

  const updateCustomer = useCallback(async (id: string, c: Partial<Customer>) => {
    try {
      const updated = await customerService.update(id, c);
      setState((prev) => {
        const customers = prev.customers.map((x) => (x.id === id ? updated : x));
        persist("app_customers", customers);
        
        const user = prev.currentUser;
        if (user) {
          const log: AuditLog = {
            id: uuid(),
            action: "update",
            module: "customers",
            details: `Updated customer: ${c.name || id}`,
            entityId: id,
            entityType: "customer",
            userId: user.id,
            userName: user.name,
            branchId: prev.currentBranchId,
            timestamp: new Date().toISOString(),
          };
          const auditLogs = [...prev.auditLogs, log];
          persist("app_audit_logs", auditLogs);
          return { ...prev, customers, auditLogs };
        }
        return { ...prev, customers };
      });
    } catch (error) {
      console.error('Failed to update customer:', error);
      throw error;
    }
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      await customerService.delete(id);
      setState((prev) => {
        const customers = prev.customers.filter((x) => x.id !== id);
        persist("app_customers", customers);
        
        const user = prev.currentUser;
        if (user) {
          const log: AuditLog = {
            id: uuid(),
            action: "delete",
            module: "customers",
            details: `Deleted customer ${id}`,
            entityId: id,
            entityType: "customer",
            userId: user.id,
            userName: user.name,
            branchId: prev.currentBranchId,
            timestamp: new Date().toISOString(),
          };
          const auditLogs = [...prev.auditLogs, log];
          persist("app_audit_logs", auditLogs);
          return { ...prev, customers, auditLogs };
        }
        return { ...prev, customers };
      });
    } catch (error) {
      console.error('Failed to delete customer:', error);
      throw error;
    }
  }, []);



// Category CRUD operations with backend
const addCategory = useCallback(async (c: Omit<Category, "id" | "createdAt" | "updatedAt">) => {
  try {
    const newCategory = await categoryService.create(c);
    setState((prev) => {
      const categories = [...prev.categories, newCategory];
      persist("app_categories", categories);
      
      const user = prev.currentUser;
      if (user) {
        const log: AuditLog = {
          id: uuid(),
          action: "create",
          module: "categories",
          details: `Added category: ${newCategory.name}`,
          entityId: newCategory.id,
          entityType: "category",
          userId: user.id,
          userName: user.name,
          branchId: prev.currentBranchId,
          timestamp: new Date().toISOString(),
        };
        const auditLogs = [...prev.auditLogs, log];
        persist("app_audit_logs", auditLogs);
        return { ...prev, categories, auditLogs };
      }
      return { ...prev, categories };
    });
  } catch (error) {
    console.error('Failed to add category:', error);
    throw error;
  }
}, []);

const updateCategory = useCallback(async (id: string, c: Partial<Category>) => {
  try {
    const updated = await categoryService.update(id, c);
    setState((prev) => {
      const categories = prev.categories.map((x) => (x.id === id ? updated : x));
      persist("app_categories", categories);
      
      const user = prev.currentUser;
      if (user) {
        const log: AuditLog = {
          id: uuid(),
          action: "update",
          module: "categories",
          details: `Updated category: ${c.name || id}`,
          entityId: id,
          entityType: "category",
          userId: user.id,
          userName: user.name,
          branchId: prev.currentBranchId,
          timestamp: new Date().toISOString(),
        };
        const auditLogs = [...prev.auditLogs, log];
        persist("app_audit_logs", auditLogs);
        return { ...prev, categories, auditLogs };
      }
      return { ...prev, categories };
    });
  } catch (error) {
    console.error('Failed to update category:', error);
    throw error;
  }
}, []);

const deleteCategory = useCallback(async (id: string) => {
  try {
    await categoryService.delete(id);
    setState((prev) => {
      const categories = prev.categories.filter((x) => x.id !== id);
      persist("app_categories", categories);
      
      const user = prev.currentUser;
      if (user) {
        const log: AuditLog = {
          id: uuid(),
          action: "delete",
          module: "categories",
          details: `Deleted category ${id}`,
          entityId: id,
          entityType: "category",
          userId: user.id,
          userName: user.name,
          branchId: prev.currentBranchId,
          timestamp: new Date().toISOString(),
        };
        const auditLogs = [...prev.auditLogs, log];
        persist("app_audit_logs", auditLogs);
        return { ...prev, categories, auditLogs };
      }
      return { ...prev, categories };
    });
  } catch (error) {
    console.error('Failed to delete category:', error);
    throw error;
  }
}, []);

const toggleCategoryStatus = useCallback(async (id: string) => {
  try {
    const updated = await categoryService.toggleStatus(id);
    setState((prev) => {
      const categories = prev.categories.map((x) => (x.id === id ? updated : x));
      persist("app_categories", categories);
      
      const user = prev.currentUser;
      if (user) {
        const log: AuditLog = {
          id: uuid(),
          action: "toggle_status",
          module: "categories",
          details: `Toggled category ${updated.name} status to ${updated.status}`,
          entityId: id,
          entityType: "category",
          userId: user.id,
          userName: user.name,
          branchId: prev.currentBranchId,
          timestamp: new Date().toISOString(),
        };
        const auditLogs = [...prev.auditLogs, log];
        persist("app_audit_logs", auditLogs);
        return { ...prev, categories, auditLogs };
      }
      return { ...prev, categories };
    });
  } catch (error) {
    console.error('Failed to toggle category status:', error);
    throw error;
  }
}, []);
  
  
  


  // Keep existing local storage operations for other modules
  const addProduct = useCallback((p: Omit<Product, "id">) => {
    setState((prev) => {
      const product = { ...p, id: uuid() } as Product;
      const products = [...prev.products, product];
      persist("app_products", products);
      const user = prev.currentUser;
      if (!user) return { ...prev, products };
      const log: AuditLog = {
        id: uuid(),
        action: "create",
        module: "inventory",
        details: `Added product: ${product.name}`,
        entityId: product.id,
        entityType: "product",
        userId: user.id,
        userName: user.name,
        branchId: prev.currentBranchId,
        timestamp: new Date().toISOString(),
      };
      const auditLogs = [...prev.auditLogs, log];
      persist("app_audit_logs", auditLogs);
      return { ...prev, products, auditLogs };
    });
  }, []);

  const updateProduct = useCallback((id: string, p: Partial<Product>) => {
    setState((prev) => {
      const products = prev.products.map((x) => (x.id === id ? { ...x, ...p } : x));
      persist("app_products", products);
      const user = prev.currentUser;
      if (!user) return { ...prev, products };
      const log: AuditLog = {
        id: uuid(),
        action: "update",
        module: "inventory",
        details: `Updated product: ${p.name || id}`,
        entityId: id,
        entityType: "product",
        userId: user.id,
        userName: user.name,
        branchId: prev.currentBranchId,
        timestamp: new Date().toISOString(),
      };
      const auditLogs = [...prev.auditLogs, log];
      persist("app_audit_logs", auditLogs);
      return { ...prev, products, auditLogs };
    });
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setState((prev) => {
      const name = prev.products.find((x) => x.id === id)?.name;
      const products = prev.products.filter((x) => x.id !== id);
      persist("app_products", products);
      const user = prev.currentUser;
      if (!user) return { ...prev, products };
      const log: AuditLog = {
        id: uuid(),
        action: "delete",
        module: "inventory",
        details: `Deleted product: ${name}`,
        entityId: id,
        entityType: "product",
        userId: user.id,
        userName: user.name,
        branchId: prev.currentBranchId,
        timestamp: new Date().toISOString(),
      };
      const auditLogs = [...prev.auditLogs, log];
      persist("app_audit_logs", auditLogs);
      return { ...prev, products, auditLogs };
    });
  }, []);

  const adjustStock = useCallback((id: string, qty: number) => {
    setState((prev) => {
      const products = prev.products.map((x) =>
        x.id === id ? { ...x, stock: Math.max(0, x.stock + qty) } : x
      );
      persist("app_products", products);
      const user = prev.currentUser;
      if (!user) return { ...prev, products };
      const log: AuditLog = {
        id: uuid(),
        action: "stock_adjust",
        module: "inventory",
        details: `Adjusted stock by ${qty} for product ${id}`,
        entityId: id,
        entityType: "product",
        userId: user.id,
        userName: user.name,
        branchId: prev.currentBranchId,
        timestamp: new Date().toISOString(),
      };
      const auditLogs = [...prev.auditLogs, log];
      persist("app_audit_logs", auditLogs);
      return { ...prev, products, auditLogs };
    });
  }, []);

  // Keep other existing functions (addJobCard, updateJobCard, etc.) as they are
  const addJobCard = useCallback((j: Omit<JobCard, "id" | "jobNumber" | "createdAt" | "updatedAt">) => {
    setState((prev) => {
      const count = prev.jobCards.length + 1;
      const jobCard = {
        ...j,
        id: uuid(),
        jobNumber: `JOB-${String(count).padStart(4, "0")}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as JobCard;
      const jobCards = [...prev.jobCards, jobCard];
      persist("app_jobcards", jobCards);
      const user = prev.currentUser;
      if (!user) return { ...prev, jobCards };
      const log: AuditLog = {
        id: uuid(),
        action: "create",
        module: "jobs",
        details: `Created job card: ${jobCard.jobNumber}`,
        entityId: jobCard.id,
        entityType: "jobcard",
        userId: user.id,
        userName: user.name,
        branchId: prev.currentBranchId,
        timestamp: new Date().toISOString(),
      };
      const auditLogs = [...prev.auditLogs, log];
      persist("app_audit_logs", auditLogs);
      return { ...prev, jobCards, auditLogs };
    });
  }, []);

  const updateJobCard = useCallback((id: string, j: Partial<JobCard>) => {
    setState((prev) => {
      const jobCards = prev.jobCards.map((x) =>
        x.id === id ? { ...x, ...j, updatedAt: new Date().toISOString() } : x
      );
      persist("app_jobcards", jobCards);
      const user = prev.currentUser;
      if (!user) return { ...prev, jobCards };
      const log: AuditLog = {
        id: uuid(),
        action: "update",
        module: "jobs",
        details: `Updated job card ${id}: ${JSON.stringify(j)}`,
        entityId: id,
        entityType: "jobcard",
        userId: user.id,
        userName: user.name,
        branchId: prev.currentBranchId,
        timestamp: new Date().toISOString(),
      };
      const auditLogs = [...prev.auditLogs, log];
      persist("app_audit_logs", auditLogs);
      return { ...prev, jobCards, auditLogs };
    });
  }, []);

  const deleteJobCard = useCallback((id: string) => {
    setState((prev) => {
      const jobCards = prev.jobCards.filter((x) => x.id !== id);
      persist("app_jobcards", jobCards);
      const user = prev.currentUser;
      if (!user) return { ...prev, jobCards };
      const log: AuditLog = {
        id: uuid(),
        action: "delete",
        module: "jobs",
        details: `Deleted job card ${id}`,
        entityId: id,
        entityType: "jobcard",
        userId: user.id,
        userName: user.name,
        branchId: prev.currentBranchId,
        timestamp: new Date().toISOString(),
      };
      const auditLogs = [...prev.auditLogs, log];
      persist("app_audit_logs", auditLogs);
      return { ...prev, jobCards, auditLogs };
    });
  }, []);

  const addInvoice = useCallback(
    (inv: Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "userId" | "userName">) => {
      setState((prev) => {
        const user = prev.currentUser;
        const count = prev.invoices.length + 1;
        const invoice = {
          ...inv,
          id: uuid(),
          invoiceNumber: `INV-${String(count).padStart(4, "0")}`,
          userId: user?.id || "",
          userName: user?.name || "",
          createdAt: new Date().toISOString(),
        } as Invoice;
        const invoices = [...prev.invoices, invoice];
        persist("app_invoices", invoices);
        let products = prev.products;
        let auditLogs = prev.auditLogs;
        if (user) {
          inv.items
            .filter((i) => i.type === "product")
            .forEach((item) => {
              const product = products.find((p) => p.name === item.name);
              if (product) {
                products = products.map((p) =>
                  p.id === product.id ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p
                );
                const slog: AuditLog = {
                  id: uuid(),
                  action: "stock_adjust",
                  module: "inventory",
                  details: `Adjusted stock by ${-item.quantity} for product ${product.id}`,
                  entityId: product.id,
                  entityType: "product",
                  userId: user.id,
                  userName: user.name,
                  branchId: prev.currentBranchId,
                  timestamp: new Date().toISOString(),
                };
                auditLogs = [...auditLogs, slog];
              }
            });
          persist("app_products", products);
          const invLog: AuditLog = {
            id: uuid(),
            action: "create",
            module: "pos",
            details: `Created invoice: ${invoice.invoiceNumber} for $${invoice.total}`,
            entityId: invoice.id,
            entityType: "invoice",
            userId: user.id,
            userName: user.name,
            branchId: prev.currentBranchId,
            timestamp: new Date().toISOString(),
          };
          auditLogs = [...auditLogs, invLog];
          persist("app_audit_logs", auditLogs);
        }
        return { ...prev, invoices, products, auditLogs };
      });
    },
    []
  );

  const addRefund = useCallback(
    (r: Omit<Refund, "id" | "refundNumber" | "createdAt" | "userId" | "userName">) => {
      setState((prev) => {
        const user = prev.currentUser;
        const count = prev.refunds.length + 1;
        const refund = {
          ...r,
          id: uuid(),
          refundNumber: `REF-${String(count).padStart(4, "0")}`,
          userId: user?.id || "",
          userName: user?.name || "",
          createdAt: new Date().toISOString(),
        } as Refund;
        const refunds = [...prev.refunds, refund];
        persist("app_refunds", refunds);
        let invoices = prev.invoices.map((inv) => {
          if (inv.id === refund.invoiceId) {
            const newTotal = Math.max(0, inv.total - refund.total);
            const newAmountDue = Math.max(0, inv.amountDue - refund.total);
            return {
              ...inv,
              total: newTotal,
              amountDue: newAmountDue,
              status: newTotal <= 0 ? ("paid" as const) : inv.status,
            };
          }
          return inv;
        });
        persist("app_invoices", invoices);
        let products = prev.products;
        let auditLogs = prev.auditLogs;
        if (user) {
          refund.items
            .filter((i) => i.type === "product")
            .forEach((item) => {
              const product = products.find((p) => p.name === item.name);
              if (product) {
                products = products.map((p) =>
                  p.id === product.id ? { ...p, stock: p.stock + item.quantity } : p
                );
                const slog: AuditLog = {
                  id: uuid(),
                  action: "stock_adjust",
                  module: "inventory",
                  details: `Adjusted stock by ${item.quantity} for product ${product.id}`,
                  entityId: product.id,
                  entityType: "product",
                  userId: user.id,
                  userName: user.name,
                  branchId: prev.currentBranchId,
                  timestamp: new Date().toISOString(),
                };
                auditLogs = [...auditLogs, slog];
              }
            });
          persist("app_products", products);
          const refLog: AuditLog = {
            id: uuid(),
            action: "create",
            module: "refunds",
            details: `Created refund: ${refund.refundNumber} for $${refund.total}`,
            entityId: refund.id,
            entityType: "refund",
            userId: user.id,
            userName: user.name,
            branchId: prev.currentBranchId,
            timestamp: new Date().toISOString(),
          };
          auditLogs = [...auditLogs, refLog];
          persist("app_audit_logs", auditLogs);
        }
        return { ...prev, refunds, invoices, products, auditLogs };
      });
    },
    []
  );

  const addStockTransfer = useCallback(
    (t: Omit<StockTransfer, "id" | "createdAt" | "userId" | "userName">) => {
      setState((prev) => {
        const user = prev.currentUser;
        const transfer = {
          ...t,
          id: uuid(),
          userId: user?.id || "",
          userName: user?.name || "",
          createdAt: new Date().toISOString(),
        } as StockTransfer;
        const stockTransfers = [...prev.stockTransfers, transfer];
        persist("app_stock_transfers", stockTransfers);
        let products = prev.products;
        const sourceProduct = products.find((p) => p.id === t.productId);
        if (sourceProduct) {
          let updated = products.map((p) =>
            p.id === t.productId ? { ...p, stock: Math.max(0, p.stock - t.quantity) } : p
          );
          const destProduct = updated.find(
            (p) =>
              p.name === sourceProduct.name &&
              p.branchId === t.toBranchId &&
              p.warehouseId === t.toWarehouseId
          );
          let finalProducts: Product[];
          if (destProduct) {
            finalProducts = updated.map((p) =>
              p.id === destProduct.id ? { ...p, stock: p.stock + t.quantity } : p
            );
          } else {
            const newProd: Product = {
              ...sourceProduct,
              id: uuid(),
              branchId: t.toBranchId,
              warehouseId: t.toWarehouseId,
              stock: t.quantity,
            };
            finalProducts = [...updated, newProd];
          }
          persist("app_products", finalProducts);
          products = finalProducts;
        }
        let auditLogs = prev.auditLogs;
        if (user) {
          const log: AuditLog = {
            id: uuid(),
            action: "transfer",
            module: "inventory",
            details: `Transferred ${t.quantity}x ${t.productName} from ${t.fromBranchName} to ${t.toBranchName}`,
            entityId: transfer.id,
            entityType: "stock_transfer",
            userId: user.id,
            userName: user.name,
            branchId: prev.currentBranchId,
            timestamp: new Date().toISOString(),
          };
          auditLogs = [...prev.auditLogs, log];
          persist("app_audit_logs", auditLogs);
        }
        return { ...prev, stockTransfers, products, auditLogs };
      });
    },
    []
  );

  const addSupplier = useCallback((s: Omit<Supplier, "id">) => {
    setState((prev) => {
      const supplier = { ...s, id: uuid() } as Supplier;
      const suppliers = [...prev.suppliers, supplier];
      persist("app_suppliers", suppliers);
      const user = prev.currentUser;
      if (!user) return { ...prev, suppliers };
      const log: AuditLog = {
        id: uuid(),
        action: "create",
        module: "suppliers",
        details: `Added supplier: ${supplier.name}`,
        entityId: supplier.id,
        entityType: "supplier",
        userId: user.id,
        userName: user.name,
        branchId: prev.currentBranchId,
        timestamp: new Date().toISOString(),
      };
      const auditLogs = [...prev.auditLogs, log];
      persist("app_audit_logs", auditLogs);
      return { ...prev, suppliers, auditLogs };
    });
  }, []);

  const updateSupplier = useCallback((id: string, s: Partial<Supplier>) => {
    setState((prev) => {
      const suppliers = prev.suppliers.map((x) => (x.id === id ? { ...x, ...s } : x));
      persist("app_suppliers", suppliers);
      return { ...prev, suppliers };
    });
  }, []);

  const deleteSupplier = useCallback((id: string) => {
    setState((prev) => {
      const suppliers = prev.suppliers.filter((x) => x.id !== id);
      persist("app_suppliers", suppliers);
      const user = prev.currentUser;
      if (!user) return { ...prev, suppliers };
      const log: AuditLog = {
        id: uuid(),
        action: "delete",
        module: "suppliers",
        details: `Deleted supplier ${id}`,
        entityId: id,
        entityType: "supplier",
        userId: user.id,
        userName: user.name,
        branchId: prev.currentBranchId,
        timestamp: new Date().toISOString(),
      };
      const auditLogs = [...prev.auditLogs, log];
      persist("app_audit_logs", auditLogs);
      return { ...prev, suppliers, auditLogs };
    });
  }, []);

  const addPurchase = useCallback(
    (p: Omit<PurchaseEntry, "id" | "createdAt" | "userId" | "userName">) => {
      setState((prev) => {
        const user = prev.currentUser;
        const purchase = {
          ...p,
          id: uuid(),
          userId: user?.id || "",
          userName: user?.name || "",
          createdAt: new Date().toISOString(),
        } as PurchaseEntry;
        const purchases = [...prev.purchases, purchase];
        persist("app_purchases", purchases);
        let products = prev.products;
        let auditLogs = prev.auditLogs;
        if (user) {
          p.items.forEach((item) => {
            products = products.map((x) =>
              x.id === item.productId ? { ...x, stock: Math.max(0, x.stock + item.quantity) } : x
            );
            const slog: AuditLog = {
              id: uuid(),
              action: "stock_adjust",
              module: "inventory",
              details: `Adjusted stock by ${item.quantity} for product ${item.productId}`,
              entityId: item.productId,
              entityType: "product",
              userId: user.id,
              userName: user.name,
              branchId: prev.currentBranchId,
              timestamp: new Date().toISOString(),
            };
            auditLogs = [...auditLogs, slog];
          });
          persist("app_products", products);
          const purLog: AuditLog = {
            id: uuid(),
            action: "create",
            module: "purchases",
            details: `Created purchase from ${purchase.supplierName} for $${purchase.total}`,
            entityId: purchase.id,
            entityType: "purchase",
            userId: user.id,
            userName: user.name,
            branchId: prev.currentBranchId,
            timestamp: new Date().toISOString(),
          };
          auditLogs = [...auditLogs, purLog];
          persist("app_audit_logs", auditLogs);
        }
        return { ...prev, purchases, products, auditLogs };
      });
    },
    []
  );

const value = useMemo(
  () => ({
    currentUser: state.currentUser,
    authToken: state.authToken,
    currentBranchId: state.currentBranchId,
    categories: state.categories, // ADD THIS LINE
    logout,
    setBranch,
    applyAdminSession,
    branches: state.branches,
    warehouses: state.warehouses,
    users: state.users,
    products: state.products,
    customers: state.customers,
    jobCards: state.jobCards,
    invoices: state.invoices,
    suppliers: state.suppliers,
    purchases: state.purchases,
    refunds: state.refunds,
    stockTransfers: state.stockTransfers,
    auditLogs: state.auditLogs,
    loading: state.loading,
    loadAll,
    loadCustomers,
    loadCategories, // ADD THIS LINE
    addAuditLog,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addCategory, // ADD THIS LINE
    updateCategory, // ADD THIS LINE
    deleteCategory, // ADD THIS LINE
    toggleCategoryStatus, // ADD THIS LINE
    addJobCard,
    updateJobCard,
    deleteJobCard,
    addInvoice,
    addRefund,
    addStockTransfer,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addPurchase,
  }),
  [
    state,
    logout,
    setBranch,
    applyAdminSession,
    loadAll,
    loadCustomers,
    loadCategories, // ADD THIS LINE
    addAuditLog,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addCategory, // ADD THIS LINE
    updateCategory, // ADD THIS LINE
    deleteCategory, // ADD THIS LINE
    toggleCategoryStatus, // ADD THIS LINE
    addJobCard,
    updateJobCard,
    deleteJobCard,
    addInvoice,
    addRefund,
    addStockTransfer,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addPurchase,
  ]
);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}