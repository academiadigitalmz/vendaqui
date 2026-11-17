import type { ApiError } from "./types";

export const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "") + "/v1";

export type AuthScope = "app" | "backoffice";

let accessToken: string | null = null;
let accessTokenScope: AuthScope = "app";

export const tokenStore = {
  get: () => accessToken,
  scope: () => accessTokenScope,
  set: (token: string | null, scope: AuthScope = accessTokenScope) => {
    accessToken = token;
    accessTokenScope = scope;
  },
};

export class HttpError extends Error {
  constructor(public status: number, public body: ApiError) {
    super(body.message);
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  headers?: Record<string, string>;
  envelope?: boolean;
  retryAuth?: boolean;
}

let refreshRequest: Promise<string | null> | null = null;

async function parseResponse(response: Response) {
  if (response.status === 204) return undefined;

  return response.json().catch(() => ({
    error: { code: "invalid_response", message: "Não foi possível carregar os dados. Tente novamente." },
  }));
}

export async function refreshAccessToken(scope: AuthScope): Promise<string | null> {
  if (refreshRequest) return refreshRequest;

  refreshRequest = (async () => {
    const path = scope === "backoffice" ? "/backoffice/auth/refresh" : "/auth/refresh";
    const response = await fetch(API_URL + path, {
      method: "POST",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    const payload = await parseResponse(response);
    if (!response.ok || !payload?.data?.accessToken) {
      tokenStore.set(null, scope);
      return null;
    }

    tokenStore.set(payload.data.accessToken, scope);
    return payload.data.accessToken as string;
  })().finally(() => {
    refreshRequest = null;
  });

  return refreshRequest;
}

export async function http<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(API_URL + path, window.location.origin);
  for (const [key, value] of Object.entries(options.query || {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = { Accept: "application/json", ...options.headers };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers,
    credentials: "include",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 401 && token && options.retryAuth !== false) {
    const renewed = await refreshAccessToken(tokenStore.scope());
    if (renewed) return http<T>(method, path, { ...options, retryAuth: false });
  }

  const payload = await parseResponse(response);
  if (!response.ok) {
    const error = payload?.error ?? payload ?? { code: "invalid_response", message: "Não foi possível carregar os dados. Tente novamente." };
    throw new HttpError(response.status, error as ApiError);
  }

  if (response.status === 204) return undefined as T;
  if (options.envelope === false) return payload as T;
  if (!payload || !("data" in payload)) {
    throw new HttpError(502, { code: "invalid_response", message: "Não foi possível carregar os dados. Tente novamente." });
  }

  return payload.data as T;
}

export const get = <T>(path: string, query?: Query) => http<T>("GET", path, { query });
export const post = <T>(path: string, body?: unknown, headers?: Record<string, string>) => http<T>("POST", path, { body: body ?? {}, headers });
export const patch = <T>(path: string, body: unknown) => http<T>("PATCH", path, { body });
export const put = <T>(path: string, body: unknown) => http<T>("PUT", path, { body });
export const del = <T>(path: string) => http<T>("DELETE", path);

export async function uploadForm(url: string, fields: Record<string, string>, file: File): Promise<void> {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  body.append("file", file);

  const response = await fetch(url, { method: "POST", body });
  if (!response.ok) throw new HttpError(response.status, {
    code: "upload_failed",
    message: "Não foi possível enviar o ficheiro. Tente novamente.",
  });
}
