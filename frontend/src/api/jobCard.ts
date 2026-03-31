// /api/jobCard.ts
import { apiFetch } from "@/api/http";

export type ApiJobCardRecord = {
  _id: string;
  title: string;
  description?: string;
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  branchId?: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type JobCard = {
  id: string;
  title: string;
  description?: string;
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  branchId?: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
};

export function mapApiJobCardToJobCard(c: ApiJobCardRecord): JobCard {
  return {
    id: c._id,
    title: c.title,
    description: c.description,
    status: c.status,
    branchId: c.branchId,
    createdBy: c.createdBy ? { id: c.createdBy._id, name: c.createdBy.name, email: c.createdBy.email } : undefined,
    assignedTo: c.assignedTo ? { id: c.assignedTo._id, name: c.assignedTo.name, email: c.assignedTo.email } : undefined,
  };
}

type ListResponse = { success?: boolean; count?: number; data?: ApiJobCardRecord[] };
type OneResponse = { success?: boolean; data?: ApiJobCardRecord };

// Fetch all Job Cards (optionally by branch)
export async function fetchJobCards(params?: { branchId?: string }): Promise<JobCard[]> {
  let url = "/api/job-cards";
  if (params?.branchId) {
    const query = new URLSearchParams({ branchId: params.branchId }).toString();
    url += `?${query}`;
  }
  const res = await apiFetch<ListResponse>(url, { method: "GET" });
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows.map(mapApiJobCardToJobCard);
}

// Fetch raw records (for forms, dropdowns)
export async function fetchJobCardRecords(): Promise<ApiJobCardRecord[]> {
  const res = await apiFetch<ListResponse>("/api/job-cards", { method: "GET" });
  return Array.isArray(res.data) ? res.data : [];
}

// Fetch a single Job Card
export async function fetchJobCardById(id: string): Promise<JobCard> {
  const res = await apiFetch<OneResponse>(`/api/job-cards/${id}`, { method: "GET" });
  if (!res.data) throw new Error("Job Card not found");
  return mapApiJobCardToJobCard(res.data);
}

// Create a Job Card
export type CreateJobCardBody = {
  title: string;
  description?: string;
  branchId?: string;
  assignedTo?: string; // user ID
};

export async function createJobCard(body: CreateJobCardBody): Promise<JobCard> {
  const res = await apiFetch<OneResponse>("/api/job-cards", { method: "POST", body: JSON.stringify(body) });
  if (!res.data) throw new Error("Invalid create job card response");
  return mapApiJobCardToJobCard(res.data);
}

// Update a Job Card
export type UpdateJobCardBody = {
  title?: string;
  description?: string;
  status?: "Pending" | "In Progress" | "Completed" | "Cancelled";
  branchId?: string;
  assignedTo?: string;
};

export async function updateJobCard(id: string, body: UpdateJobCardBody): Promise<JobCard> {
  const res = await apiFetch<OneResponse>(`/api/job-cards/${id}`, { method: "PUT", body: JSON.stringify(body) });
  if (!res.data) throw new Error("Invalid update job card response");
  return mapApiJobCardToJobCard(res.data);
}

// Soft delete a Job Card
export async function deleteJobCard(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch<{ success: boolean; message: string }>(`/api/job-cards/${id}`, { method: "DELETE" });
  return res;
}

// Update only Job Card status
export async function updateJobCardStatus(id: string, status: "Pending" | "In Progress" | "Completed" | "Cancelled"): Promise<JobCard> {
  const res = await apiFetch<OneResponse>(`/api/job-cards/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  if (!res.data) throw new Error("Invalid update job card status response");
  return mapApiJobCardToJobCard(res.data);
}