// /api/warehouse.ts
import { apiFetch } from "@/api/http";

export type ApiWarehouseRecord = {
  _id: string;
  name: string;
  code: string;
  location?: string;
  status: "ACTIVE" | "INACTIVE";
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type Warehouse = {
  id: string;
  name: string;
  code: string;
  location?: string;
  status: "ACTIVE" | "INACTIVE";
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
};

export function mapApiWarehouseToWarehouse(w: ApiWarehouseRecord): Warehouse {
  return {
    id: w._id,
    name: w.name,
    code: w.code,
    location: w.location,
    status: w.status,
    createdBy: w.createdBy ? { id: w.createdBy._id, name: w.createdBy.name, email: w.createdBy.email } : undefined,
  };
}

type ListResponse = { success?: boolean; count?: number; data?: ApiWarehouseRecord[] };
type OneResponse = { success?: boolean; data?: ApiWarehouseRecord };

// Fetch all warehouses
export async function fetchWarehouses(): Promise<Warehouse[]> {
  const res = await apiFetch<ListResponse>("/api/warehouses", { method: "GET" });
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows.map(mapApiWarehouseToWarehouse);
}

// Fetch raw API records
export async function fetchWarehouseRecords(): Promise<ApiWarehouseRecord[]> {
  const res = await apiFetch<ListResponse>("/api/warehouses", { method: "GET" });
  return Array.isArray(res.data) ? res.data : [];
}

// Fetch single warehouse by ID
export async function fetchWarehouseById(id: string): Promise<Warehouse> {
  const res = await apiFetch<OneResponse>(`/api/warehouses/${id}`, { method: "GET" });
  if (!res.data) throw new Error("Warehouse not found");
  return mapApiWarehouseToWarehouse(res.data);
}

// Create a warehouse
export type CreateWarehouseBody = {
  name: string;
  code: string;
  location?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export async function createWarehouse(body: CreateWarehouseBody): Promise<Warehouse> {
  const res = await apiFetch<OneResponse>("/api/warehouses", { method: "POST", body: JSON.stringify(body) });
  if (!res.data) throw new Error("Invalid create warehouse response");
  return mapApiWarehouseToWarehouse(res.data);
}

// Update a warehouse
export type UpdateWarehouseBody = {
  name?: string;
  code?: string;
  location?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export async function updateWarehouse(id: string, body: UpdateWarehouseBody): Promise<Warehouse> {
  const res = await apiFetch<OneResponse>(`/api/warehouses/${id}`, { method: "PUT", body: JSON.stringify(body) });
  if (!res.data) throw new Error("Invalid update warehouse response");
  return mapApiWarehouseToWarehouse(res.data);
}

// Soft delete a warehouse
export async function deleteWarehouse(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch<{ success: boolean; message: string }>(`/api/warehouses/${id}`, { method: "DELETE" });
  return res;
}