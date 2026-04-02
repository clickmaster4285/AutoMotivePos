import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchStockTransfers,
  fetchStockTransfersByToBranch,
  fetchStockTransferById,
  fetchStockTransferRecords,
  createStockTransfer,
  updateStockTransfer,
  type CreateStockTransferBody,
} from "@/api/stockTransfer";
import { queryKeys } from "@/api/query-keys";


// ✅ GET ALL
export function useStockTransfersQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.stockTransfers.list(),
    queryFn: fetchStockTransfers,
    enabled: options?.enabled ?? true,
  });
}

/** Incoming transfers for a branch (destination). */
export function useStockTransfersByToBranchQuery(
  toBranchId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.stockTransfers.byToBranch(toBranchId ?? ""),
    queryFn: () => fetchStockTransfersByToBranch(toBranchId!),
    enabled: (options?.enabled ?? true) && !!toBranchId,
  });
}


// ✅ GET ONE
export function useStockTransferQuery(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.stockTransfers.detail(id ?? ""),
    queryFn: () => fetchStockTransferById(id!),
    enabled: (options?.enabled ?? true) && !!id,
  });
}


// ✅ RAW RECORDS (optional)
export function useStockTransferRecordsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.stockTransfers.records(),
    queryFn: fetchStockTransferRecords,
    enabled: options?.enabled ?? true,
  });
}


// 🔁 Invalidate helper
function invalidateStockTransferLists(qc: ReturnType<typeof useQueryClient>) {
  return qc.invalidateQueries({ queryKey: queryKeys.stockTransfers.all });
}


// ✅ CREATE
export function useCreateStockTransferMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateStockTransferBody) => createStockTransfer(body),
    onSuccess: () => {
      void invalidateStockTransferLists(qc);
    },
  });
}

// ✅ UPDATE
export function useUpdateStockTransferMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { status?: "PENDING" | "COMPLETED" | "CANCELLED" } }) =>
      updateStockTransfer(id, body),
    onSuccess: (_data, { id }) => {
      void invalidateStockTransferLists(qc);
      void qc.invalidateQueries({ queryKey: queryKeys.stockTransfers.detail(id) });
    },
  });
}