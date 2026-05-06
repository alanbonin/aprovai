import { useState, useEffect, useRef } from "react";
import { useAgent } from "../hooks/useAgent";
import { C } from "../constants/colors";
import { Spinner, ProgressBar, Badge, Btn } from "../components/UI";
import { api } from "../api/client";

export default function SimuladoScreen() {
  const { activeAgent, fetchSavedSimulados, fetchSavedSimulado, analyzeAnswer } = useAgent();
  const { area, banca } = activeAgent;

  const [packs, setPacks]     = useState([]);
  const [packsLoading, setPacksLoading] = useState(true);

  const [simQs, setSimQs]         = useState([]);
  const [simIdx, setSimIdx]       = useState(0);
  const [simAnswers, setSimAnswers] = useState({});
  const [simTime, setSimTime]     = useState(0);
  const [simStarted, setSimStarted] = useState(false);
  const [simFinished, setSimFinished] = useState(false);
  const [simLoading, setSimLoading]   = useState(false);
  const [simError, setSimError]       = useState(null);

  const [reviewData, setReviewData]   = useState(null);
  const [reviewed, setReviewed]       = useState({}); // idx → análise IA
  const [reviewing, setReviewing]     = useState(null);

  const timerRef = useRef(null);
  const qStartRef = useRef(0);
  const [qTimes, setQTimes] = useState({});

  // Carrega packs disponíveis
  useEffect(() => {
    fetchSavedSimulados()
      .then(d => setPacks(d.simulados || []))
      .catch(() => setPacks([]))
      .finally(() => setPacksLoading(false));
  }, [area.id, banca.id]);

  // Timer
  useEffect(() => {
    if (!simStarted || simFinished) return;
    timerRef.current = setInterval(() => setSimTime(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [simStarted, simFinished]);

  async function startPack(id) {
    setSimLoading(true); setSimError(null);
    try {
      const pack = await fetchSavedSimulado(id);
      if (!pack.questions?.length) throw new Error("Simulado vazio");
      setSimQs(pack.questions);
      setSimIdx(0); setSimAnswers({}); setSimTime(0);
      setQTimes({}); qStartRef.current = 0;
      setSimStarted(true); setSimFinished(false); setReviewData(null);
    } catch(e) { setSimError(e.message); }
    setSimLoading(false);
  }

  function answerSim(letter) {
    const elapsed = simTime - qStartRef.current;
    qStartRef.current = simTime;
    setQTimes(p => ({ ...p, [simIdx]: elapsed }));
    const ns = { ...simAnswers, [simIdx]: letter };
    setSimAnswers(ns);
    if (simIdx < simQs.length - 1) setSimIdx(i => i + 1);
    else finishSim(ns);
  }

  function finishSim(ans) {
    clearInterval(timerRef.current);
    setSimFinished(true);
    const correct = simQs.filter((q, i) => ans[i] === q.correta).length;
    api.post("/api/simulados/history", {
      areaId: area.id, bancaId: banca.id,
      total: simQs.length, correct, timeSecs: simTime,
      questions: simQs, answers: ans,
    }).catch(() => {});
  }

  async function explainError(idx) {
    setReviewing(idx);
    try {
      const r = await analyzeAnswer(simQs[idx], simAnswers[idx] || "A");
      setReviewed(p => ({ ...p, [idx]: r.explicacao || "" }));
    } catch { setReviewed(p => ({ ...p, [idx]: "Não foi possível analisar." })); }
    setReviewing(null);
  }

  const fmtTime = t => `${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`;

  // ── Lista de packs ─────────────────────────────────────────
  if (!simStarted && !simFinished) {
    return (
      <div style={{ height: "100%", overflowY: "auto", padding: "20px 16px" }}>
        <div style={{ fontSize: 10, color: C.text3, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
          Simulados disponíveis
        </div>

        {simLoading && <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><Spinner /></div>}
        {simError && <div style={{ fontSize: 13, color: C.red, marginBottom: 16 }}>{simError}</div>}

        {packsLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
        ) : packs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.text2 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Nenhum simulado disponível</div>
            <div style={{ fontSize: 12, color: C.text3 }}>O administrador ainda não gerou simulados para este agente.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {packs.map(p => {
              const label = p.size <= 30 ? "Rápido · ~25 min" : p.size <= 50 ? "Médio · ~45 min" : "Completo · ~90 min";
              const color = p.size <= 30 ? C.green : p.size <= 50 ? C.amber : C.blue;
              const date = new Date(p.created_at * 1000).toLocaleDateString("pt-BR");
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: color + "18", border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color, fontFamily: "monospace", flexShrink: 0 }}>
                    {p.size}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{label} · {date}</div>
                  </div>
                  <Btn onClick={() => startPack(p.id)} style={{ padding: "10px 16px" }}>Iniciar</Btn>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ height: 24 }} />
      </div>
    );
  }

  // ── Questão do simulado ────────────────────────────────────
  if (simStarted && !simFinished) {
    const q = simQs[simIdx];
    const progress = ((simIdx) / simQs.length) * 100;
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", background: C.bg1, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: C.text2 }}>Q{simIdx + 1}/{simQs.length} · {fmtTime(simTime)}</div>
            <Badge color={area.color}>{banca.abbr}</Badge>
          </div>
          <ProgressBar pct={progress} height={3} />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
            {q.materia && <div style={{ fontSize: 11, color: C.amber, fontWeight: 700, marginBottom: 6 }}>{q.materia}</div>}
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.7 }}>{q.enunciado}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {q.alternativas?.map(alt => {
              const letter = alt[0];
              return (
                <button key={letter} onClick={() => answerSim(letter)}
                  style={{
                    padding: "13px 14px", background: C.bg2, border: `1px solid ${C.border}`,
                    borderRadius: 10, cursor: "pointer", textAlign: "left",
                    fontSize: 13, color: C.text, display: "flex", gap: 10, alignItems: "flex-start",
                  }}>
                  <span style={{ fontFamily: "monospace", flexShrink: 0, fontSize: 12, marginTop: 1 }}>{letter})</span>
                  <span>{alt.slice(3)}</span>
                </button>
              );
            })}
          </div>
          <div style={{ height: 24 }} />
        </div>
      </div>
    );
  }

  // ── Resultado final ────────────────────────────────────────
  if (simFinished) {
    const correct = simQs.filter((q, i) => simAnswers[i] === q.correta).length;
    const pct = Math.round(correct / simQs.length * 100);
    const pctColor = pct >= 70 ? C.green : pct >= 50 ? C.amber : C.red;
    return (
      <div style={{ height: "100%", overflowY: "auto", padding: 16 }}>
        {/* Resumo */}
        <div style={{ background: C.bg2, border: `1px solid ${C.amberB}`, borderRadius: 16, padding: "20px 18px", marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: pctColor, fontFamily: "monospace", lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 14, color: C.text2, marginTop: 8 }}>{correct}/{simQs.length} acertos · {fmtTime(simTime)}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <Btn onClick={() => { setSimStarted(false); setSimFinished(false); }}>← Voltar</Btn>
          <Btn variant="secondary" onClick={() => setReviewData(true)}>📋 Ver gabarito</Btn>
        </div>

        {/* Gabarito */}
        {reviewData && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 10, color: C.text3, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Gabarito completo</div>
            {simQs.map((q, i) => {
              const ok = simAnswers[i] === q.correta;
              const expl = reviewed[i];
              return (
                <div key={i} style={{ background: C.bg2, border: `1px solid ${ok ? C.greenB : C.redB}`, borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <Badge color={C.blue}>Q{i+1}{q.materia ? ` · ${q.materia.split(" ")[0]}` : ""}</Badge>
                    <span style={{ fontSize: 12, fontWeight: 700, color: ok ? C.green : C.red }}>
                      {ok ? "✓" : "✗"} {simAnswers[i] || "—"} → {q.correta}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6, marginBottom: 8 }}>{q.enunciado.slice(0, 120)}...</div>
                  {!ok && !expl && (
                    <button onClick={() => explainError(i)} disabled={reviewing === i}
                      style={{ fontSize: 11, color: C.blue, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      {reviewing === i ? <><Spinner size={12} color={C.blue} /> Analisando...</> : "🤖 Explicar erro"}
                    </button>
                  )}
                  {expl && <div style={{ fontSize: 12, color: C.text2, background: C.bg3, borderRadius: 8, padding: "10px 12px", lineHeight: 1.6, marginTop: 8 }}>{expl}</div>}
                </div>
              );
            })}
          </div>
        )}
        <div style={{ height: 24 }} />
      </div>
    );
  }

  return null;
}
