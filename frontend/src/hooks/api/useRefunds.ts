import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRefund, fetchRefunds, type CreateRefundBody } from "@/api/refund";
import { queryKeys } from "@/api/query-keys";

export function useRefundsQuery(params?: { branchId?: string }, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.refunds.list(params),
    queryFn: () => fetchRefunds(params),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateRefundMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRefundBody) => createRefund(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.refunds.all });
      void qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
      void qc.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
