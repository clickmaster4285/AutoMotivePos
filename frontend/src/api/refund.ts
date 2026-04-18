// /api/refunds.ts (make sure this file exists with the correct name)
import { apiFetch } from "@/api/http";

// 🔹 Raw API refund record
export type ApiRefundRecord = {
  _id: string;
  refundNumber?: string;
  invoiceId: string | { _id?: string };
  invoiceNumber: string;
  branchId: string | { _id?: string; branch_name?: string; name?: string };
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
  __v?: number;
};

// 🔹 Frontend-friendly refund type
export type Refund = {
  id: string;
  refundNumber?: string;
  invoiceId: string;
  invoiceNumber: string;
  branchId: string;
  branchName?: string;
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
  processedByName?: string;
  isVoid?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

// 🔹 Helper function to get processed by display name
function processedByDisplay(r: ApiRefundRecord): string | undefined {
  const p = r.processedBy;
  if (p && typeof p === "object" && "firstName" in p) {
    const name = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
    return name || p.email || undefined;
  }
  return typeof p === "string" ? p : undefined;
}

// 🔹 Helper function to get branch name
function getBranchName(branchId: string | { _id?: string; branch_name?: string; name?: string }): string | undefined {
  if (!branchId) return undefined;
  if (typeof branchId === "object") {
    return branchId.branch_name || branchId.name;
  }
  return undefined;
}

// 🔹 Mapper function
export function mapApiRefundToRefund(r: ApiRefundRecord): Refund {
  const branchName = getBranchName(r.branchId);
  const customerName = r.customerName;
  
  // Extract branch ID
  const branchId = typeof r.branchId === "string" ? r.branchId : r.branchId?._id || "";
  
  // Extract invoice ID
  const invoiceId = typeof r.invoiceId === "string" ? r.invoiceId : r.invoiceId?._id || "";
  
  // Extract processed by ID
  const processedBy = typeof r.processedBy === "string" ? r.processedBy : (r.processedBy as { _id?: string })?._id;

  return {
    id: r._id,
    refundNumber: r.refundNumber,
    invoiceId: invoiceId,
    invoiceNumber: r.invoiceNumber,
    branchId: branchId,
    branchName: branchName,
    customerId: typeof r.customerId === "string" ? r.customerId : (r.customerId as { _id?: string })?._id,
    customerName: customerName,
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
    processedBy: processedBy,
    processedByName: processedByDisplay(r),
    isVoid: r.is_void,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    __v: r.__v,
  };
}

// 🔹 List/Array response types
type ListResponse =
  | ApiRefundRecord[]
  | { success?: boolean; count?: number; data?: ApiRefundRecord[]; refunds?: ApiRefundRecord[] };

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
  const res = await apiFetch<ApiRefundRecord>(`/api/refunds/${id}`, { method: "GET" });
  
  // The response is the refund object directly (has _id)
  if (!res || !res._id) {
    throw new Error("Refund not found");
  }
  
  return mapApiRefundToRefund(res);
}

// 🔹 Create a refund
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

// In /api/refunds.ts
export async function createRefund(body: CreateRefundBody): Promise<Refund> {
  const res = await apiFetch<any>("/api/refunds", { method: "POST", body: JSON.stringify(body) });
  
  // Handle wrapped response
  let refundData: ApiRefundRecord;
  if (res.refund) {
    // Response is wrapped in refund property
    refundData = res.refund;
  } else if (res._id) {
    // Response is the refund object directly
    refundData = res;
  } else {
    throw new Error("Invalid create refund response");
  }
  
  if (!refundData || !refundData._id) throw new Error("Invalid create refund response");
  return mapApiRefundToRefund(refundData);
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
  const res = await apiFetch<ApiRefundRecord>(`/api/refunds/${id}`, { method: "PUT", body: JSON.stringify(body) });
  if (!res || !res._id) throw new Error("Invalid update refund response");
  return mapApiRefundToRefund(res);
}

// 🔹 Soft delete a refund
export async function deleteRefund(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch<{ success: boolean; message: string }>(`/api/refunds/${id}`, { method: "DELETE" });
  return res;
}