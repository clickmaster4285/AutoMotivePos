import { useQuery } from "@tanstack/react-query";
import { fetchBranchRecords } from "@/api/branches";
import { queryKeys } from "@/api/query-keys";
import { useAppState } from "@/providers/AppStateProvider";

/** Branch rows as returned by the API (`_id`, `branch_name`) for staff forms. */
export function useBranches() {
  const { authToken } = useAppState();
  return useQuery({
    queryKey: queryKeys.branches.records(),
    queryFn: fetchBranchRecords,
    enabled: !!authToken,
    staleTime: 60 * 1000,
  });
}
