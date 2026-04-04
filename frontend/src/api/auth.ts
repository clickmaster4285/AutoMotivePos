import { apiUrl } from "@/api/http";
import type { ApiLoginUser, BackendLoginUser } from "@/api/types";

function mapLoginUser(u: BackendLoginUser): ApiLoginUser {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.firstName;
  return {
    id: u.userId,
    name,
    email: u.email,
    role: u.role,
    permissions: Array.isArray(u.permissions) ? u.permissions : [],
  };
}

export async function loginRequest(
  email: string,
  password: string
): Promise<{ token: string; user: ApiLoginUser }> {
  const res = await fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    token?: string;
    user?: BackendLoginUser;
  };
  if (!res.ok) {
    throw new Error(data.message || "Login failed");
  }
  if (!data.token || !data.user) {
    throw new Error("Invalid response from server");
  }
  return { token: data.token, user: mapLoginUser(data.user) };
}
