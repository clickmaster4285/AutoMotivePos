// /api/product.ts
import { apiFetch } from "@/api/http";

export type ApiProductRecord = {
  _id: string;
  name: string;
  sku: string;
  description?: string;
  categoryId?: string;
  price?: number;
  stock?: number;
  status: "ACTIVE" | "INACTIVE";
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  updatedAt?: string;
  createdAt?: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  description?: string;
  categoryId?: string;
  price?: number;
  stock?: number;
  status: "ACTIVE" | "INACTIVE";
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
};

export function mapApiProductToProduct(p: ApiProductRecord): Product {
  return {
    id: p._id,
    name: p.name,
    sku: p.sku,
    description: p.description,
    categoryId: p.categoryId,
    price: p.price,
    stock: p.stock,
    status: p.status,
    createdBy: p.createdBy ? { id: p.createdBy._id, name: p.createdBy.name, email: p.createdBy.email } : undefined,
  };
}

type ListResponse = { success?: boolean; count?: number; data?: ApiProductRecord[] };
type OneResponse = { success?: boolean; data?: ApiProductRecord };

// Fetch all products (optionally filter by category or search)
export async function fetchProducts(params?: { categoryId?: string; search?: string }): Promise<Product[]> {
  let url = "/api/products";
  if (params) {
    const query = new URLSearchParams();
    if (params.categoryId) query.append("categoryId", params.categoryId);
    if (params.search) query.append("search", params.search);
    if (query.toString()) url += `?${query.toString()}`;
  }
  const res = await apiFetch<ListResponse>(url, { method: "GET" });
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows.map(mapApiProductToProduct);
}

// Fetch raw API records
export async function fetchProductRecords(): Promise<ApiProductRecord[]> {
  const res = await apiFetch<ListResponse>("/api/products", { method: "GET" });
  return Array.isArray(res.data) ? res.data : [];
}

// Fetch single product
export async function fetchProductById(id: string): Promise<Product> {
  const res = await apiFetch<OneResponse>(`/api/products/${id}`, { method: "GET" });
  if (!res.data) throw new Error("Product not found");
  return mapApiProductToProduct(res.data);
}

// Create a product
export type CreateProductBody = {
  name: string;
  sku: string;
  description?: string;
  categoryId?: string;
  price?: number;
  stock?: number;
  status?: "ACTIVE" | "INACTIVE";
};

export async function createProduct(body: CreateProductBody): Promise<Product> {
  const res = await apiFetch<OneResponse>("/api/products", { method: "POST", body: JSON.stringify(body) });
  if (!res.data) throw new Error("Invalid create product response");
  return mapApiProductToProduct(res.data);
}

// Update product
export type UpdateProductBody = {
  name?: string;
  sku?: string;
  description?: string;
  categoryId?: string;
  price?: number;
  stock?: number;
  status?: "ACTIVE" | "INACTIVE";
};

export async function updateProduct(id: string, body: UpdateProductBody): Promise<Product> {
  const res = await apiFetch<OneResponse>(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(body) });
  if (!res.data) throw new Error("Invalid update product response");
  return mapApiProductToProduct(res.data);
}

// Soft delete product
export async function deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch<{ success: boolean; message: string }>(`/api/products/${id}`, { method: "DELETE" });
  return res;
}

// Adjust stock
export async function adjustProductStock(id: string, stock: number): Promise<Product> {
  const res = await apiFetch<OneResponse>(`/api/products/${id}/adjust`, {
    method: "PATCH",
    body: JSON.stringify({ stock }),
  });
  if (!res.data) throw new Error("Invalid adjust stock response");
  return mapApiProductToProduct(res.data);
}