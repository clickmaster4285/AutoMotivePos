import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBranches,
  fetchBranchById,
  fetchBranchRecords,
  createBranch,
  updateBranch,
  toggleBranchStatus,
  type CreateBranchBody,
} from "@/api/branches";
import { queryKeys } from "@/api/query-keys";

// -------- Core queries --------

/** List of branches mapped for UI (id, name, address, etc.). */
export function useBranches(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.branches.list(),
    queryFn: fetchBranches,
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000,
  });
}

/** Single branch by id. */
export function useBranch(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.branches.detail(id ?? ""),
    queryFn: () => fetchBranchById(id!),
    enabled: (options?.enabled ?? true) && !!id,
    staleTime: 60 * 1000,
  });
}

/** Raw branch records (`_id`, `branch_name`, etc.) for staff forms. */
export function useBranchRecords(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.branches.records(),
    queryFn: fetchBranchRecords,
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000,
  });
}

/** Convenience wrapper for UI components that just need a branch list. */
export function useBranchesForUi() {
  const query = useBranches();
  return {
    branches: query.data ?? [],
    isLoadingBranches: query.isFetching,
    branchesError: query.isError ? query.error : null,
    refetchBranches: query.refetch,
    isRemoteBranches: true,
  };
}

// -------- Mutations (same file) --------

function invalidateBranchLists(qc: ReturnType<typeof useQueryClient>) {
  return qc.invalidateQueries({ queryKey: queryKeys.branches.all });
}

export function useCreateBranchMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBranchBody) => createBranch(body),
    onSuccess: () => invalidateBranchLists(qc),
  });
}

export function useUpdateBranchMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CreateBranchBody> }) => updateBranch(id, body),
    onSuccess: (_data, { id }) => {
      invalidateBranchLists(qc);
      qc.invalidateQueries({ queryKey: queryKeys.branches.detail(id) });
    },
  });
}

export function useToggleBranchStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleBranchStatus(id),
    onSuccess: (_data, id) => {
      invalidateBranchLists(qc);
      qc.invalidateQueries({ queryKey: queryKeys.branches.detail(id) });
    },
  });
}
