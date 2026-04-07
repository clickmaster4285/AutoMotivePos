import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSettingsQuery } from "@/hooks/api/useSettings";
import { v4 as uuid } from "uuid";
import { queryKeys } from "@/api/query-keys";
import { getData, getSingle, setData, setSingle } from "@/lib/storage";
import type { ApiLoginUser } from "@/api/types";
import type {
  AuditLog,
  Branch,
  Category,
  Customer,
  Invoice,
  JobCard,
  Product,
  PurchaseEntry,
  Refund,
  StockTransfer,
  Supplier,
  User,
  Warehouse,
} from "@/types";
import { customerService } from "@/services/customer-service";
import { categoryService } from "@/services/category-service";

const localKeys = {
  branches: "app_branches",
  warehouses: "app_warehouses",
  users: "app_users",
  products: "app_products",
  jobCards: "app_jobcards",
  invoices: "app_invoices",
  suppliers: "app_suppliers",
  purchases: "app_purchases",
  refunds: "app_refunds",
  stockTransfers: "app_stock_transfers",
  auditLogs: "app_audit_logs",
  customers: "app_customers",
  categories: "app_categories",
} as const;

function useLocalList<T>(storageKey: string) {
  return useQuery({
    queryKey: ["local", storageKey],
    queryFn: () => getData<T>(storageKey),
    initialData: () => getData<T>(storageKey),
  });
}

function persistAndSet<T>(qc: ReturnType<typeof useQueryClient>, storageKey: string, next: T[]) {
  setData(storageKey, next);
  qc.setQueryData(["local", storageKey], next);
}

export function useAppState() {
  const qc = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: () => ({
      token: getSingle<string>("app_auth_token"),
      user: getSingle<User>("app_current_user"),
    }),
    initialData: () => ({
      token: getSingle<string>("app_auth_token"),
      user: getSingle<User>("app_current_user"),
    }),
  });
  const branchIdQuery = useQuery({
    queryKey: ["app", "currentBranchId"],
    queryFn: () => getSingle<string>("app_current_branch"),
    initialData: () => getSingle<string>("app_current_branch"),
  });

  const branchesQuery = useLocalList<Branch>(localKeys.branches);
  const warehousesQuery = useLocalList<Warehouse>(localKeys.warehouses);
  const usersQuery = useLocalList<User>(localKeys.users);
  const productsQuery = useLocalList<Product>(localKeys.products);
  const jobCardsQuery = useLocalList<JobCard>(localKeys.jobCards);
  const invoicesQuery = useLocalList<Invoice>(localKeys.invoices);
  const suppliersQuery = useLocalList<Supplier>(localKeys.suppliers);
  const purchasesQuery = useLocalList<PurchaseEntry>(localKeys.purchases);
  const refundsQuery = useLocalList<Refund>(localKeys.refunds);
  const stockTransfersQuery = useLocalList<StockTransfer>(localKeys.stockTransfers);
  const auditLogsQuery = useLocalList<AuditLog>(localKeys.auditLogs);

  const customersQuery = useQuery({
    queryKey: queryKeys.customers.list(),
    queryFn: async () => {
      try {
        const rows = await customerService.getAll();
        setData(localKeys.customers, rows);
        return rows;
      } catch {
        return getData<Customer>(localKeys.customers);
      }
    },
    initialData: () => getData<Customer>(localKeys.customers),
    enabled: !!sessionQuery.data?.token,
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: async () => {
      try {
        const rows = await categoryService.getAll();
        setData(localKeys.categories, rows);
        return rows;
      } catch {
        return getData<Category>(localKeys.categories);
      }
    },
    initialData: () => getData<Category>(localKeys.categories),
    enabled: !!sessionQuery.data?.token,
  });

  const settingsQuery = useSettingsQuery({ enabled: !!sessionQuery.data?.token });

  const currentUser = sessionQuery.data?.user ?? null;
  const authToken = sessionQuery.data?.token ?? null;
  const currentBranchId = branchIdQuery.data ?? currentUser?.branchId ?? "branch-1";
  const branches = branchesQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const jobCards = jobCardsQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];
  const purchases = purchasesQuery.data ?? [];
  const refunds = refundsQuery.data ?? [];
  const stockTransfers = stockTransfersQuery.data ?? [];
  const auditLogs = auditLogsQuery.data ?? [];
  const settings = settingsQuery.data;

  const appendAudit = useCallback(
    (log: Omit<AuditLog, "id" | "timestamp">) => {
      const next = [...(qc.getQueryData<AuditLog[]>(["local", localKeys.auditLogs]) ?? []), { ...log, id: uuid(), timestamp: new Date().toISOString() }];
      persistAndSet(qc, localKeys.auditLogs, next);
    },
    [qc]
  );

  const loadAll = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["local"] });
    void qc.invalidateQueries({ queryKey: queryKeys.customers.all });
    void qc.invalidateQueries({ queryKey: queryKeys.categories.all });
  }, [qc]);
  const loadCustomers = useCallback(async () => {
    await customersQuery.refetch();
  }, [customersQuery]);
  const loadCategories = useCallback(async () => {
    await categoriesQuery.refetch();
  }, [categoriesQuery]);

  const applyAdminSession = useCallback(
    (token: string, u: ApiLoginUser) => {
      const user: User = {
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.email,
        password: "",
        role: String(u.role || "general_staff").toLowerCase().replace(/\s+/g, "_"),
        permissions: u.permissions ?? [],
        branchId: u.branchId ?? "branch-1",
      };
      setSingle("app_auth_token", token);
      setSingle("app_current_user", user);
      setSingle("app_current_branch", user.branchId);
      qc.setQueryData(queryKeys.auth.session(), { token, user });
      qc.setQueryData(["app", "currentBranchId"], user.branchId);
      appendAudit({
        action: "login",
        module: "auth",
        details: `${user.name} logged in`,
        userId: user.id,
        userName: user.name,
        branchId: user.branchId,
      });
    },
    [appendAudit, qc]
  );
  const logout = useCallback(() => {
    if (currentUser) {
      appendAudit({
        action: "logout",
        module: "auth",
        details: `${currentUser.name} logged out`,
        userId: currentUser.id,
        userName: currentUser.name,
        branchId: currentBranchId,
      });
    }
    localStorage.removeItem("app_current_user");
    localStorage.removeItem("app_auth_token");
    qc.setQueryData(queryKeys.auth.session(), { token: null, user: null });
  }, [appendAudit, currentBranchId, currentUser, qc]);
  const setBranch = useCallback(
    (branchId: string) => {
      setSingle("app_current_branch", branchId);
      qc.setQueryData(["app", "currentBranchId"], branchId);
    },
    [qc]
  );

  const addProduct = useCallback((p: Omit<Product, "id">) => {
    persistAndSet(qc, localKeys.products, [...products, { ...p, id: uuid() } as Product]);
  }, [products, qc]);
  const updateProduct = useCallback((id: string, p: Partial<Product>) => {
    persistAndSet(qc, localKeys.products, products.map((x) => (x.id === id ? { ...x, ...p } : x)));
  }, [products, qc]);
  const deleteProduct = useCallback((id: string) => {
    persistAndSet(qc, localKeys.products, products.filter((x) => x.id !== id));
  }, [products, qc]);
  const adjustStock = useCallback((id: string, qty: number) => {
    persistAndSet(qc, localKeys.products, products.map((x) => (x.id === id ? { ...x, stock: Math.max(0, x.stock + qty) } : x)));
  }, [products, qc]);

  const addCustomer = useCallback(async (c: Omit<Customer, "id" | "createdAt" | "creditBalance">) => {
    await customerService.create(c);
    await qc.invalidateQueries({ queryKey: queryKeys.customers.all });
  }, [qc]);
  const updateCustomer = useCallback(async (id: string, c: Partial<Customer>) => {
    await customerService.update(id, c);
    await qc.invalidateQueries({ queryKey: queryKeys.customers.all });
  }, [qc]);
  const deleteCustomer = useCallback(async (id: string) => {
    await customerService.delete(id);
    await qc.invalidateQueries({ queryKey: queryKeys.customers.all });
  }, [qc]);

  const addCategory = useCallback(async (c: Omit<Category, "id" | "createdAt" | "updatedAt">) => {
    await categoryService.create({ categoryName: c.name, categoryCode: c.code, description: c.description, department: c.department });
    await qc.invalidateQueries({ queryKey: queryKeys.categories.all });
  }, [qc]);
  const updateCategory = useCallback(async (id: string, c: Partial<Category>) => {
    await categoryService.update(id, { categoryName: c.name, categoryCode: c.code, description: c.description, department: c.department, status: c.status });
    await qc.invalidateQueries({ queryKey: queryKeys.categories.all });
  }, [qc]);
  const deleteCategory = useCallback(async (id: string) => {
    await categoryService.delete(id);
    await qc.invalidateQueries({ queryKey: queryKeys.categories.all });
  }, [qc]);
  const toggleCategoryStatus = useCallback(async (id: string) => {
    await categoryService.toggleStatus(id);
    await qc.invalidateQueries({ queryKey: queryKeys.categories.all });
  }, [qc]);

  const addJobCard = useCallback((j: Omit<JobCard, "id" | "jobNumber" | "createdAt" | "updatedAt">) => {
    const next = [...jobCards, { ...j, id: uuid(), jobNumber: `JOB-${String(jobCards.length + 1).padStart(4, "0")}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as JobCard];
    persistAndSet(qc, localKeys.jobCards, next);
  }, [jobCards, qc]);
  const updateJobCard = useCallback((id: string, j: Partial<JobCard>) => {
    persistAndSet(qc, localKeys.jobCards, jobCards.map((x) => (x.id === id ? { ...x, ...j, updatedAt: new Date().toISOString() } : x)));
  }, [jobCards, qc]);
  const deleteJobCard = useCallback((id: string) => {
    persistAndSet(qc, localKeys.jobCards, jobCards.filter((x) => x.id !== id));
  }, [jobCards, qc]);

  const addInvoice = useCallback((inv: Omit<Invoice, "id" | "invoiceNumber" | "createdAt" | "userId" | "userName">) => {
    const next: Invoice = { ...inv, id: uuid(), invoiceNumber: `INV-${String(invoices.length + 1).padStart(4, "0")}`, createdAt: new Date().toISOString(), userId: currentUser?.id || "", userName: currentUser?.name || "" };
    persistAndSet(qc, localKeys.invoices, [...invoices, next]);
  }, [currentUser, invoices, qc]);
  const addRefund = useCallback((r: Omit<Refund, "id" | "refundNumber" | "createdAt" | "userId" | "userName">) => {
    const next: Refund = { ...r, id: uuid(), refundNumber: `REF-${String(refunds.length + 1).padStart(4, "0")}`, createdAt: new Date().toISOString(), userId: currentUser?.id || "", userName: currentUser?.name || "" };
    persistAndSet(qc, localKeys.refunds, [...refunds, next]);
  }, [currentUser, qc, refunds]);
  const addStockTransfer = useCallback((t: Omit<StockTransfer, "id" | "createdAt" | "userId" | "userName">) => {
    const next: StockTransfer = { ...t, id: uuid(), createdAt: new Date().toISOString(), userId: currentUser?.id || "", userName: currentUser?.name || "" };
    persistAndSet(qc, localKeys.stockTransfers, [...stockTransfers, next]);
  }, [currentUser, qc, stockTransfers]);

  const addSupplier = useCallback((s: Omit<Supplier, "id">) => {
    persistAndSet(qc, localKeys.suppliers, [...suppliers, { ...s, id: uuid() }]);
  }, [qc, suppliers]);
  const updateSupplier = useCallback((id: string, s: Partial<Supplier>) => {
    persistAndSet(qc, localKeys.suppliers, suppliers.map((x) => (x.id === id ? { ...x, ...s } : x)));
  }, [qc, suppliers]);
  const deleteSupplier = useCallback((id: string) => {
    persistAndSet(qc, localKeys.suppliers, suppliers.filter((x) => x.id !== id));
  }, [qc, suppliers]);

  const addPurchase = useCallback((p: Omit<PurchaseEntry, "id" | "createdAt" | "userId" | "userName">) => {
    persistAndSet(qc, localKeys.purchases, [...purchases, { ...p, id: uuid(), createdAt: new Date().toISOString(), userId: currentUser?.id || "", userName: currentUser?.name || "" }]);
  }, [currentUser, purchases, qc]);

  const addAuditLog = useCallback((action: string, module: string, details: string, entityId?: string, entityType?: string) => {
    if (!currentUser) return;
    appendAudit({ action, module, details, entityId, entityType, userId: currentUser.id, userName: currentUser.name, branchId: currentBranchId });
  }, [appendAudit, currentBranchId, currentUser]);

  return useMemo(
    () => ({
      currentUser,
      authToken,
      currentBranchId,
      categories,
      logout,
      setBranch,
      applyAdminSession,
      branches,
      warehouses,
      users,
      products,
      customers,
      jobCards,
      invoices,
      suppliers,
      purchases,
      refunds,
      stockTransfers,
      auditLogs,
      loading: {
        customers: customersQuery.isFetching,
        products: productsQuery.isFetching,
        categories: categoriesQuery.isFetching,
      },
      loadAll,
      loadCustomers,
      loadCategories,
      addAuditLog,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addCategory,
      updateCategory,
      deleteCategory,
      toggleCategoryStatus,
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
      settings,
      companyName: settings?.companyName,
      logo: settings?.logo,
    }),
    [addAuditLog, addCategory, addCustomer, addInvoice, addJobCard, addProduct, addPurchase, addRefund, addStockTransfer, addSupplier, adjustStock, applyAdminSession, auditLogs, authToken, branches, categories, categoriesQuery.isFetching, currentBranchId, currentUser, customers, customersQuery.isFetching, deleteCategory, deleteCustomer, deleteJobCard, deleteProduct, deleteSupplier, invoices, jobCards, loadAll, loadCategories, loadCustomers, logout, products, productsQuery.isFetching, purchases, refunds, setBranch, settingsQuery.data, stockTransfers, suppliers, toggleCategoryStatus, updateCategory, updateCustomer, updateJobCard, updateProduct, updateSupplier, users, warehouses]
  );
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
