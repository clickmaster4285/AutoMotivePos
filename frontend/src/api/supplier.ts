// /api/supplier.ts
import { apiFetch } from "@/api/http";

export type ApiSupplierRecord = {
  _id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: "ACTIVE" | "INACTIVE";
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type Supplier = {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: "ACTIVE" | "INACTIVE";
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
};

export function mapApiSupplierToSupplier(s: ApiSupplierRecord): Supplier {
  return {
    id: s._id,
    name: s.name,
    contactPerson: s.contactPerson,
    email: s.email,
    phone: s.phone,
    address: s.address,
    status: s.status,
    createdBy: s.createdBy ? { id: s.createdBy._id, name: s.createdBy.name, email: s.createdBy.email } : undefined,
  };
}

type ListResponse = { success?: boolean; count?: number; data?: ApiSupplierRecord[] };
type OneResponse = { success?: boolean; data?: ApiSupplierRecord };

// Fetch all suppliers
export async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await apiFetch<ListResponse>("/api/suppliers", { method: "GET" });
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows.map(mapApiSupplierToSupplier);
}

// Fetch raw API records
export async function fetchSupplierRecords(): Promise<ApiSupplierRecord[]> {
  const res = await apiFetch<ListResponse>("/api/suppliers", { method: "GET" });
  return Array.isArray(res.data) ? res.data : [];
}

// Fetch single supplier by ID
export async function fetchSupplierById(id: string): Promise<Supplier> {
  const res = await apiFetch<OneResponse>(`/api/suppliers/${id}`, { method: "GET" });
  if (!res.data) throw new Error("Supplier not found");
  return mapApiSupplierToSupplier(res.data);
}

// Create a supplier
export type CreateSupplierBody = {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export async function createSupplier(body: CreateSupplierBody): Promise<Supplier> {
  const res = await apiFetch<OneResponse>("/api/suppliers", { method: "POST", body: JSON.stringify(body) });
  if (!res.data) throw new Error("Invalid create supplier response");
  return mapApiSupplierToSupplier(res.data);
}

// Update a supplier
export type UpdateSupplierBody = {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export async function updateSupplier(id: string, body: UpdateSupplierBody): Promise<Supplier> {
  const res = await apiFetch<OneResponse>(`/api/suppliers/${id}`, { method: "PUT", body: JSON.stringify(body) });
  if (!res.data) throw new Error("Invalid update supplier response");
  return mapApiSupplierToSupplier(res.data);
}

// Soft delete a supplier
export async function deleteSupplier(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch<{ success: boolean; message: string }>(`/api/suppliers/${id}`, { method: "DELETE" });
  return res;
}