// hooks/api/useSettings.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSettings,
  updateSettings,
  updateProfile,
  type UpdateSettingsBody,
  type UpdateProfileBody,
} from "@/api/settings";
import { queryKeys } from "@/api/query-keys";

export function useSettingsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.settings.all(),
    queryFn: fetchSettings,
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ body, logoFile }: { body: UpdateSettingsBody; logoFile?: File }) => 
      updateSettings(body, logoFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all() });
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileBody) => updateProfile(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.profile() });
    },
  });
}