// /api/product.ts
import { apiFetch } from "@/api/http";

export type ApiProductRecord = {
  _id: string;
  name: string;
  sku: string;
  description?: string;
  categoryId?: string | { _id: string; categoryName?: string };
  category?: string | { _id: string; categoryName?: string };
  price?: number;
  cost?: number;
  stock?: number;
  minStock?: number;
  branch_id?: string | { _id: string; branch_name?: string };
  warehouse_id?: string | { _id: string; name?: string; code?: string };
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
  cost?: number;
  stock?: number;
  minStock?: number;
  branch_id?: string;
  warehouse_id?: string;
  status: "ACTIVE" | "INACTIVE";
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
};

export function mapApiProductToProduct(p: ApiProductRecord): Product {
  const categoryId =
    typeof p.categoryId === "string"
      ? p.categoryId
      : typeof p.category === "string"
        ? p.category
        : p.categoryId?._id ?? p.category?._id;

  const branchId = typeof p.branch_id === "string" ? p.branch_id : p.branch_id?._id;
  const warehouseId = typeof p.warehouse_id === "string" ? p.warehouse_id : p.warehouse_id?._id;

  return {
    id: p._id,
    name: p.name,
    sku: p.sku,
    description: p.description,
    categoryId,
    price: p.price,
    cost: p.cost,
    stock: p.stock,
    minStock: p.minStock,
    branch_id: branchId,
    warehouse_id: warehouseId,
    status: p.status,
    createdBy: p.createdBy ? { id: p.createdBy._id, name: p.createdBy.name, email: p.createdBy.email } : undefined,
  };
}

type ListResponse = { success?: boolean; count?: number; data?: ApiProductRecord[]; products?: ApiProductRecord[] };
type OneResponse = { success?: boolean; data?: ApiProductRecord; product?: ApiProductRecord };

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
  const rows = Array.isArray(res.data) ? res.data : Array.isArray(res.products) ? res.products : [];
  return rows.map(mapApiProductToProduct);
}

// Fetch raw API records
export async function fetchProductRecords(): Promise<ApiProductRecord[]> {
  const res = await apiFetch<ListResponse>("/api/products", { method: "GET" });
  return Array.isArray(res.data) ? res.data : Array.isArray(res.products) ? res.products : [];
}

// Fetch single product
export async function fetchProductById(id: string): Promise<Product> {
  const res = await apiFetch<OneResponse>(`/api/products/${id}`, { method: "GET" });
  const row = res.data ?? res.product;
  if (!row) throw new Error("Product not found");
  return mapApiProductToProduct(row);
}

// Create a product
export type CreateProductBody = {
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  stock?: number;
  minStock?: number;
  branch_id?: string;
  warehouse_id?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export async function createProduct(body: CreateProductBody): Promise<Product> {
  const res = await apiFetch<OneResponse>("/api/products", { method: "POST", body: JSON.stringify(body) });
  const row = res.data ?? res.product;
  if (!row) throw new Error("Invalid create product response");
  return mapApiProductToProduct(row);
}

// Update product
export type UpdateProductBody = {
  name?: string;
  sku?: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  stock?: number;
  minStock?: number;
  branch_id?: string;
  warehouse_id?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export async function updateProduct(id: string, body: UpdateProductBody): Promise<Product> {
  const res = await apiFetch<OneResponse>(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(body) });
  const row = res.data ?? res.product;
  if (!row) throw new Error("Invalid update product response");
  return mapApiProductToProduct(row);
}

// Soft delete product
export async function deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch<{ success: boolean; message: string }>(`/api/products/${id}`, { method: "DELETE" });
  return res;
}

// Adjust stock
export async function adjustProductStock(id: string, quantity: number): Promise<Product> {
  const res = await apiFetch<OneResponse>(`/api/products/${id}/adjust`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
  const row = res.data ?? res.product;
  if (!row) throw new Error("Invalid adjust stock response");
  return mapApiProductToProduct(row);
}

