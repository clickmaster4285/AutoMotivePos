import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCustomer,
  fetchCustomerById,
  fetchCustomers,
  softDeleteCustomer,
  updateCustomer,
  type CreateCustomerBody,
} from "@/api/customers";
import { queryKeys } from "@/api/query-keys";

export function useCustomersQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.customers.list(),
    queryFn: fetchCustomers,
    enabled: options?.enabled ?? true,
  });
}

export function useCustomerQuery(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id ?? ""),
    queryFn: () => fetchCustomerById(id!),
    enabled: (options?.enabled ?? true) && !!id,
  });
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCustomerBody) => createCustomer(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}

export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CreateCustomerBody> }) =>
      updateCustomer(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}

export function useDeleteCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteCustomer(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}
