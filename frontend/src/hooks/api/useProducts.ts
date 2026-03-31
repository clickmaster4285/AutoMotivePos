import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProducts,
  fetchProductById,
  fetchProductRecords,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustProductStock,
  type CreateProductBody,
  type UpdateProductBody,
} from "@/api/product";
import { queryKeys } from "@/api/query-keys";

export function useProductsQuery(
  params?: { categoryId?: string; search?: string },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => fetchProducts(params),
    enabled: options?.enabled ?? true,
  });
}

export function useProductQuery(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.products.detail(id ?? ""),
    queryFn: () => fetchProductById(id!),
    enabled: (options?.enabled ?? true) && !!id,
  });
}

export function useProductRecordsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.products.records(),
    queryFn: fetchProductRecords,
    enabled: options?.enabled ?? true,
  });
}

function invalidateProductLists(qc: ReturnType<typeof useQueryClient>) {
  return qc.invalidateQueries({ queryKey: queryKeys.products.all });
}

export function useCreateProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProductBody) => createProduct(body),
    onSuccess: () => {
      void invalidateProductLists(qc);
    },
  });
}

export function useUpdateProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateProductBody }) => updateProduct(id, body),
    onSuccess: (_data, { id }) => {
      void invalidateProductLists(qc);
      void qc.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
    },
  });
}

export function useDeleteProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      void invalidateProductLists(qc);
    },
  });
}

export function useAdjustProductStockMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) => adjustProductStock(id, stock),
    onSuccess: (_data, { id }) => {
      void invalidateProductLists(qc);
      void qc.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
    },
  });
}

