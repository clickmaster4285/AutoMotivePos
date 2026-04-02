import { apiFetch } from "@/api/http";

// 🔹 Raw API refund record
export type ApiRefundRecord = {
  _id: string;
  refundNumber?: string;
  invoiceId: string | { _id?: string };
  invoiceNumber: string;
  branchId: string | { _id?: string; branch_name?: string };
  customerId?: string | { _id?: string; name?: string };
  customerName?: string;
  type?: "full" | "partial";
  reason?: string;
  items: {
    invoiceItemId: string;
    name: string;
    type: "product" | "service";
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  total: number;
  processedBy?: string | { _id?: string; firstName?: string; lastName?: string; email?: string };
  is_void?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// 🔹 Frontend-friendly refund type
export type Refund = {
  id: string;
  refundNumber?: string;
  invoiceId: string;
  invoiceNumber: string;
  branchId: string;
  customerId?: string;
  customerName?: string;
  type?: "full" | "partial";
  reason?: string;
  items: {
    invoiceItemId: string;
    name: string;
    type: "product" | "service";
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  total: number;
  processedBy?: string;
  isVoid?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// 🔹 Mapper function
function processedByDisplay(r: ApiRefundRecord): string | undefined {
  const p = r.processedBy;
  if (p && typeof p === "object" && "firstName" in p) {
    const name = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
    return name || p.email || undefined;
  }
  return typeof p === "string" ? p : undefined;
}

export function mapApiRefundToRefund(r: ApiRefundRecord): Refund {
  return {
    id: r._id,
    refundNumber: r.refundNumber,
    invoiceId: typeof r.invoiceId === "string" ? r.invoiceId : r.invoiceId._id || "",
    invoiceNumber: r.invoiceNumber,
    branchId: typeof r.branchId === "string" ? r.branchId : r.branchId._id || "",
    customerId:
      typeof r.customerId === "string" ? r.customerId : (r.customerId as { _id?: string })?._id,
    customerName: r.customerName,
    type: r.type,
    reason: r.reason,
    items: r.items.map(i => ({
      invoiceItemId: i.invoiceItemId,
      name: i.name,
      type: i.type,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.total,
    })),
    total: r.total,
    processedBy: typeof r.processedBy === "string" ? r.processedBy : (r.processedBy as { _id?: string })?._id,
    processedByName: processedByDisplay(r),
    isVoid: r.is_void,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

// 🔹 List/Array response types
type ListResponse =
  | ApiRefundRecord[]
  | { success?: boolean; count?: number; data?: ApiRefundRecord[]; refunds?: ApiRefundRecord[] };
type OneResponse =
  | ApiRefundRecord
  | { success?: boolean; data?: ApiRefundRecord; refund?: ApiRefundRecord; message?: string };

// 🔹 Fetch all refunds
export async function fetchRefunds(params?: { branchId?: string }): Promise<Refund[]> {
  let url = "/api/refunds";
  if (params?.branchId) url += `?branchId=${encodeURIComponent(params.branchId)}`;
  const res = await apiFetch<ListResponse>(url, { method: "GET" });
  const rows = Array.isArray(res)
    ? res
    : Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.refunds)
        ? res.refunds
        : [];
  return rows.map(mapApiRefundToRefund);
}

// 🔹 Fetch raw API records
export async function fetchRefundRecords(params?: { branchId?: string }): Promise<ApiRefundRecord[]> {
  let url = "/api/refunds";
  if (params?.branchId) url += `?branchId=${encodeURIComponent(params.branchId)}`;
  const res = await apiFetch<ListResponse>(url, { method: "GET" });
  return Array.isArray(res)
    ? res
    : Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.refunds)
        ? res.refunds
        : [];
}

// 🔹 Fetch single refund by ID
export async function fetchRefundById(id: string): Promise<Refund> {
  const res = await apiFetch<OneResponse>(`/api/refunds/${id}`, { method: "GET" });
  const row = "_id" in res ? res : res.data ?? res.refund;
  if (!row) throw new Error("Refund not found");
  return mapApiRefundToRefund(row);
}

// 🔹 Create a refund (matches POST /api/refunds)
export type CreateRefundBody = {
  invoiceId: string;
  type?: "full" | "partial";
  reason: string;
  items: {
    invoiceItemId: string;
    name: string;
    type: "product" | "service";
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
};

export async function createRefund(body: CreateRefundBody): Promise<Refund> {
  const res = await apiFetch<OneResponse>("/api/refunds", { method: "POST", body: JSON.stringify(body) });
  const row =
    res && typeof res === "object" && "_id" in res && (res as ApiRefundRecord)._id
      ? (res as ApiRefundRecord)
      : (res as { refund?: ApiRefundRecord }).refund ?? (res as { data?: ApiRefundRecord }).data;
  if (!row) throw new Error("Invalid create refund response");
  return mapApiRefundToRefund(row);
}

// 🔹 Update a refund
export type UpdateRefundBody = {
  reason?: string;
  items?: {
    invoiceItemId: string;
    name: string;
    type: "product" | "service";
    quantity: number;
    unitPrice: number;
  }[];
  total?: number;
  isVoid?: boolean;
};

export async function updateRefund(id: string, body: UpdateRefundBody): Promise<Refund> {
  const res = await apiFetch<OneResponse>(`/api/refunds/${id}`, { method: "PUT", body: JSON.stringify(body) });
  const row = "_id" in res ? res : res.data ?? res.refund;
  if (!row) throw new Error("Invalid update refund response");
  return mapApiRefundToRefund(row);
}

// 🔹 Soft delete a refund
export async function deleteRefund(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch<{ success: boolean; message: string }>(`/api/refunds/${id}`, { method: "DELETE" });
  return res;
}