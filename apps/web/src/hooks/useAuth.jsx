import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setTokens, clearTokens, hasRefreshToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [agents, setAgents]   = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const data = await api.get("/api/auth/me");
      setUser(data.user);
      setAgents(data.agents || []);
    } catch {
      setUser(null);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasRefreshToken()) loadMe();
    else setLoading(false);
  }, [loadMe]);

  async function login(email, password) {
    const data = await api.post("/api/auth/login", { email, password });
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    setAgents(data.agents || []);
    return data;
  }

  async function register(email, username, password) {
    const data = await api.post("/api/auth/register", { email, username, password });
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    setAgents(data.agents || []);
    return data;
  }

  async function logout() {
    try { await api.post("/api/auth/logout", {}); } catch {}
    clearTokens();
    setUser(null);
    setAgents([]);
  }

  function addAgent(agent) {
    setAgents(prev => [...prev, agent]);
  }

  return (
    <AuthContext.Provider value={{ user, agents, loading, login, register, logout, loadMe, addAgent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
