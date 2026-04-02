// /api/centralizedProducts.ts
import { apiFetch } from "@/api/http";

export type ApiCentralizedProductRecord = {
  _id: string;
  name: string;
  sku: string;
  category?: string | { _id: string; categoryName?: string };
  mainWarehouse?: string | { _id: string; name?: string; code?: string };
  supplier_id?: string | { _id: string; company_name?: string };
  price?: number;
  cost?: number;
  totalStock?: number;
  status: "ACTIVE" | "INACTIVE";
  createdBy?: { _id: string; name: string; email: string };
  updatedAt?: string;
  createdAt?: string;
};

export type CentralizedProduct = {
  id: string;
  name: string;
  sku: string;
  categoryId?: string;
  categoryName?: string;
  mainWarehouseId?: string;
  mainWarehouseName?: string;
  mainWarehouseCode?: string;
  supplierId?: string;
  supplierName?: string;
  price?: number;
  cost?: number;
  totalStock?: number;
  status: "ACTIVE" | "INACTIVE";
  createdBy?: { id: string; name: string; email: string };
};

export function mapApiCentralizedProductToProduct(p: ApiCentralizedProductRecord): CentralizedProduct {
  const categoryName =
    typeof p.category === "object" ? p.category?.categoryName : undefined;

  const categoryId = typeof p.category === "string" ? p.category : p.category?._id;

  const mainWarehouseId =
    typeof p.mainWarehouse === "string" ? p.mainWarehouse : p.mainWarehouse?._id;
  const mainWarehouseName =
    typeof p.mainWarehouse === "object" ? p.mainWarehouse?.name : undefined;
  const mainWarehouseCode =
    typeof p.mainWarehouse === "object" ? p.mainWarehouse?.code : undefined;

  const supplierId =
    typeof p.supplier_id === "string" ? p.supplier_id : p.supplier_id?._id;
  const supplierName =
    typeof p.supplier_id === "object" ? p.supplier_id?.company_name : undefined;

  return {
    id: p._id,
    name: p.name,
    sku: p.sku,
    categoryId,
    categoryName,
    price: p.price,
    cost: p.cost,
    totalStock: p.totalStock,
    mainWarehouseId,
    mainWarehouseName,
    mainWarehouseCode,
    supplierId,
    supplierName,
    status: p.status,
    createdBy: p.createdBy ? { id: p.createdBy._id, name: p.createdBy.name, email: p.createdBy.email } : undefined,
  };
}

// -------------------- API FUNCTIONS -------------------- //

type ListResponse = { success?: boolean; data?: ApiCentralizedProductRecord[]; products?: ApiCentralizedProductRecord[] };
type OneResponse = { success?: boolean; data?: ApiCentralizedProductRecord; product?: ApiCentralizedProductRecord };

// Fetch all centralized products
export async function fetchCentralizedProducts(params?: { categoryId?: string; search?: string }): Promise<CentralizedProduct[]> {
  let url = "/api/centralizedproducts";
  if (params) {
    const query = new URLSearchParams();
    if (params.categoryId) query.append("categoryId", params.categoryId);
    if (params.search) query.append("search", params.search);
    if (query.toString()) url += `?${query.toString()}`;
  }
  const res = await apiFetch<ListResponse>(url, { method: "GET" });
  const rows = Array.isArray(res.data) ? res.data : Array.isArray(res.products) ? res.products : [];
  return rows.map(mapApiCentralizedProductToProduct);
}

// Fetch single centralized product
export async function fetchCentralizedProductById(id: string): Promise<CentralizedProduct> {
  const res = await apiFetch<OneResponse>(`/api/centralizedproducts/${id}`, { method: "GET" });
  const row = res.data ?? res.product;
  if (!row) throw new Error("Centralized product not found");
  return mapApiCentralizedProductToProduct(row);
}

// Create a centralized product
export type CreateCentralizedProductBody = {
  name: string;
  sku?: string;
  category: string;
  mainWarehouse: string;
  supplier_id?: string;
  price?: number;
  cost?: number;
  totalStock?: number;
  status?: "ACTIVE" | "INACTIVE";
};

export async function createCentralizedProduct(body: CreateCentralizedProductBody): Promise<CentralizedProduct> {
  const res = await apiFetch<OneResponse>("/api/centralizedproducts", { method: "POST", body: JSON.stringify(body) });
  const row = res.data ?? res.product;
  if (!row) throw new Error("Invalid create centralized product response");
  return mapApiCentralizedProductToProduct(row);
}

// Update centralized product
export type UpdateCentralizedProductBody = Partial<CreateCentralizedProductBody>;

export async function updateCentralizedProduct(id: string, body: UpdateCentralizedProductBody): Promise<CentralizedProduct> {
  const res = await apiFetch<OneResponse>(`/api/centralizedproducts/${id}`, { method: "PUT", body: JSON.stringify(body) });
  const row = res.data ?? res.product;
  if (!row) throw new Error("Invalid update centralized product response");
  return mapApiCentralizedProductToProduct(row);
}

// Soft delete centralized product
export async function deleteCentralizedProduct(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch<{ success: boolean; message: string }>(`/api/centralizedproducts/${id}`, { method: "DELETE" });
  return res;
}

// Adjust stock
export async function adjustCentralizedProductStock(id: string, quantity: number): Promise<CentralizedProduct> {
  const res = await apiFetch<OneResponse>(`/api/centralizedproducts/${id}/adjust`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
  const row = res.data ?? res.product;
  if (!row) throw new Error("Invalid adjust stock response");
  return mapApiCentralizedProductToProduct(row);
}

// Update price only
export async function updateCentralizedProductPrice(id: string, price: number): Promise<CentralizedProduct> {
  const res = await apiFetch<OneResponse>(`/api/centralizedproducts/${id}/price`, {
    method: "PATCH",
    body: JSON.stringify({ price }),
  });
  const row = res.data ?? res.product;
  if (!row) throw new Error("Invalid update price response");
  return mapApiCentralizedProductToProduct(row);
}