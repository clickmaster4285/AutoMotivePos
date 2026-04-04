// In your hooks/api/useWarehouses.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchWarehouses,
  fetchWarehouseById,
  fetchWarehouseRecords,
  fetchWarehousesByBranch, // Updated function name
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  type CreateWarehouseBody,
  type UpdateWarehouseBody,
} from "@/api/warehouse";
import { queryKeys } from "@/api/query-keys";

export function useWarehousesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.warehouses.list(),
    queryFn: fetchWarehouses,
    enabled: options?.enabled ?? true,
  });
}

export function useWarehouseQuery(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.warehouses.detail(id ?? ""),
    queryFn: () => fetchWarehouseById(id!),
    enabled: (options?.enabled ?? true) && !!id,
  });
}

// Hook to fetch warehouses by branch
export function useWarehousesByBranchQuery(branchId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.warehouses.byBranch(branchId ?? ""),
    queryFn: () => fetchWarehousesByBranch(branchId!),
    enabled: (options?.enabled ?? true) && !!branchId,
  });
}

export function useWarehouseRecordsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.warehouses.records(),
    queryFn: fetchWarehouseRecords,
    enabled: options?.enabled ?? true,
  });
}

function invalidateWarehouseLists(qc: ReturnType<typeof useQueryClient>) {
  return qc.invalidateQueries({ queryKey: queryKeys.warehouses.all });
}

export function useCreateWarehouseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateWarehouseBody) => createWarehouse(body),
    onSuccess: () => {
      void invalidateWarehouseLists(qc);
    },
  });
}

export function useUpdateWarehouseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateWarehouseBody }) => updateWarehouse(id, body),
    onSuccess: (_data, { id }) => {
      void invalidateWarehouseLists(qc);
      void qc.invalidateQueries({ queryKey: queryKeys.warehouses.detail(id) });
    },
  });
}

export function useDeleteWarehouseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWarehouse(id),
    onSuccess: () => {
      void invalidateWarehouseLists(qc);
    },
  });
}