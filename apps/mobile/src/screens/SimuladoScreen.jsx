import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useAgent } from "../hooks/useAgent";
import { C } from "../constants/colors";
import { Spinner, Badge, Btn } from "../components/UI";
import { api } from "../api/client";

export default function SimuladoScreen() {
  const { activeAgent, fetchSavedSimulados, fetchSavedSimulado, analyzeAnswer } = useAgent();
  const { area, banca } = activeAgent;

  const [packs,       setPacks]       = useState([]);
  const [packsLoad,   setPacksLoad]   = useState(true);
  const [simQs,       setSimQs]       = useState([]);
  const [simIdx,      setSimIdx]      = useState(0);
  const [simAnswers,  setSimAnswers]  = useState({});
  const [simTime,     setSimTime]     = useState(0);
  const [simStarted,  setSimStarted]  = useState(false);
  const [simFinished, setSimFinished] = useState(false);
  const [simLoading,  setSimLoading]  = useState(false);
  const [simError,    setSimError]    = useState(null);
  const [reviewData,  setReviewData]  = useState(false);
  const [reviewed,    setReviewed]    = useState({});
  const [reviewing,   setReviewing]   = useState(null);

  const timerRef  = useRef(null);
  const qStartRef = useRef(0);

  useEffect(() => {
    fetchSavedSimulados()
      .then(d => setPacks(d.simulados || []))
      .catch(() => {})
      .finally(() => setPacksLoad(false));
  }, [area.id, banca.id]);

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
      qStartRef.current = 0;
      setSimStarted(true); setSimFinished(false); setReviewData(false);
    } catch(e) { setSimError(e.message); }
    setSimLoading(false);
  }

  function answerSim(letter) {
    qStartRef.current = simTime;
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

  const fmtTime = t => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;

  // ── Lista de packs ────────────────────────────────────────────
  if (!simStarted && !simFinished) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: C.bg0 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text style={{ fontSize: 10, color: C.text3, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 16 }}>
          Simulados disponíveis
        </Text>
        {simLoading && <View style={{ alignItems: "center", padding: 20 }}><Spinner /></View>}
        {simError && <Text style={{ color: C.red, fontSize: 13, marginBottom: 16 }}>{simError}</Text>}
        {packsLoad ? (
          <View style={{ alignItems: "center", padding: 40 }}><Spinner /></View>
        ) : packs.length === 0 ? (
          <View style={{ alignItems: "center", padding: 40 }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>⏳</Text>
            <Text style={{ fontWeight: "700", color: C.text, marginBottom: 4 }}>Nenhum simulado disponível</Text>
            <Text style={{ fontSize: 12, color: C.text3, textAlign: "center" }}>O administrador ainda não gerou simulados para este agente.</Text>
          </View>
        ) : packs.map(p => {
          const label = p.size <= 30 ? "Rápido · ~25 min" : p.size <= 50 ? "Médio · ~45 min" : "Completo · ~90 min";
          const color = p.size <= 30 ? C.green : p.size <= 50 ? C.amber : C.blue;
          const date  = new Date(p.created_at).toLocaleDateString("pt-BR");
          return (
            <View key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 14, marginBottom: 10 }}>
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: color + "18", borderWidth: 1, borderColor: color + "44", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color }}>{p.size}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", fontSize: 14, color: C.text }}>{p.name}</Text>
                <Text style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{label} · {date}</Text>
              </View>
              <TouchableOpacity onPress={() => startPack(p.id)} activeOpacity={0.75}
                style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.amber, borderRadius: 10 }}>
                <Text style={{ fontWeight: "700", fontSize: 13, color: "#000" }}>Iniciar</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    );
  }

  // ── Questão ───────────────────────────────────────────────────
  if (simStarted && !simFinished) {
    const q        = simQs[simIdx];
    const progress = (simIdx / simQs.length) * 100;
    return (
      <View style={{ flex: 1, backgroundColor: C.bg0 }}>
        <View style={{ padding: 12, paddingHorizontal: 16, backgroundColor: C.bg1, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: C.text2 }}>Q{simIdx + 1}/{simQs.length} · {fmtTime(simTime)}</Text>
            <Badge color={area.color}>{banca.abbr}</Badge>
          </View>
          <View style={{ height: 3, backgroundColor: C.bg3, borderRadius: 99 }}>
            <View style={{ height: 3, width: `${progress}%`, backgroundColor: area.color, borderRadius: 99 }} />
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <View style={{ backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 14 }}>
            {q.materia && <Text style={{ fontSize: 11, color: C.amber, fontWeight: "700", marginBottom: 6 }}>{q.materia}</Text>}
            <Text style={{ fontSize: 14, color: C.text, lineHeight: 22 }}>{q.enunciado}</Text>
          </View>
          <View style={{ gap: 8 }}>
            {q.alternativas?.map(alt => {
              const letter = alt[0];
              return (
                <TouchableOpacity key={letter} onPress={() => answerSim(letter)} activeOpacity={0.75}
                  style={{ flexDirection: "row", gap: 10, padding: 13, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 10, alignItems: "flex-start" }}>
                  <Text style={{ fontFamily: "monospace", fontSize: 12, color: C.text, marginTop: 1, flexShrink: 0 }}>{letter})</Text>
                  <Text style={{ flex: 1, fontSize: 13, color: C.text, lineHeight: 20 }}>{alt.slice(3)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Resultado final ───────────────────────────────────────────
  if (simFinished) {
    const correct  = simQs.filter((q, i) => simAnswers[i] === q.correta).length;
    const pct      = Math.round(correct / simQs.length * 100);
    const pctColor = pct >= 70 ? C.green : pct >= 50 ? C.amber : C.red;
    return (
      <ScrollView style={{ flex: 1, backgroundColor: C.bg0 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={{ backgroundColor: C.bg2, borderWidth: 1, borderColor: C.amberB, borderRadius: 16, padding: 20, marginBottom: 16, alignItems: "center" }}>
          <Text style={{ fontSize: 52, fontWeight: "800", color: pctColor }}>{pct}%</Text>
          <Text style={{ fontSize: 14, color: C.text2, marginTop: 8 }}>{correct}/{simQs.length} acertos · {fmtTime(simTime)}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <Btn onPress={() => { setSimStarted(false); setSimFinished(false); }} style={{ flex: 1 }}>
            <Text style={{ fontWeight: "700", fontSize: 14, color: "#000" }}>← Voltar</Text>
          </Btn>
          <Btn variant="secondary" onPress={() => setReviewData(true)} style={{ flex: 1 }}>
            <Text style={{ fontWeight: "700", fontSize: 14, color: C.text2 }}>📋 Gabarito</Text>
          </Btn>
        </View>

        {reviewData && simQs.map((q, i) => {
          const ok   = simAnswers[i] === q.correta;
          const expl = reviewed[i];
          return (
            <View key={i} style={{ backgroundColor: C.bg2, borderWidth: 1, borderColor: ok ? C.greenB : C.redB, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: C.blue + "22" }}>
                  <Text style={{ fontSize: 10, color: C.blue, fontWeight: "700" }}>Q{i + 1}</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: "700", color: ok ? C.green : C.red }}>
                  {ok ? "✓" : "✗"} {simAnswers[i] || "—"} → {q.correta}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: C.text, lineHeight: 18, marginBottom: 8 }} numberOfLines={3}>
                {q.enunciado}
              </Text>
              {!ok && !expl && (
                <TouchableOpacity onPress={() => explainError(i)} disabled={reviewing === i}>
                  <Text style={{ fontSize: 11, color: C.blue }}>
                    {reviewing === i ? "Analisando…" : "🤖 Explicar erro"}
                  </Text>
                </TouchableOpacity>
              )}
              {expl && (
                <View style={{ backgroundColor: C.bg3, borderRadius: 8, padding: 10, marginTop: 8 }}>
                  <Text style={{ fontSize: 12, color: C.text2, lineHeight: 18 }}>{expl}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  }

  return null;
}
