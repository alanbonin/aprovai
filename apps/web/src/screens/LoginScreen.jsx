import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { C } from "../constants/colors";
import { Btn, Input, ErrorMsg, Spinner } from "../components/UI";

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode]     = useState("login"); // "login" | "register"
  const [email, setEmail]   = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (password.length < 8) { setError("Senha mínima de 8 caracteres"); setLoading(false); return; }
        await register(email, username, password);
      }
    } catch(err) {
      setError(err.message || "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100%", background: C.bg0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 20px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72, margin: "0 auto 16px",
            background: `linear-gradient(135deg, ${C.amber}, #e8911a)`,
            borderRadius: 20, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 34, boxShadow: `0 8px 32px ${C.amber}33`,
          }}>
            🎯
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>
            AprovAI
          </div>
          <div style={{ fontSize: 13, color: C.text2, marginTop: 4 }}>
            Seu mentor de elite para concursos públicos
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: C.bg1, border: `1px solid ${C.border}`,
          borderRadius: 20, padding: "28px 24px",
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, background: C.bg0, borderRadius: 10, padding: 4 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1, padding: "9px", border: "none", borderRadius: 8,
                  background: mode === m ? C.bg3 : "transparent",
                  color: mode === m ? C.text : C.text2,
                  fontSize: 13, fontWeight: mode === m ? 700 : 400, cursor: "pointer",
                  transition: "all .15s",
                }}>
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            {mode === "register" && (
              <Input
                label="Nome de usuário"
                type="text"
                placeholder="seu_nome"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                minLength={3}
              />
            )}
            <Input
              label="Senha"
              type="password"
              placeholder={mode === "register" ? "Mínimo 8 caracteres" : "••••••••"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />

            {error && <ErrorMsg>{error}</ErrorMsg>}

            <Btn disabled={loading} style={{ width: "100%", marginTop: 4 }}>
              {loading ? <Spinner size={18} color="#000" /> : mode === "login" ? "Entrar" : "Criar conta"}
            </Btn>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: C.text3 }}>
          AprovAI · Todos os direitos reservados
        </div>
      </div>
    </div>
  );
}
