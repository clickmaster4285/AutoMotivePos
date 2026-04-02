import { apiFetch } from "@/api/http";
import type { AuditLog } from "@/types";

export type ApiAuditLogRecord = {
  _id: string;
  action: string;
  module: string;
  details: string;
  entityId?: string;
  entityType?: string;
  userId?: string;
  userName?: string;
  branchId?: string;
  createdAt?: string;
};

export function mapApiAuditLogToAuditLog(r: ApiAuditLogRecord): AuditLog {
  return {
    id: r._id,
    action: r.action,
    module: r.module,
    entityId: r.entityId,
    entityType: r.entityType,
    details: r.details,
    userId: r.userId ?? "",
    userName: r.userName ?? "Unknown",
    branchId: r.branchId ?? "",
    timestamp: r.createdAt ?? new Date().toISOString(),
  };
}

type ListResponse =
  | { logs: ApiAuditLogRecord[] }
  | { success?: boolean; data?: ApiAuditLogRecord[]; logs?: ApiAuditLogRecord[] };

export async function fetchAuditLogs(params?: {
  module?: string;
  search?: string;
  branchId?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  const qs = new URLSearchParams();
  if (params?.module && params.module !== "all") qs.append("module", params.module);
  if (params?.search) qs.append("search", params.search);
  if (params?.branchId) qs.append("branchId", params.branchId);
  if (params?.limit) qs.append("limit", String(params.limit));
  const url = `/api/audit-logs${qs.toString() ? `?${qs.toString()}` : ""}`;

  const res = await apiFetch<ListResponse>(url, { method: "GET" });
  const rows =
    (res as any).logs ??
    (Array.isArray((res as any).data) ? (res as any).data : []) ??
    [];
  return rows.map(mapApiAuditLogToAuditLog);
}

