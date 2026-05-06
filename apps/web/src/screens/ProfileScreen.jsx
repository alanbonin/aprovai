import { useAuth } from "../hooks/useAuth";
import { useAgent } from "../hooks/useAgent";
import { C } from "../constants/colors";
import { Btn, Card } from "../components/UI";
import { AREAS, BANCAS } from "../../../../packages/shared/src/agents.js";
import { api } from "../api/client";
import { useState } from "react";

export default function ProfileScreen() {
  const { user, agents, logout } = useAuth();
  const { activeAgent, selectAgent } = useAgent();
  const [portalLoading, setPortalLoading] = useState(false);

  async function openBillingPortal() {
    setPortalLoading(true);
    try {
      const { url } = await api.get("/api/payments/portal");
      if (url) window.open(url, "_blank");
    } catch {}
    setPortalLoading(false);
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "20px 16px" }}>

      {/* Usuário */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, marginBottom: 20 }}>
        <div style={{ width: 52, height: 52, background: `linear-gradient(135deg,${C.amber},#e8911a)`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#000", flexShrink: 0 }}>
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.username}</div>
          <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{user?.email}</div>
        </div>
      </div>

      {/* Agentes contratados */}
      <div style={{ fontSize: 10, color: C.text3, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
        Meus agentes ({agents.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {agents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: C.text3, fontSize: 13 }}>Nenhum agente contratado.</div>
        ) : agents.map(a => {
          const area  = AREAS.find(x => x.id === a.area_id);
          const banca = BANCAS.find(x => x.id === a.banca_id);
          if (!area || !banca) return null;
          const isActive = activeAgent?.area.id === area.id && activeAgent?.banca.id === banca.id;
          return (
            <div key={`${a.area_id}__${a.banca_id}`}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: C.bg2, border: `1px solid ${isActive ? area.color + "55" : C.border}`, borderRadius: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: area.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {area.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{area.name}</div>
                <div style={{ fontSize: 11, color: banca.color }}>{banca.name}</div>
              </div>
              {isActive ? (
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: C.green + "22", color: C.green, fontWeight: 700 }}>Ativo</span>
              ) : (
                <button onClick={() => selectAgent(area, banca)}
                  style={{ fontSize: 11, color: C.blue, background: "none", border: `1px solid ${C.blue}44`, borderRadius: 7, padding: "5px 10px", cursor: "pointer" }}>
                  Ativar
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Assinatura */}
      <div style={{ fontSize: 10, color: C.text3, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
        Assinatura
      </div>
      <Btn variant="secondary" onClick={openBillingPortal} disabled={portalLoading} style={{ width: "100%", marginBottom: 10 }}>
        {portalLoading ? "Abrindo..." : "💳 Gerenciar assinatura"}
      </Btn>
      <Btn variant="secondary" onClick={() => window.location.href = "/planos"} style={{ width: "100%", marginBottom: 24 }}>
        ➕ Contratar novo agente
      </Btn>

      {/* Logout */}
      <Btn variant="danger" onClick={logout} style={{ width: "100%" }}>
        Sair da conta
      </Btn>

      <div style={{ height: 32 }} />
    </div>
  );
}
