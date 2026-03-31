import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  fetchCategoryById,
  toggleCategoryStatus,
  updateCategory,
  type CreateCategoryBody,
  type UpdateCategoryBody,
} from "@/api/category";
import { queryKeys } from "@/api/query-keys";

export function useCategoriesQuery(
  params?: { department?: string; search?: string },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: () => fetchCategories(params),
    enabled: options?.enabled ?? true,
  });
}

export function useCategoryQuery(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id ?? ""),
    queryFn: () => fetchCategoryById(id!),
    enabled: (options?.enabled ?? true) && !!id,
  });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCategoryBody) => createCategory(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCategoryBody }) => updateCategory(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useToggleCategoryStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleCategoryStatus(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
