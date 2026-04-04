import { useMemo } from "react";
import { useAppState } from "@/providers/AppStateProvider";
import { hasPermission, isAdminUser } from "@/lib/permissions";
import { PID } from "@/lib/permissionIds";

function allow(user: ReturnType<typeof useAppState>["currentUser"], id: string) {
  return hasPermission(user, id) || isAdminUser(user);
}

/**
 * Compatibility layer for legacy user-management components (employee.* + can("users:*")).
 */
export function usePermissions() {
  const { currentUser } = useAppState();

  const employee = useMemo(
    () => ({
      database: {
        read:
          allow(currentUser, PID.employee.database.read) ||
          allow(currentUser, PID.settings.users.read),
        create:
          allow(currentUser, PID.employee.database.create) ||
          allow(currentUser, PID.settings.users.create),
        update:
          allow(currentUser, PID.employee.database.update) ||
          allow(currentUser, PID.settings.users.update),
        delete:
          allow(currentUser, PID.employee.database.delete) ||
          allow(currentUser, PID.settings.users.delete),
      },
      shift: {
        read: allow(currentUser, PID.employee.shift.read),
        create: allow(currentUser, PID.employee.shift.create),
        update: allow(currentUser, PID.employee.shift.update),
        delete: allow(currentUser, PID.employee.shift.delete),
      },
      performance: {
        read: allow(currentUser, PID.employee.performance.read),
        create: allow(currentUser, PID.employee.performance.create),
        update: allow(currentUser, PID.employee.performance.update),
        delete: allow(currentUser, PID.employee.performance.delete),
      },
    }),
    [currentUser]
  );

  const can = useMemo(() => {
    return (key: string) => {
      switch (key) {
        case "users:read":
          return employee.database.read;
        case "users:create":
          return employee.database.create;
        case "users:update":
          return employee.database.update;
        case "users:delete":
          return employee.database.delete;
        default:
          return isAdminUser(currentUser);
      }
    };
  }, [currentUser, employee.database]);

  const currentUserRole = currentUser?.role ?? "staff";

  return { employee, can, currentUserRole, currentUser };
}
