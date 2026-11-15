import type { ApiError } from "./types";

/** URL base da API. Em modo simulado o MSW responde a estes pedidos no próprio browser. */
export const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "") + "/v1";

const TOKEN_KEY = "vq.token";
export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t: string | null) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* sem armazenamento */ } },
};

export class HttpError extends Error {
  constructor(public status: number, public body: ApiError) { super(body.message); }
}

type Query = Record<string, string | number | boolean | undefined | null>;

export async function http<T>(method: string, path: string, opts: { query?: Query; body?: unknown; headers?: Record<string, string>; envelope?: boolean; credentials?: RequestCredentials } = {}): Promise<T> {
  const url = new URL(API_URL + path, window.location.origin);
  for (const [k, v] of Object.entries(opts.query || {})) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  const headers: Record<string, string> = { Accept: "application/json", ...opts.headers };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method, headers, credentials: opts.credentials, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({ code: "invalid_response", message: "Resposta inválida do servidor." }));
  if (!res.ok) throw new HttpError(res.status, (data.error ?? data) as ApiError);
  if (opts.envelope && (!data || !("data" in data))) throw new HttpError(502, { code: "invalid_response", message: "Resposta inválida do servidor." });
  return (opts.envelope ? data.data : data) as T;
}

export const get = <T>(path: string, query?: Query) => http<T>("GET", path, { query });
export const post = <T>(path: string, body?: unknown) => http<T>("POST", path, { body: body ?? {} });
export const patch = <T>(path: string, body: unknown) => http<T>("PATCH", path, { body });
export const put = <T>(path: string, body: unknown) => http<T>("PUT", path, { body });
