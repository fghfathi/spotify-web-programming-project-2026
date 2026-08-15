// Central API client for the Django REST backend.
//
// - Reads the base URL from NEXT_PUBLIC_API_BASE_URL.
// - Attaches the JWT access token as `Authorization: Bearer <token>` on every
//   protected call.
// - Transparently refreshes an expired access token once (using the stored
//   refresh token) and retries the original request.
// - Exposes typed helpers (apiGet/apiPost/apiPatch/apiDelete/apiUpload).

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";

const ACCESS_KEY = "shpotify_access";
const REFRESH_KEY = "shpotify_refresh";

// --- Token storage --------------------------------------------------------
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh?: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_KEY, access);
  if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

// --- Error type -----------------------------------------------------------
export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Extract a human-readable message from a DRF error payload.
function messageFromData(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const obj = data as Record<string, unknown>;
  if (typeof obj.detail === "string") return obj.detail;
  // First field error, e.g. { email: ["already exists"] }.
  for (const value of Object.values(obj)) {
    if (Array.isArray(value) && value.length && typeof value[0] === "string") {
      return value[0] as string;
    }
    if (typeof value === "string") return value;
  }
  return fallback;
}

// --- Token refresh --------------------------------------------------------
async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.access) {
      setTokens(data.access);
      return data.access as string;
    }
    return null;
  } catch {
    return null;
  }
}

// --- Core request ---------------------------------------------------------
interface RequestOptions {
  method?: string;
  // A plain object is JSON-encoded; a FormData is sent as multipart.
  body?: unknown;
  auth?: boolean; // attach the Bearer token (default true)
  retry?: boolean; // internal: whether a refresh+retry is still allowed
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, retry = true } = options;
  const headers: Record<string, string> = {};
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  if (auth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let payload: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (isForm) {
      payload = body as FormData; // browser sets the multipart boundary
    } else {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: payload });

  // Transparently refresh once on an expired access token.
  if (res.status === 401 && auth && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, { ...options, retry: false });
    }
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, messageFromData(data, res.statusText), data);
  }
  return data as T;
}

// --- Public helpers -------------------------------------------------------
export function apiGet<T>(path: string, auth = true): Promise<T> {
  return request<T>(path, { method: "GET", auth });
}

export function apiPost<T>(path: string, body?: unknown, auth = true): Promise<T> {
  return request<T>(path, { method: "POST", body, auth });
}

export function apiPatch<T>(path: string, body?: unknown, auth = true): Promise<T> {
  return request<T>(path, { method: "PATCH", body, auth });
}

export function apiDelete<T>(path: string, auth = true): Promise<T> {
  return request<T>(path, { method: "DELETE", auth });
}

export function apiUpload<T>(
  path: string,
  formData: FormData,
  method: "POST" | "PATCH" = "POST"
): Promise<T> {
  return request<T>(path, { method, body: formData, auth: true });
}

// Multipart upload with progress reporting (used by the audio upload form).
// fetch() cannot report upload progress, so this uses XMLHttpRequest and
// calls onProgress(0..100) as bytes are sent.
export function apiUploadWithProgress<T>(
  path: string,
  formData: FormData,
  onProgress: (percent: number) => void,
  method: "POST" | "PATCH" = "POST"
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${API_BASE}${path}`);
    const token = getAccessToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      const data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data as T);
      } else {
        reject(new ApiError(xhr.status, messageFromData(data, xhr.statusText), data));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, "Network error", null));
    xhr.send(formData);
  });
}

// Some list endpoints are paginated ({results:[...]}) and some return a bare
// array. This normalizes both to an array.
export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: T[] }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}
