// /api/jobCard.ts
import { apiFetch } from "@/api/http";
import type { JobCard, JobStatus, JobService, JobPart } from "@/types";

export type ApiJobCardRecord = {
  _id: string;
  jobNumber: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleName: string;
  branchId: string;
  technicianId?: string;
  technicianName?: string;
  status: JobStatus;
  services: JobService[];
  parts: JobPart[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function mapApiJobCardToJobCard(c: ApiJobCardRecord): JobCard {
  return {
    id: c._id,
    jobNumber: c.jobNumber,
    customerId: c.customerId,
    customerName: c.customerName,
    vehicleId: c.vehicleId,
    vehicleName: c.vehicleName,
    branchId: c.branchId,
    technicianId: c.technicianId,
    technicianName: c.technicianName,
    status: c.status,
    services: c.services || [],
    parts: c.parts || [],
    notes: c.notes || "",
    createdAt: c.createdAt || "",
    updatedAt: c.updatedAt || "",
  };
}

type ListResponse = { success?: boolean; count?: number; jobCards?: ApiJobCardRecord[]; data?: ApiJobCardRecord[] };
type OneResponse = { success?: boolean; jobCard?: ApiJobCardRecord; data?: ApiJobCardRecord };

// Fetch all Job Cards
export async function fetchJobCards(): Promise<JobCard[]> {
  const res = await apiFetch<ListResponse>("/api/job-cards", { method: "GET" });
  const rows = Array.isArray(res.jobCards)
    ? res.jobCards
    : Array.isArray(res.data)
      ? res.data
      : [];
  return rows.map(mapApiJobCardToJobCard);
}

// Fetch raw records (for forms, dropdowns)
export async function fetchJobCardRecords(): Promise<ApiJobCardRecord[]> {
  const res = await apiFetch<ListResponse>("/api/job-cards", { method: "GET" });
  return Array.isArray(res.jobCards)
    ? res.jobCards
    : Array.isArray(res.data)
      ? res.data
      : [];
}

// Fetch a single Job Card
export async function fetchJobCardById(id: string): Promise<JobCard> {
  const res = await apiFetch<OneResponse>(`/api/job-cards/${id}`, { method: "GET" });
  const row = res.jobCard ?? res.data;
  if (!row) throw new Error("Job Card not found");
  return mapApiJobCardToJobCard(row);
}

// Create a Job Card
export type CreateJobCardBody = {
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleName: string;
  branchId: string;
  technicianId?: string;
  technicianName?: string;
  status?: JobStatus;
  services: JobService[];
  parts: JobPart[];
  notes?: string;
};

export async function createJobCard(body: CreateJobCardBody): Promise<JobCard> {
  const res = await apiFetch<OneResponse>("/api/job-cards", { method: "POST", body: JSON.stringify(body) });
  const row = res.jobCard ?? res.data;
  if (!row) throw new Error("Invalid create job card response");
  return mapApiJobCardToJobCard(row);
}

// Update a Job Card
export type UpdateJobCardBody = {
  status?: JobStatus;
  notes?: string;
};

export async function updateJobCard(id: string, body: UpdateJobCardBody): Promise<JobCard> {
  const res = await apiFetch<OneResponse>(`/api/job-cards/${id}`, { method: "PUT", body: JSON.stringify(body) });
  const row = res.jobCard ?? res.data;
  if (!row) throw new Error("Invalid update job card response");
  return mapApiJobCardToJobCard(row);
}

// Soft delete a Job Card
export async function deleteJobCard(id: string): Promise<{ success?: boolean; message?: string }> {
  return apiFetch<{ success?: boolean; message?: string }>(`/api/job-cards/${id}`, { method: "DELETE" });
}

// Update only Job Card status
export async function updateJobCardStatus(id: string, status: JobStatus): Promise<JobCard> {
  const res = await apiFetch<OneResponse>(`/api/job-cards/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  const row = res.jobCard ?? res.data;
  if (!row) throw new Error("Invalid update job card status response");
  return mapApiJobCardToJobCard(row);
}