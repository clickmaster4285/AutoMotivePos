import { useQuery } from "@tanstack/react-query";
import { fetchBranchById, fetchBranches } from "@/api/branches";
import { queryKeys } from "@/api/query-keys";
import { useAppState } from "@/providers/AppStateProvider";

/**
 * GET /api/branches — requires Bearer token and branch READ permission.
 */
export function useBranchesQuery(options?: { enabled?: boolean }) {
  const { authToken } = useAppState();
  return useQuery({
    queryKey: queryKeys.branches.list(),
    queryFn: fetchBranches,
    enabled: (options?.enabled ?? true) && !!authToken,
    staleTime: 60 * 1000,
  });
}

export function useBranchQuery(
  id: string | undefined,
  options?: { enabled?: boolean }
) {
  const { authToken } = useAppState();
  return useQuery({
    queryKey: queryKeys.branches.detail(id ?? ""),
    queryFn: () => fetchBranchById(id!),
    enabled: (options?.enabled ?? true) && !!authToken && !!id,
    staleTime: 60 * 1000,
  });
}

/**
 * Prefer API branches after a successful fetch; fall back to seeded localStorage branches
 * while loading, if unauthenticated, or on error.
 */
export function useBranchesForUi() {
  const branchQuery = useBranchesQuery();
  const { branches: localBranches } = useAppState();

  const branches =
    branchQuery.isSuccess && Array.isArray(branchQuery.data) ? branchQuery.data : localBranches;

  return {
    branches,
    isLoadingBranches: branchQuery.isFetching,
    branchesError: branchQuery.isError ? branchQuery.error : null,
    refetchBranches: branchQuery.refetch,
    isRemoteBranches: branchQuery.isSuccess,
  };
}
