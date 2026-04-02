import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTransaction, fetchTransactions, type CreateTransactionBody } from "@/api/transaction";
import { queryKeys } from "@/api/query-keys";

export function useTransactionsQuery(params?: { branchId?: string }, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.transactions.list(params),
    queryFn: () => fetchTransactions(params),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateTransactionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTransactionBody) => createTransaction(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
      void qc.invalidateQueries({ queryKey: queryKeys.refunds.all });
      void qc.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
