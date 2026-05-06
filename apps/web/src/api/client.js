// Cliente HTTP com JWT auto-refresh
// VITE_API_URL: vazio em dev (usa proxy Vite), URL do Railway em produção
const API_BASE = import.meta.env.VITE_API_URL || "";

let accessToken = null;
let refreshToken = localStorage.getItem("aprovai_refresh") || null;

export function setTokens(at, rt) {
  accessToken = at;
  refreshToken = rt;
  if (rt) localStorage.setItem("aprovai_refresh", rt);
  else     localStorage.removeItem("aprovai_refresh");
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem("aprovai_refresh");
}

export function hasRefreshToken() {
  return !!refreshToken;
}

async function refreshAccessToken() {
  if (!refreshToken) throw new Error("sem refresh token");
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ refreshToken }),
  });
  if (!res.ok) { clearTokens(); throw new Error("sessão expirada"); }
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function apiFetch(path, options = {}) {
  const doFetch = async (token) => {
    const headers = { "Content-Type": "application/json", ...options.headers };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    return res;
  };

  let res = await doFetch(accessToken);

  // Token expirado — tenta refresh uma vez
  if (res.status === 401 && refreshToken) {
    const newToken = await refreshAccessToken();
    res = await doFetch(newToken);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || "Erro na API"), { status: res.status });
  }

  return res.json();
}

export const api = {
  get:    (path)         => apiFetch(path),
  post:   (path, body)   => apiFetch(path, { method: "POST",   body: JSON.stringify(body) }),
  put:    (path, body)   => apiFetch(path, { method: "PUT",    body: JSON.stringify(body) }),
  delete: (path)         => apiFetch(path, { method: "DELETE" }),
};
