import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSuppliers,
  fetchSupplierById,
  fetchSupplierRecords,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  type CreateSupplierBody,
  type UpdateSupplierBody,
} from "@/api/supplier";
import { queryKeys } from "@/api/query-keys";

export function useSuppliersQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.suppliers.list(),
    queryFn: fetchSuppliers,
    enabled: options?.enabled ?? true,
  });
}

export function useSupplierQuery(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.suppliers.detail(id ?? ""),
    queryFn: () => fetchSupplierById(id!),
    enabled: (options?.enabled ?? true) && !!id,
  });
}

export function useSupplierRecordsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.suppliers.records(),
    queryFn: fetchSupplierRecords,
    enabled: options?.enabled ?? true,
  });
}

function invalidateSupplierLists(qc: ReturnType<typeof useQueryClient>) {
  return qc.invalidateQueries({ queryKey: queryKeys.suppliers.all });
}

export function useCreateSupplierMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSupplierBody) => createSupplier(body),
    onSuccess: () => {
      void invalidateSupplierLists(qc);
    },
  });
}

export function useUpdateSupplierMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateSupplierBody }) => updateSupplier(id, body),
    onSuccess: (_data, { id }) => {
      void invalidateSupplierLists(qc);
      void qc.invalidateQueries({ queryKey: queryKeys.suppliers.detail(id) });
    },
  });
}

export function useDeleteSupplierMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => {
      void invalidateSupplierLists(qc);
    },
  });
}
