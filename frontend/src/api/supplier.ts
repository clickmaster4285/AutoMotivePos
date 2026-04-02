// /api/supplier.ts
import { apiFetch } from "@/api/http";

export type ApiSupplierRecord = {
  _id: string;
  supplier_id?: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  branch_id?: string | { _id?: string };
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Supplier = {
  id: string;
  name: string;
  supplierId?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
};

export function mapApiSupplierToSupplier(s: ApiSupplierRecord): Supplier {
  return {
    id: s._id,
    supplierId: s.supplier_id,
    name: s.company_name,
    contactPerson: s.contact_person,
    email: s.email,
    phone: s.phone,
    address: s.address,
    status: s.is_active === false ? "INACTIVE" : "ACTIVE",
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

type ListResponse = ApiSupplierRecord[] | { success?: boolean; count?: number; data?: ApiSupplierRecord[]; suppliers?: ApiSupplierRecord[] };
type OneResponse = ApiSupplierRecord | { success?: boolean; data?: ApiSupplierRecord; supplier?: ApiSupplierRecord };

// Fetch all suppliers
export async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await apiFetch<ListResponse>("/api/suppliers", { method: "GET" });
  const rows = Array.isArray(res)
    ? res
    : Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.suppliers)
        ? res.suppliers
        : [];
  return rows.map(mapApiSupplierToSupplier);
}

// Fetch raw API records
export async function fetchSupplierRecords(): Promise<ApiSupplierRecord[]> {
  const res = await apiFetch<ListResponse>("/api/suppliers", { method: "GET" });
  return Array.isArray(res)
    ? res
    : Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.suppliers)
        ? res.suppliers
        : [];
}

// Fetch single supplier by ID
export async function fetchSupplierById(id: string): Promise<Supplier> {
  const res = await apiFetch<OneResponse>(`/api/suppliers/${id}`, { method: "GET" });
  const row = "company_name" in res ? res : res.data ?? res.supplier;
  if (!row) throw new Error("Supplier not found");
  return mapApiSupplierToSupplier(row);
}

// Create a supplier
export type CreateSupplierBody = {
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  branch_id?: string;
  is_active?: boolean;
};

export async function createSupplier(body: CreateSupplierBody): Promise<Supplier> {
  const res = await apiFetch<OneResponse>("/api/suppliers", { method: "POST", body: JSON.stringify(body) });
  const row = "company_name" in res ? res : res.data ?? res.supplier;
  if (!row) throw new Error("Invalid create supplier response");
  return mapApiSupplierToSupplier(row);
}

// Update a supplier
export type UpdateSupplierBody = {
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
};

export async function updateSupplier(id: string, body: UpdateSupplierBody): Promise<Supplier> {
  const res = await apiFetch<OneResponse>(`/api/suppliers/${id}`, { method: "PUT", body: JSON.stringify(body) });
  const row = "company_name" in res ? res : res.data ?? res.supplier;
  if (!row) throw new Error("Invalid update supplier response");
  return mapApiSupplierToSupplier(row);
}

// Soft delete a supplier
export async function deleteSupplier(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch<{ success: boolean; message: string }>(`/api/suppliers/${id}`, { method: "DELETE" });
  return res;
}