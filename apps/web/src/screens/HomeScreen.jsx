import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAgent } from "../hooks/useAgent";
import { C } from "../constants/colors";
import { Card, ProgressBar, Spinner } from "../components/UI";
import { api } from "../api/client";

export default function HomeScreen({ onNavigate }) {
  const { user } = useAuth();
  const { activeAgent, clearAgent } = useAgent();
  const { area, banca } = activeAgent;

  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/stats?areaId=${area.id}&bancaId=${banca.id}`)
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [area.id, banca.id]);

  const subjects = area.subjects || [];
  const totalQ   = stats?.totalQuestions || 0;
  const answered = stats?.answered || 0;
  const correct  = stats?.correct  || 0;
  const pct      = answered > 0 ? Math.round(correct / answered * 100) : 0;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "20px 16px" }}>

      {/* Agente ativo */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "16px 18px", background: C.bg2,
        border: `1px solid ${area.color}33`, borderRadius: 16, marginBottom: 20,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: area.color + "18", border: `1px solid ${area.color}44`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
        }}>
          {area.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{area.name}</div>
          <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>
            <span style={{ color: banca.color, fontWeight: 700 }}>{banca.name}</span>
            {" · "}{user?.username}
          </div>
        </div>
        <button onClick={clearAgent}
          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.text3, fontSize: 11, cursor: "pointer" }}>
          Trocar
        </button>
      </div>

      {/* Stats */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}><Spinner /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Respondidas", val: answered,   color: C.blue  },
            { label: "Acertos",     val: correct,    color: C.green },
            { label: "Aproveit.",   val: pct + "%",  color: pct >= 70 ? C.green : pct >= 50 ? C.amber : C.red },
          ].map(s => (
            <div key={s.label} style={{
              background: C.bg2, border: `1px solid ${C.border}`,
              borderRadius: 14, padding: "14px 10px", textAlign: "center",
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: "monospace", lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Dica da banca */}
      <div style={{
        background: banca.color + "0d", border: `1px solid ${banca.color}2a`,
        borderRadius: 14, padding: "14px 16px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 11, color: banca.color, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          💡 Estratégia {banca.name}
        </div>
        <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.6 }}>{banca.tip}</div>
      </div>

      {/* Matérias */}
      <div style={{ fontSize: 10, color: C.text3, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
        Matérias do agente
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {subjects.map(subj => {
          const subjStat = stats?.bySubject?.[subj] || { answered: 0, correct: 0 };
          const sp = subjStat.answered > 0 ? Math.round(subjStat.correct / subjStat.answered * 100) : 0;
          return (
            <button key={subj}
              onClick={() => onNavigate("study", { subject: subj })}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", background: C.bg2,
                border: `1px solid ${C.border}`, borderRadius: 12,
                cursor: "pointer", textAlign: "left",
              }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{subj}</div>
                <ProgressBar pct={sp} color={sp >= 70 ? C.green : sp >= 50 ? C.amber : C.blue} height={3} />
              </div>
              <div style={{ fontSize: 11, color: C.text3, fontFamily: "monospace", flexShrink: 0 }}>
                {subjStat.answered > 0 ? sp + "%" : "—"}
              </div>
              <div style={{ fontSize: 16, color: C.text3 }}>→</div>
            </button>
          );
        })}
      </div>

      {/* Atalhos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button onClick={() => onNavigate("study")}
          style={{ padding: "16px 14px", background: C.amberD, border: `1px solid ${C.amberB}`, borderRadius: 14, cursor: "pointer", textAlign: "center", color: C.amber, fontWeight: 700, fontSize: 13 }}>
          📖 Estudar agora
        </button>
        <button onClick={() => onNavigate("simulado")}
          style={{ padding: "16px 14px", background: C.blueD, border: `1px solid ${C.blue}33`, borderRadius: 14, cursor: "pointer", textAlign: "center", color: C.blue, fontWeight: 700, fontSize: 13 }}>
          🎯 Simulado
        </button>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
