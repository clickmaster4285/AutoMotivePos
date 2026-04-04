// /api/product.ts
import { apiFetch } from "@/api/http";

export type ApiProductRecord = {
  _id: string;
  name: string;
  sku: string;
  description?: string;
  category?: { _id: string; categoryName?: string };
  centralizedProduct?: {
    _id: string;
    name?: string;
    sku?: string;
    totalStock?: number;
    status?: "ACTIVE" | "INACTIVE";
  };
  price?: number;
  cost?: number;
  stock?: number;
  minStock?: number;
  branch_id?: { _id: string; branch_name?: string };
  warehouse_id?: { _id: string; name?: string; code?: string };
  status: "ACTIVE" | "INACTIVE";
  deleted?: boolean;
  history?: Array<{
    _id?: string;
    action: string;
    quantity: number;
    date: string;
    user: string;
    note?: string;
  }>;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

export type ProductHistory = {
  _id?: string;
  action: string;
  quantity: number;
  date: string;
  user: string;
  note?: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  centralizedProductId?: string;
  centralizedProductName?: string;
  centralizedProductSku?: string;
  centralizedTotalStock?: number;
  centralizedProductStatus?: "ACTIVE" | "INACTIVE";
  price?: number;
  cost?: number;
  stock?: number;
  minStock?: number;
  branch_id?: string;
  branch_name?: string;
  warehouse_id?: string;
  warehouse_name?: string;
  warehouse_code?: string;
  status: "ACTIVE" | "INACTIVE";
  history?: ProductHistory[];
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

export function mapApiProductToProduct(p: ApiProductRecord): Product {
  // Handle category
  const categoryId = p.category?._id;
  const categoryName = p.category?.categoryName;

  // Handle branch
  const branchId = p.branch_id?._id;
  const branchName = p.branch_id?.branch_name;

  // Handle warehouse
  const warehouseId = p.warehouse_id?._id;
  const warehouseName = p.warehouse_id?.name;
  const warehouseCode = p.warehouse_id?.code;

  // Handle centralized product
  const centralizedProductId = p.centralizedProduct?._id;
  const centralizedProductName = p.centralizedProduct?.name;
  const centralizedProductSku = p.centralizedProduct?.sku;
  const centralizedTotalStock = p.centralizedProduct?.totalStock;
  const centralizedProductStatus = p.centralizedProduct?.status;

  // Handle history
  const history = p.history?.map(h => ({
    _id: h._id,
    action: h.action,
    quantity: h.quantity,
    date: h.date,
    user: h.user,
    note: h.note,
  })) || [];

  return {
    id: p._id,
    name: p.name,
    sku: p.sku,
    description: p.description,
    categoryId,
    categoryName,
    centralizedProductId,
    centralizedProductName,
    centralizedProductSku,
    centralizedTotalStock,
    centralizedProductStatus,
    price: p.price,
    cost: p.cost,
    stock: p.stock,
    minStock: p.minStock,
    branch_id: branchId,
    branch_name: branchName,
    warehouse_id: warehouseId,
    warehouse_name: warehouseName,
    warehouse_code: warehouseCode,
    status: p.status,
    history,
    createdBy: p.createdBy ? { id: p.createdBy._id, name: p.createdBy.name, email: p.createdBy.email } : undefined,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    __v: p.__v,
  };
}

type ListResponse = { success?: boolean; count?: number; data?: ApiProductRecord[]; products?: ApiProductRecord[] };
type OneResponse = { success?: boolean; data?: ApiProductRecord; product?: ApiProductRecord };

// Fetch all products
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
  const res = await apiFetch<{ product: ApiProductRecord }>(`/api/products/${id}`, { method: "GET" });
  if (!res.product) throw new Error("Product not found");
  return mapApiProductToProduct(res.product);
}

// Create a product
export type CreateProductBody = {
  centralizedProductId?: string;
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

export async function createProduct(body: CreateProductBody): Promise<Product> {
  const res = await apiFetch<OneResponse>("/api/products", { method: "POST", body: JSON.stringify(body) });
  const row = res.data ?? res.product;
  if (!row) throw new Error("Invalid create product response");
  return mapApiProductToProduct(row);
}

// Update product
export type UpdateProductBody = Partial<CreateProductBody>;

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