import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createBranch,
  updateBranch,
  toggleBranchStatus,
  type CreateBranchBody,
} from "@/api/branches";
import { queryKeys } from "@/api/query-keys";

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
    mutationFn: ({ id, body }: { id: string; body: Partial<CreateBranchBody> }) =>
      updateBranch(id, body),
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
