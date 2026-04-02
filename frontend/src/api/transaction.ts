import { apiFetch } from "@/api/http";

// 🔹 Raw API transaction record
export type ApiTransactionRecord = {
  _id: string;
  transactionNumber?: string;
  branchId: string | { _id?: string };
  customerId?: string;
  customerName?: string;
  items: {
    _id?: string;
    productId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    total: number;
  }[];
  subtotal: number;
  total: number;
  amountPaid?: number;
  amountDue?: number;
  paymentMethod?: "cash" | "card" | "transfer" | "split";
  status?: "paid" | "partial" | "unpaid";
  createdBy?: string;
  is_void?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// 🔹 Frontend-friendly transaction type
export type Transaction = {
  id: string;
  transactionNumber?: string;
  branchId: string;
  customerId?: string;
  customerName?: string;
  items: {
    lineId: string;
    productId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    total: number;
  }[];
  subtotal: number;
  total: number;
  amountPaid?: number;
  amountDue?: number;
  paymentMethod?: "cash" | "card" | "transfer" | "split";
  status?: "paid" | "partial" | "unpaid";
  createdBy?: string;
  isVoid?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// 🔹 Mapper function
export function mapApiTransactionToTransaction(t: ApiTransactionRecord): Transaction {
  return {
    id: t._id,
    transactionNumber: t.transactionNumber,
    branchId: typeof t.branchId === "string" ? t.branchId : t.branchId._id || "",
    customerId: t.customerId,
    customerName: t.customerName,
    items: t.items.map((i) => ({
      lineId: String(i._id ?? ""),
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discount: i.discount,
      total: i.total,
    })),
    subtotal: t.subtotal,
    total: t.total,
    amountPaid: t.amountPaid,
    amountDue: t.amountDue,
    paymentMethod: t.paymentMethod,
    status: t.status,
    createdBy: t.createdBy,
    isVoid: t.is_void,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

// 🔹 List/Array response types
type ListResponse =
  | ApiTransactionRecord[]
  | { success?: boolean; count?: number; data?: ApiTransactionRecord[]; transactions?: ApiTransactionRecord[] };
type OneResponse = ApiTransactionRecord | { success?: boolean; data?: ApiTransactionRecord; transaction?: ApiTransactionRecord };

// 🔹 Fetch all transactions
export async function fetchTransactions(params?: { branchId?: string }): Promise<Transaction[]> {
  let url = "/api/transactions";
  if (params?.branchId) {
    url += `?branchId=${encodeURIComponent(params.branchId)}`;
  }
  const res = await apiFetch<ListResponse>(url, { method: "GET" });
  const rows = Array.isArray(res)
    ? res
    : Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.transactions)
        ? res.transactions
        : [];
  return rows.map(mapApiTransactionToTransaction);
}

// 🔹 Fetch raw API records
export async function fetchTransactionRecords(params?: { branchId?: string }): Promise<ApiTransactionRecord[]> {
  let url = "/api/transactions";
  if (params?.branchId) {
    url += `?branchId=${encodeURIComponent(params.branchId)}`;
  }
  const res = await apiFetch<ListResponse>(url, { method: "GET" });
  return Array.isArray(res)
    ? res
    : Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.transactions)
        ? res.transactions
        : [];
}

// 🔹 Fetch single transaction by ID
export async function fetchTransactionById(id: string): Promise<Transaction> {
  const res = await apiFetch<OneResponse>(`/api/transactions/${id}`, { method: "GET" });
  const row = "_id" in res ? res : res.data ?? res.transaction;
  if (!row) throw new Error("Transaction not found");
  return mapApiTransactionToTransaction(row);
}

// 🔹 Create a transaction
export type CreateTransactionBody = {
  branchId: string;
  customerId?: string;
  customerName?: string;
  items: {
    /** Omit for service / manual lines (no stock deduction). */
    productId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }[];
  paymentMethod?: "cash" | "card" | "transfer" | "split";
  amountPaid?: number;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
};

export async function createTransaction(body: CreateTransactionBody): Promise<Transaction> {
  const res = await apiFetch<OneResponse>("/api/transactions", { method: "POST", body: JSON.stringify(body) });
  const row = "_id" in res ? res : res.data ?? res.transaction;
  if (!row) throw new Error("Invalid create transaction response");
  return mapApiTransactionToTransaction(row);
}

// 🔹 Update a transaction
export type UpdateTransactionBody = {
  customerId?: string;
  customerName?: string;
  items?: {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }[];
  paymentMethod?: "cash" | "card" | "transfer" | "split";
  amountPaid?: number;
  status?: "paid" | "partial" | "unpaid";
  isVoid?: boolean;
};

export async function updateTransaction(id: string, body: UpdateTransactionBody): Promise<Transaction> {
  const res = await apiFetch<OneResponse>(`/api/transactions/${id}`, { method: "PUT", body: JSON.stringify(body) });
  const row = "_id" in res ? res : res.data ?? res.transaction;
  if (!row) throw new Error("Invalid update transaction response");
  return mapApiTransactionToTransaction(row);
}

// 🔹 Soft delete a transaction
export async function deleteTransaction(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch<{ success: boolean; message: string }>(`/api/transactions/${id}`, { method: "DELETE" });
  return res;
}