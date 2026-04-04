// /api/stockTransfer.ts
import { apiFetch } from "@/api/http";

export type ApiStockTransferRecord = {
  _id: string;
  from_branch_id: string;
  from_branch_name: string;
  from_warehouse_id: string;
  from_warehouse_name: string;
  to_branch_id: string;
  to_branch_name: string;
  to_warehouse_id: string;
  to_warehouse_name: string;
  product_id: string;
  product_name: string;
  quantity: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  user_id?: string;
  user_name?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type StockTransfer = {
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
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  userId?: string;
  userName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function mapApiStockTransferToStockTransfer(t: ApiStockTransferRecord): StockTransfer {
  return {
    id: t._id,
    fromBranchId: t.from_branch_id,
    fromBranchName: t.from_branch_name,
    fromWarehouseId: t.from_warehouse_id,
    fromWarehouseName: t.from_warehouse_name,
    toBranchId: t.to_branch_id,
    toBranchName: t.to_branch_name,
    toWarehouseId: t.to_warehouse_id,
    toWarehouseName: t.to_warehouse_name,
    productId: t.product_id,
    productName: t.product_name,
    quantity: t.quantity,
    status: t.status,
    userId: t.user_id,
    userName: t.user_name,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

type ListResponse = { success?: boolean; count?: number; data?: ApiStockTransferRecord[]; transfers?: ApiStockTransferRecord[] };
type OneResponse = { success?: boolean; data?: ApiStockTransferRecord; transfer?: ApiStockTransferRecord };

// Fetch all stock transfers
export async function fetchStockTransfers(): Promise<StockTransfer[]> {
  const res = await apiFetch<ListResponse>("/api/transfers", { method: "GET" });
  const rows = Array.isArray(res.data) ? res.data : Array.isArray(res.transfers) ? res.transfers : [];
  return rows.map(mapApiStockTransferToStockTransfer);
}

/** Transfers where stock was received at this branch (`to_branch_id`). */
export async function fetchStockTransfersByToBranch(toBranchId: string): Promise<StockTransfer[]> {
  const res = await apiFetch<ListResponse>(`/api/transfers/to-branch/${encodeURIComponent(toBranchId)}`, {
    method: "GET",
  });
  const rows = Array.isArray(res.data) ? res.data : Array.isArray(res.transfers) ? res.transfers : [];
  return rows.map(mapApiStockTransferToStockTransfer);
}

// Fetch raw API records
export async function fetchStockTransferRecords(): Promise<ApiStockTransferRecord[]> {
  const res = await apiFetch<ListResponse>("/api/transfers", { method: "GET" });
  return Array.isArray(res.data) ? res.data : Array.isArray(res.transfers) ? res.transfers : [];
}

// Fetch single stock transfer by ID
export async function fetchStockTransferById(id: string): Promise<StockTransfer> {
  const res = await apiFetch<OneResponse>(`/api/transfers/${id}`, { method: "GET" });
  const row = res.data ?? res.transfer;
  if (!row) throw new Error("Stock transfer not found");
  return mapApiStockTransferToStockTransfer(row);
}

// Create a new stock transfer
export type CreateStockTransferBody = {
  product_id: string;
  from_branch_id: string;
  from_warehouse_id?: string;
  to_branch_id: string;
  to_warehouse_id: string;
  quantity: number;
};

export async function createStockTransfer(body: CreateStockTransferBody): Promise<StockTransfer> {
  const res = await apiFetch<OneResponse>("/api/transfers", { method: "POST", body: JSON.stringify(body) });
  const row = res.data ?? res.transfer;
  if (!row) throw new Error("Invalid create stock transfer response");
  return mapApiStockTransferToStockTransfer(row);
}

export type UpdateStockTransferBody = {
  status?: "PENDING" | "COMPLETED" | "CANCELLED";
};

export async function updateStockTransfer(
  id: string,
  body: UpdateStockTransferBody
): Promise<StockTransfer> {
  const res = await apiFetch<OneResponse>(`/api/transfers/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  const row = res.data ?? res.transfer;

  if (!row) throw new Error("Invalid update stock transfer response");

  return mapApiStockTransferToStockTransfer(row);
}