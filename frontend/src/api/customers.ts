import { apiFetch } from "@/api/http";
import type { Customer, Vehicle } from "@/types";

// --------------------
// API Record & Mapping
// --------------------
export type ApiCustomerRecord = {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  vehicles?: Vehicle[];
  creditBalance?: number;
  createdAt?: string;
  updatedAt?: string;
  status?: string; // ACTIVE / INACTIVE for soft delete
};

export function mapApiCustomerToCustomer(c: ApiCustomerRecord): Customer {
  return {
    id: c._id,
    name: c.name,
    phone: c.phone,
    email: c.email || "",
    address: c.address || "",
    vehicles: c.vehicles || [],
    creditBalance: c.creditBalance || 0,
    status: c.status || "ACTIVE",
  };
}

// --------------------
// API Responses
// --------------------
type ListResponse = { success?: boolean; data?: ApiCustomerRecord[] };
type OneResponse = { success?: boolean; data?: ApiCustomerRecord };

// --------------------
// API Functions
// --------------------

// Fetch all active customers
export async function fetchCustomers(): Promise<Customer[]> {
  const res = await apiFetch<ListResponse>("/api/customers", { method: "GET" });
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows.map(mapApiCustomerToCustomer);
}

// Fetch single customer by ID
export async function fetchCustomerById(id: string): Promise<Customer> {
  const res = await apiFetch<OneResponse>(`/api/customers/${id}`, { method: "GET" });
  if (!res.data) throw new Error("Customer not found");
  return mapApiCustomerToCustomer(res.data);
}

// Create a new customer
export type CreateCustomerBody = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  vehicles?: Vehicle[];
};

export async function createCustomer(body: CreateCustomerBody): Promise<Customer> {
  const res = await apiFetch<OneResponse>("/api/customers", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.data) throw new Error("Invalid create customer response");
  return mapApiCustomerToCustomer(res.data);
}

// Update an existing customer
export async function updateCustomer(id: string, body: Partial<CreateCustomerBody>): Promise<Customer> {
  const res = await apiFetch<OneResponse>(`/api/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.data) throw new Error("Invalid update customer response");
  return mapApiCustomerToCustomer(res.data);
}

// Soft delete customer (toggle status)
export async function softDeleteCustomer(id: string): Promise<Customer> {
  const res = await apiFetch<OneResponse>(`/api/customers/${id}`, { method: "DELETE" });
  if (!res.data) throw new Error("Invalid soft delete customer response");
  return mapApiCustomerToCustomer(res.data);
}