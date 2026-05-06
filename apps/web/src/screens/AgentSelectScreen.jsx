import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAgent } from "../hooks/useAgent";
import { C } from "../constants/colors";
import { Btn, Card } from "../components/UI";
import { AREAS, BANCAS } from "../../../../packages/shared/src/agents.js";

export default function AgentSelectScreen() {
  const { user, agents, logout } = useAuth();
  const { selectAgent } = useAgent();

  const [step, setStep]       = useState("area");  // "area" | "banca"
  const [selArea, setSelArea] = useState(null);

  // Agentes já contratados pelo usuário
  const myAgentKeys = new Set(agents.map(a => `${a.area_id}__${a.banca_id}`));

  function handleAreaClick(area) {
    setSelArea(area);
    setStep("banca");
  }

  function handleBancaClick(banca) {
    selectAgent(selArea, banca);
  }

  // Se já tem agentes contratados, mostra eles primeiro
  const hasAgents = agents.length > 0;

  return (
    <div style={{
      height: "100%", background: C.bg0, overflowY: "auto",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 20px 16px", background: C.bg1,
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            {step === "banca" ? (
              <span>
                <button onClick={() => setStep("area")}
                  style={{ background: "none", border: "none", color: C.text2, cursor: "pointer", fontSize: 18, marginRight: 8 }}>←</button>
                Escolha a banca
              </span>
            ) : "Escolha seu agente"}
          </div>
          <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>
            {step === "area"
              ? "Área de atuação do concurso"
              : `Área: ${selArea?.name}`}
          </div>
        </div>
        <button onClick={logout}
          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", color: C.text2, fontSize: 12, cursor: "pointer" }}>
          Sair
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>

        {/* Agentes já contratados */}
        {hasAgents && step === "area" && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, color: C.text3, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              Seus agentes
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {agents.map(a => {
                const area  = AREAS.find(x => x.id === a.area_id);
                const banca = BANCAS.find(x => x.id === a.banca_id);
                if (!area || !banca) return null;
                return (
                  <button key={`${a.area_id}__${a.banca_id}`}
                    onClick={() => selectAgent(area, banca)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", background: C.bg2,
                      border: `1px solid ${area.color}44`, borderRadius: 14,
                      cursor: "pointer", textAlign: "left",
                    }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: area.color + "18", border: `1px solid ${area.color}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22,
                    }}>
                      {area.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{area.name}</div>
                      <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{banca.name}</div>
                    </div>
                    <div style={{ fontSize: 20, color: C.text3 }}>→</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Seleção de área */}
        {step === "area" && (
          <>
            <div style={{ fontSize: 10, color: C.text3, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              {hasAgents ? "Explorar outras áreas" : "Selecione a área"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {AREAS.map(area => (
                <button key={area.id} onClick={() => handleAreaClick(area)}
                  style={{
                    padding: "16px 14px", background: C.bg2,
                    border: `1px solid ${C.border}`, borderRadius: 14,
                    cursor: "pointer", textAlign: "left",
                    transition: "border-color .15s, background .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = area.color + "55"; e.currentTarget.style.background = area.color + "08"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.bg2; }}>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{area.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4, lineHeight: 1.3 }}>{area.name}</div>
                  <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.4 }}>
                    {area.cargos.slice(0, 2).join(" · ")}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Seleção de banca */}
        {step === "banca" && selArea && (
          <>
            <div style={{ fontSize: 10, color: C.text3, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              Banca examinadora
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {BANCAS.map(banca => {
                const owned = myAgentKeys.has(`${selArea.id}__${banca.id}`);
                return (
                  <button key={banca.id} onClick={() => handleBancaClick(banca)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 14,
                      padding: "16px", background: C.bg2,
                      border: `1px solid ${owned ? banca.color + "44" : C.border}`, borderRadius: 14,
                      cursor: "pointer", textAlign: "left", position: "relative",
                    }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                      background: banca.color + "18", border: `1px solid ${banca.color}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 800, color: banca.color, fontFamily: "monospace",
                    }}>
                      {banca.abbr}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{banca.name}</span>
                        {owned && (
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: C.green + "22", color: C.green, fontWeight: 700 }}>Ativo</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.55 }}>{banca.style}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
