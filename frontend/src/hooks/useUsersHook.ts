import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { ApiUserRecord } from "@/api/users.api";
import {
  useCreateUserMutation,
  usePermissionsCatalogQuery,
  useUpdateUserMutation,
  useUserQuery,
} from "@/api/users.api";

function emptyForm() {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "general_staff",
    permissions: [] as string[],
    isActive: true,
    hasSystemAccess: false,
    isTwoFactorEnabled: false,
    branch_id: "",
    employment: {
      hireDate: "",
      designation: "",
      department: "",
      status: "ACTIVE",
    },
    shift: {
      startTime: "09:00",
      endTime: "17:00",
      workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    salary: {
      baseAmount: "" as string | number,
      payType: "SALARY",
      paymentMethod: "BANK_TRANSFER",
      bankDetails: { bankName: "", accountNumber: "", iban: "" },
    },
    address: {
      country: "",
      state: "",
      city: "",
      street: "",
      zip: "",
    },
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },
  };
}

function branchIdFromUser(u: ApiUserRecord): string {
  const b = u.branch_id;
  if (!b) return "";
  if (typeof b === "string") return b;
  return b._id ?? "";
}

function formatHireDate(d: unknown): string {
  if (!d) return "";
  const s = typeof d === "string" ? d : String(d);
  if (s.length >= 10) return s.slice(0, 10);
  return s;
}

function mapUserToForm(u: ApiUserRecord) {
  const base = emptyForm();
  const sal = (u.salary ?? {}) as Record<string, unknown>;
  const bank = (sal.bankDetails as Record<string, string> | undefined) ?? {};
  return {
    ...base,
    firstName: u.firstName ?? "",
    lastName: u.lastName ?? "",
    email: u.email ?? "",
    phone: u.phone ?? "",
    password: "",
    role: u.role ?? "general_staff",
    permissions: Array.isArray(u.permissions) ? [...u.permissions] : [],
    isActive: u.isActive !== false,
    hasSystemAccess: !!u.hasSystemAccess,
    isTwoFactorEnabled: !!u.isTwoFactorEnabled,
    branch_id: branchIdFromUser(u),
    employment: {
      hireDate: formatHireDate(u.employment?.hireDate),
      designation: u.employment?.designation ?? "",
      department: u.employment?.department ?? "",
      status: u.employment?.status ?? "ACTIVE",
    },
    shift: {
      startTime: u.shift?.startTime ?? base.shift.startTime,
      endTime: u.shift?.endTime ?? base.shift.endTime,
      workDays: Array.isArray(u.shift?.workDays) ? [...u.shift!.workDays!] : [...base.shift.workDays],
    },
    salary: {
      baseAmount: sal.baseAmount != null && sal.baseAmount !== "" ? Number(sal.baseAmount) : "",
      payType: (sal.payType as string) ?? "SALARY",
      paymentMethod: (sal.paymentMethod as string) ?? "BANK_TRANSFER",
      bankDetails: {
        bankName: bank.bankName ?? "",
        accountNumber: bank.accountNumber ?? "",
        iban: bank.iban ?? "",
      },
    },
    address: {
      country: (u.address?.country as string) ?? "",
      state: (u.address?.state as string) ?? "",
      city: (u.address?.city as string) ?? "",
      street: (u.address?.street as string) ?? "",
      zip: (u.address?.zip as string) ?? "",
    },
    emergencyContact: {
      name: (u.emergencyContact?.name as string) ?? "",
      relationship: (u.emergencyContact?.relationship as string) ?? "",
      phone: (u.emergencyContact?.phone as string) ?? "",
    },
  };
}

function buildPayload(form: ReturnType<typeof emptyForm>, isUpdate: boolean): Record<string, unknown> {
  const baseAmount =
    form.salary.baseAmount === "" || form.salary.baseAmount === undefined
      ? undefined
      : Number(form.salary.baseAmount);

  const salary =
    baseAmount != null && !Number.isNaN(baseAmount)
      ? {
          baseAmount,
          payType: form.salary.payType,
          paymentMethod: form.salary.paymentMethod,
          bankDetails:
            form.salary.paymentMethod === "BANK_TRANSFER"
              ? { ...form.salary.bankDetails }
              : undefined,
        }
      : undefined;

  const body: Record<string, unknown> = {
    firstName: form.firstName,
    lastName: form.lastName || undefined,
    phone: form.phone || undefined,
    role: form.role,
    isActive: form.isActive,
    hasSystemAccess: form.hasSystemAccess,
    isTwoFactorEnabled: form.isTwoFactorEnabled,
    permissions: form.hasSystemAccess ? form.permissions : [],
    branch_id: form.branch_id || undefined,
    employment: {
      hireDate: form.employment.hireDate ? new Date(form.employment.hireDate).toISOString() : undefined,
      designation: form.employment.designation || undefined,
      department: form.employment.department || undefined,
      status: form.employment.status,
    },
    shift: {
      startTime: form.shift.startTime,
      endTime: form.shift.endTime,
      workDays: form.shift.workDays,
    },
    salary,
    address: {
      country: form.address.country || undefined,
      state: form.address.state || undefined,
      city: form.address.city || undefined,
      street: form.address.street || undefined,
      zip: form.address.zip || undefined,
    },
    emergencyContact: {
      name: form.emergencyContact.name || undefined,
      relationship: form.emergencyContact.relationship || undefined,
      phone: form.emergencyContact.phone || undefined,
    },
  };

  if (form.hasSystemAccess) {
    body.email = form.email || undefined;
    if (!isUpdate || (form.password && String(form.password).length > 0)) {
      body.password = form.password || undefined;
    }
  } else {
    delete body.email;
    delete body.password;
  }

  if (isUpdate && !body.password) {
    delete body.password;
  }

  return body;
}

export function useUsersHook() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editUserId = id;

  const [formData, setFormData] = useState(emptyForm);

  const userQuery = useUserQuery(editUserId, { enabled: !!editUserId });
  const permissionsQuery = usePermissionsCatalogQuery();
  const createUserMutation = useCreateUserMutation();
  const updateUserMutation = useUpdateUserMutation();

  useEffect(() => {
    if (editUserId && userQuery.data) {
      setFormData(mapUserToForm(userQuery.data));
    }
  }, [editUserId, userQuery.data]);

  useEffect(() => {
    if (!editUserId) {
      setFormData(emptyForm());
    }
  }, [editUserId]);

  const updateFormField = useCallback((field: string, value: unknown) => {
    setFormData((prev) => {
      if (!field.includes(".")) {
        return { ...prev, [field]: value };
      }
      const next = JSON.parse(JSON.stringify(prev)) as ReturnType<typeof emptyForm>;
      const parts = field.split(".");
      let cur: Record<string, unknown> = next as unknown as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        const existing = cur[p];
        cur[p] =
          existing && typeof existing === "object" && !Array.isArray(existing)
            ? { ...(existing as object) }
            : {};
        cur = cur[p] as Record<string, unknown>;
      }
      cur[parts[parts.length - 1]] = value as never;
      return next;
    });
  }, []);

  const resetForm = useCallback(() => {
    if (editUserId) {
      navigate("/user-management");
    } else {
      navigate("/user-management");
    }
    setFormData(emptyForm());
  }, [editUserId, navigate]);

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault?.();

      if (!formData.firstName?.trim()) {
        toast.error("First name is required.");
        return;
      }

      if (formData.hasSystemAccess) {
        if (!formData.email?.trim()) {
          toast.error("Email is required when system access is enabled.");
          return;
        }
        if (!editUserId && !formData.password) {
          toast.error("Password is required for new users with system access.");
          return;
        }
      }

      const toastId = toast.loading(editUserId ? "Updating user…" : "Creating user…");
      try {
        const payload = buildPayload(formData, !!editUserId);
        if (editUserId) {
          await updateUserMutation.mutateAsync({ id: editUserId, body: payload });
          toast.success("User updated.", { id: toastId });
          navigate(`/user-management/${editUserId}`);
        } else {
          const created = await createUserMutation.mutateAsync(payload);
          toast.success("User created.", { id: toastId });
          const newId = created._id;
          navigate(newId ? `/user-management/${newId}` : "/user-management");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Request failed";
        toast.error(msg, { id: toastId });
      }
    },
    [formData, editUserId, createUserMutation, updateUserMutation, navigate]
  );

  const transformedAllPermissions = useMemo(
    () => permissionsQuery.data ?? [],
    [permissionsQuery.data]
  );

  return {
    formData,
    isUserLoading: !!editUserId && userQuery.isLoading,
    permissionsLoading: permissionsQuery.isLoading,
    transformedAllPermissions,
    updateFormField,
    handleSubmit,
    resetForm,
    createUserMutation,
    updateUserMutation,
    isEditMode: !!editUserId,
    currentUser: null as unknown,
  };
}
