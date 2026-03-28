export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    login: () => [...queryKeys.auth.all, "login"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
  },
  branches: {
    all: ["branches"] as const,
    list: () => [...queryKeys.branches.all, "list"] as const,
    detail: (id: string) => [...queryKeys.branches.all, "detail", id] as const,
    records: () => [...queryKeys.branches.all, "records"] as const,
  },
  users: {
    all: ["users"] as const,
    list: (params: { page: number; limit: number }) =>
      [...queryKeys.users.all, "list", params] as const,
    detail: (id: string) => [...queryKeys.users.all, "detail", id] as const,
    permissions: () => [...queryKeys.users.all, "permissions"] as const,
  },
} as const;
