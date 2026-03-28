import { apiFetch } from "@/api/http";

export type ApiCategoryRecord = {
  _id: string;
  categoryName: string;
  categoryCode: string;
  description?: string;
  department: "Men" | "Women" | "Kids" | "Unisex" | "All";
  status: "ACTIVE" | "INACTIVE";
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type Category = {
  id: string;
  name: string;
  code: string;
  description?: string;
  department: string;
  status: "ACTIVE" | "INACTIVE";
};

export function mapApiCategoryToCategory(c: ApiCategoryRecord): Category {
  return {
    id: c._id,
    name: c.categoryName,
    code: c.categoryCode,
    description: c.description,
    department: c.department,
    status: c.status,
  };
}

type ListResponse = { success?: boolean; count?: number; data?: ApiCategoryRecord[] };
type OneResponse = { success?: boolean; data?: ApiCategoryRecord };

export async function fetchCategories(params?: {
  department?: string;
  search?: string;
}): Promise<Category[]> {
  let url = "/api/categories";
  
  if (params) {
    const queryParams = new URLSearchParams();
    if (params.department) queryParams.append("department", params.department);
    if (params.search) queryParams.append("search", params.search);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
  }
  
  const res = await apiFetch<ListResponse>(url, { method: "GET" });
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows.map(mapApiCategoryToCategory);
}

/** Raw API rows for forms that need raw data */
export async function fetchCategoryRecords(): Promise<ApiCategoryRecord[]> {
  const res = await apiFetch<ListResponse>("/api/categories", { method: "GET" });
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchCategoryById(id: string): Promise<Category> {
  const res = await apiFetch<OneResponse>(`/api/categories/${id}`, { method: "GET" });
  if (!res.data) {
    throw new Error("Category not found");
  }
  return mapApiCategoryToCategory(res.data);
}

export type CreateCategoryBody = {
  categoryName: string;
  categoryCode: string;
  description?: string;
  department: "Men" | "Women" | "Kids" | "Unisex" | "All";
};

export async function createCategory(body: CreateCategoryBody): Promise<Category> {
  const res = await apiFetch<OneResponse>("/api/categories", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.data) {
    throw new Error("Invalid create category response");
  }
  return mapApiCategoryToCategory(res.data);
}

export type UpdateCategoryBody = {
  categoryName?: string;
  categoryCode?: string;
  description?: string;
  department?: "Men" | "Women" | "Kids" | "Unisex" | "All";
  status?: "ACTIVE" | "INACTIVE";
};

export async function updateCategory(id: string, body: UpdateCategoryBody): Promise<Category> {
  const res = await apiFetch<OneResponse>(`/api/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.data) {
    throw new Error("Invalid update category response");
  }
  return mapApiCategoryToCategory(res.data);
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch<{ success: boolean; message: string }>(`/api/categories/${id}`, { 
    method: "DELETE" 
  });
  return res;
}

export async function toggleCategoryStatus(id: string): Promise<Category> {
  const res = await apiFetch<OneResponse>(`/api/categories/${id}/toggle`, { 
    method: "PATCH" 
  });
  if (!res.data) {
    throw new Error("Invalid toggle category response");
  }
  return mapApiCategoryToCategory(res.data);
}