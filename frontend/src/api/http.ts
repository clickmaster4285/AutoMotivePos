import { getSingle } from "@/lib/storage";

const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

export function getAuthToken(): string | null {
  return getSingle<string>("app_auth_token");
}

/** Authenticated JSON API call. Throws on non-OK with server message when present. */
export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(path), { ...init, headers });
  let data: any = {};
  try {
    data = await response.json();
  } catch (e) {
    // Non-JSON response, empty data
  }
  (data as any) = data as { message?: string; success?: boolean };

  if (!response.ok) {
    throw new Error((data as any).message || response.statusText || "Request failed");
  }

  return data as T;
}
