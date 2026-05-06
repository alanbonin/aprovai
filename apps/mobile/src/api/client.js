import AsyncStorage from "@react-native-async-storage/async-storage";

// Em dev: troque pelo IP da sua máquina na rede local (ex: 192.168.1.100)
// Em prod: URL do Railway
export const API_URL = __DEV__
  ? "http://192.168.1.100:3001"
  : "https://aprovai-api.up.railway.app";

let accessToken  = null;
let refreshToken = null;

export async function loadTokens() {
  refreshToken = await AsyncStorage.getItem("aprovai_refresh");
}

export async function setTokens(at, rt) {
  accessToken  = at;
  refreshToken = rt;
  if (rt) await AsyncStorage.setItem("aprovai_refresh", rt);
  else    await AsyncStorage.removeItem("aprovai_refresh");
}

export async function clearTokens() {
  accessToken  = null;
  refreshToken = null;
  await AsyncStorage.removeItem("aprovai_refresh");
}

export function hasRefreshToken() {
  return !!refreshToken;
}

async function refreshAccessToken() {
  if (!refreshToken) throw new Error("sem refresh token");
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ refreshToken }),
  });
  if (!res.ok) { await clearTokens(); throw new Error("sessão expirada"); }
  const data = await res.json();
  await setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function apiFetch(path, options = {}) {
  const doFetch = async (token) => {
    const headers = { "Content-Type": "application/json", ...options.headers };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(`${API_URL}${path}`, { ...options, headers });
  };

  let res = await doFetch(accessToken);

  if (res.status === 401 && refreshToken) {
    try {
      const newToken = await refreshAccessToken();
      res = await doFetch(newToken);
    } catch {
      throw Object.assign(new Error("sessão expirada"), { status: 401 });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || "Erro na API"), { status: res.status });
  }

  return res.json();
}

export const api = {
  get:    (path)       => apiFetch(path),
  post:   (path, body) => apiFetch(path, { method: "POST",   body: JSON.stringify(body) }),
  put:    (path, body) => apiFetch(path, { method: "PUT",    body: JSON.stringify(body) }),
  delete: (path)       => apiFetch(path, { method: "DELETE" }),
};
