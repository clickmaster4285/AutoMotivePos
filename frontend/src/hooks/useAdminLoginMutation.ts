import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginRequest } from "@/api/auth";
import { queryKeys } from "@/api/query-keys";
import { useAppState } from "@/providers/AppStateProvider";

function isAdminRole(role: string | undefined): boolean {
  return String(role ?? "").toLowerCase() === "admin";
}

export function useAdminLoginMutation() {
  const queryClient = useQueryClient();
  const { applyAdminSession, loadAll } = useAppState();

  return useMutation({
    mutationKey: queryKeys.auth.login(),
    mutationFn: async (vars: { email: string; password: string }) => {
      const data = await loginRequest(vars.email, vars.password);
      const admin = isAdminRole(data.user.role);
      if (!admin && !data.user.permissions?.length) {
        throw new Error("No permissions assigned to this account. Contact an administrator.");
      }
      return data;
    },
    onSuccess: (data) => {
      applyAdminSession(data.token, data.user);
      loadAll();
      queryClient.setQueryData(queryKeys.auth.session(), {
        token: data.token,
        user: data.user,
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
    },
    onError: () => {
      queryClient.removeQueries({ queryKey: queryKeys.auth.session() });
    },
  });
}
