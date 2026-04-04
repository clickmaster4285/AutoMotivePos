import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs } from "@/api/auditLogs";

export function useAuditLogsQuery(
  params?: { module?: string; search?: string; branchId?: string; limit?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["auditLogs", params ?? {}] as const,
    queryFn: () => fetchAuditLogs(params),
    enabled: options?.enabled ?? true,
    staleTime: 15 * 1000,
  });
}

