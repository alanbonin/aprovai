import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, loadTokens, setTokens, clearTokens, hasRefreshToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [agents,  setAgents]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      await loadTokens();
      if (!hasRefreshToken()) { setLoading(false); return; }
      try {
        const d = await api.get("/api/auth/me");
        setUser(d.user);
        setAgents(d.agents || []);
      } catch { await clearTokens(); }
      setLoading(false);
    }
    init();
  }, []);

  async function login(email, password) {
    const d = await api.post("/api/auth/login", { email, password });
    await setTokens(d.accessToken, d.refreshToken);
    setUser(d.user);
    setAgents(d.agents || []);
    return d;
  }

  async function register(email, username, password) {
    const d = await api.post("/api/auth/register", { email, username, password });
    await setTokens(d.accessToken, d.refreshToken);
    setUser(d.user);
    setAgents(d.agents || []);
    return d;
  }

  async function logout() {
    try { await api.post("/api/auth/logout", {}); } catch {}
    await clearTokens();
    setUser(null);
    setAgents([]);
  }

  return (
    <AuthContext.Provider value={{ user, agents, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
