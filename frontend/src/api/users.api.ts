import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/http";
import { queryKeys } from "@/api/query-keys";

export type ApiUserRecord = {
  _id: string;
  userId?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: string;
  permissions?: string[];
  isActive?: boolean;
  hasSystemAccess?: boolean;
  isTwoFactorEnabled?: boolean;
  branch_id?: string | { _id: string; branch_name?: string };
  employment?: {
    hireDate?: string;
    designation?: string;
    department?: string;
    status?: string;
  };
  shift?: { startTime?: string; endTime?: string; workDays?: string[] };
  salary?: Record<string, unknown>;
  address?: Record<string, string>;
  emergencyContact?: Record<string, string>;
  createdAt?: string;
  lastLogin?: string;
};

export type UsersListResponse = {
  success?: boolean;
  users: ApiUserRecord[];
  total?: number;
  totalPages?: number;
  currentPage?: number;
  count?: number;
};

export type PermissionModuleRaw = { moduleName: string; permissions: string[] };

export type PermissionModuleUi = {
  moduleName: string;
  permissions: { key: string; label: string }[];
};

function humanizePermissionId(id: string): string {
  return id
    .split(":")
    .map((part) =>
      part
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    )
    .join(" · ");
}

export function normalizePermissionsCatalog(raw: PermissionModuleRaw[]): PermissionModuleUi[] {
  return (raw ?? []).map((m) => ({
    moduleName: m.moduleName,
    permissions: (m.permissions ?? []).map((id) => ({
      key: id,
      label: humanizePermissionId(id),
    })),
  }));
}

export async function fetchUsersList(params: { page?: number; limit?: number } = {}): Promise<UsersListResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 200;
  return apiFetch<UsersListResponse>(`/api/users?page=${page}&limit=${limit}`, { method: "GET" });
}

export async function fetchUserById(id: string): Promise<ApiUserRecord> {
  return apiFetch<ApiUserRecord>(`/api/users/${id}`, { method: "GET" });
}

export async function fetchUsersPermissionsCatalog(): Promise<PermissionModuleUi[]> {
  const raw = await apiFetch<PermissionModuleRaw[]>("/api/users/permissions", { method: "GET" });
  return normalizePermissionsCatalog(Array.isArray(raw) ? raw : []);
}

export async function createUser(body: Record<string, unknown>): Promise<ApiUserRecord> {
  return apiFetch<ApiUserRecord>("/api/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateUser(id: string, body: Record<string, unknown>): Promise<ApiUserRecord> {
  return apiFetch<ApiUserRecord>(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await apiFetch(`/api/users/${id}`, { method: "DELETE" });
}

export function useStaffList(options?: { enabled?: boolean }) {
  const page = 1;
  const limit = 200;
  return useQuery({
    queryKey: queryKeys.users.list({ page, limit }),
    queryFn: () => fetchUsersList({ page, limit }),
    enabled: options?.enabled ?? true,
    select: (data) => data.users ?? [],
    staleTime: 30 * 1000,
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useUserQuery(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.users.detail(id ?? ""),
    queryFn: () => fetchUserById(id!),
    enabled: (options?.enabled ?? true) && !!id,
    staleTime: 30 * 1000,
  });
}

export function usePermissionsCatalogQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.users.permissions(),
    queryFn: fetchUsersPermissionsCatalog,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createUser(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useUpdateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => updateUser(id, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(vars.id) });
    },
  });
}
