const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function getStoredTokens() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("gst_tokens");
  return raw ? (JSON.parse(raw) as { accessToken: string; refreshToken: string }) : null;
}

function storeTokens(tokens: { accessToken: string; refreshToken: string } | null) {
  if (typeof window === "undefined") return;
  if (tokens) {
    window.localStorage.setItem("gst_tokens", JSON.stringify(tokens));
  } else {
    window.localStorage.removeItem("gst_tokens");
  }
}

async function rawFetch(path: string, options: RequestInit, isForm: boolean): Promise<Response> {
  const tokens = getStoredTokens();
  const headers = new Headers(options.headers);
  if (!isForm) {
    headers.set("Content-Type", "application/json");
  }
  if (tokens?.accessToken) {
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }
  return fetch(`${API_URL}/api${path}`, { ...options, headers });
}

async function request<T>(path: string, options: RequestInit = {}, isForm = false, retry = true): Promise<T> {
  const tokens = getStoredTokens();
  let res = await rawFetch(path, options, isForm);

  if (res.status === 401 && retry && tokens?.refreshToken) {
    const refreshed = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    if (refreshed.ok) {
      const data = await refreshed.json();
      storeTokens(data.tokens);
      res = await rawFetch(path, options, isForm);
    } else {
      storeTokens(null);
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message ?? "Une erreur est survenue.");
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData, method: "POST" | "PATCH" = "POST") =>
    request<T>(path, { method, body: formData }, true),
  downloadText: async (path: string): Promise<string> => {
    const res = await rawFetch(path, { method: "GET" }, false);
    if (!res.ok) {
      throw new ApiError(res.status, "Impossible de télécharger le fichier.");
    }
    return res.text();
  },
  storeTokens,
  getStoredTokens,
};
