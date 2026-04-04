import { apiFetch } from "@/api/http";
import type { Branch } from "@/types";

export type ApiBranchRecord = {
  _id: string;
  branch_name: string;
  tax_region?: string;
  opening_time?: string;
  closing_time?: string;
  status?: string;
  address?: { country?: string; state?: string; city?: string };
  branch_manager?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function mapApiBranchToBranch(b: ApiBranchRecord): Branch {
  const a = b.address;
  const addressStr = [a?.city, a?.state, a?.country].filter(Boolean).join(", ") || "";
  return {
    id: b._id,
    name: b.branch_name,
    address: addressStr,
    phone: "",
    tax_region: b.tax_region,
    opening_time: b.opening_time,
    closing_time: b.closing_time,
    status: b.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    branch_manager: b.branch_manager,
    address_details: {
      country: a?.country || "",
      state: a?.state || "",
      city: a?.city || "",
    },
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

type ListResponse = { success?: boolean; data?: ApiBranchRecord[] };
type OneResponse = { success?: boolean; data?: ApiBranchRecord };

export async function fetchBranches(): Promise<Branch[]> {
  const res = await apiFetch<ListResponse>("/api/branches", { method: "GET" });
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows.map(mapApiBranchToBranch);
}

/** Raw API rows for forms that need `_id` / `branch_name` (e.g. user employment). */
export async function fetchBranchRecords(): Promise<ApiBranchRecord[]> {
  const res = await apiFetch<ListResponse>("/api/branches", { method: "GET" });
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchBranchById(id: string): Promise<Branch> {
  const res = await apiFetch<OneResponse>(`/api/branches/${id}`, { method: "GET" });
  if (!res.data) {
    throw new Error("Branch not found");
  }
  return mapApiBranchToBranch(res.data);
}

export type CreateBranchBody = {
  branch_name: string;
  tax_region?: string;
  opening_time?: string;
  closing_time?: string;
  status?: string;
  branch_manager?: string;
  address?: { country?: string; state?: string; city?: string };
};

export async function createBranch(body: CreateBranchBody): Promise<Branch> {
  const res = await apiFetch<OneResponse>("/api/branches", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.data) {
    throw new Error("Invalid create branch response");
  }
  return mapApiBranchToBranch(res.data);
}

export async function updateBranch(id: string, body: Partial<CreateBranchBody>): Promise<Branch> {
  const res = await apiFetch<OneResponse>(`/api/branches/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.data) {
    throw new Error("Invalid update branch response");
  }
  return mapApiBranchToBranch(res.data);
}

export async function toggleBranchStatus(id: string): Promise<Branch> {
  const res = await apiFetch<OneResponse>(`/api/branches/${id}`, { method: "DELETE" });
  if (!res.data) {
    throw new Error("Invalid toggle branch response");
  }
  return mapApiBranchToBranch(res.data);
}
