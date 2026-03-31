// /api/stockTransfer.ts
import { apiFetch } from "@/api/http";

export type ApiStockTransferRecord = {
  _id: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  quantity: number;
  status: "Pending" | "Completed" | "Cancelled";
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type StockTransfer = {
  id: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  quantity: number;
  status: "Pending" | "Completed" | "Cancelled";
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
};

export function mapApiStockTransferToStockTransfer(t: ApiStockTransferRecord): StockTransfer {
  return {
    id: t._id,
    fromWarehouseId: t.fromWarehouseId,
    toWarehouseId: t.toWarehouseId,
    productId: t.productId,
    quantity: t.quantity,
    status: t.status,
    createdBy: t.createdBy ? { id: t.createdBy._id, name: t.createdBy.name, email: t.createdBy.email } : undefined,
  };
}

type ListResponse = { success?: boolean; count?: number; data?: ApiStockTransferRecord[] };
type OneResponse = { success?: boolean; data?: ApiStockTransferRecord };

// Fetch all stock transfers
export async function fetchStockTransfers(): Promise<StockTransfer[]> {
  const res = await apiFetch<ListResponse>("/api/transfers", { method: "GET" });
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows.map(mapApiStockTransferToStockTransfer);
}

// Fetch raw API records
export async function fetchStockTransferRecords(): Promise<ApiStockTransferRecord[]> {
  const res = await apiFetch<ListResponse>("/api/transfers", { method: "GET" });
  return Array.isArray(res.data) ? res.data : [];
}

// Fetch single stock transfer by ID
export async function fetchStockTransferById(id: string): Promise<StockTransfer> {
  const res = await apiFetch<OneResponse>(`/api/transfers/${id}`, { method: "GET" });
  if (!res.data) throw new Error("Stock transfer not found");
  return mapApiStockTransferToStockTransfer(res.data);
}

// Create a new stock transfer
export type CreateStockTransferBody = {
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  quantity: number;
};

export async function createStockTransfer(body: CreateStockTransferBody): Promise<StockTransfer> {
  const res = await apiFetch<OneResponse>("/api/transfers", { method: "POST", body: JSON.stringify(body) });
  if (!res.data) throw new Error("Invalid create stock transfer response");
  return mapApiStockTransferToStockTransfer(res.data);
}