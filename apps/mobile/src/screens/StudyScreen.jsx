import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useAgent } from "../hooks/useAgent";
import { C } from "../constants/colors";
import { Spinner, ProgressBar, Badge, Btn, ErrorMsg } from "../components/UI";

export default function StudyScreen({ route }) {
  const initSubject = route?.params?.subject || null;
  const { activeAgent, fetchQuestion, recordProgress, analyzeAnswer } = useAgent();
  const { area, banca } = activeAgent;

  const [subject,   setSubject]   = useState(initSubject);
  const [question,  setQuestion]  = useState(null);
  const [screen,    setScreen]    = useState(initSubject ? "loading" : "select");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [filtro,    setFiltro]    = useState("naorespondidas");
  const [chosen,    setChosen]    = useState(null);
  const [result,    setResult]    = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [elapsed,   setElapsed]   = useState(0);

  const seenIds  = useRef(new Set());
  const timerRef = useRef(null);

  useEffect(() => {
    if (initSubject) loadQuestion(initSubject);
  }, []);

  useEffect(() => {
    if (screen !== "question") return;
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, question?.id]);

  async function loadQuestion(subj) {
    setLoading(true); setScreen("loading"); setError(null);
    setQuestion(null); setChosen(null); setResult(null);
    try {
      const seen = [...seenIds.current];
      const data = await fetchQuestion(subj || subject, seen, filtro);
      if (!data.question) {
        if (filtro === "naorespondidas") {
          seenIds.current.clear();
          const retry = await fetchQuestion(subj || subject, [], "todas");
          if (retry.question) {
            seenIds.current.add(retry.question.id);
            setQuestion(retry.question); setScreen("question");
          } else {
            setError("Sem questões disponíveis para esta matéria."); setScreen("error");
          }
        } else {
          setError("Nenhuma questão encontrada com esse filtro."); setScreen("error");
        }
      } else {
        seenIds.current.add(data.question.id);
        setQuestion(data.question); setScreen("question");
      }
    } catch(e) { setError(e.message); setScreen("error"); }
    setLoading(false);
  }

  async function handleAnswer(letter) {
    if (chosen) return;
    clearInterval(timerRef.current);
    setChosen(letter);
    const acertou = letter === question.correta;
    await recordProgress(question.id, acertou, elapsed).catch(() => {});

    if (question.justificativa) {
      setResult({
        acertou,
        explicacao: question.justificativa,
        dica: `Dica ${banca.name}: ${banca.tip}`,
      });
      setScreen("result");
    } else {
      setAnalyzing(true);
      setScreen("result");
      try {
        const r = await analyzeAnswer(question, letter);
        setResult(r);
      } catch { setResult({ acertou, explicacao: "Não foi possível analisar.", erro: "", dica: "" }); }
      setAnalyzing(false);
    }
  }

  const fmtTime = t => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;

  // ── Seleção de matéria ────────────────────────────────────────
  if (screen === "select") {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: C.bg0 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text style={{ fontSize: 10, color: C.text3, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 16 }}>
          Escolha a matéria
        </Text>

        {/* Filtro */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          {[
            { id: "naorespondidas", label: "Novas"  },
            { id: "erradas",        label: "Erros"  },
            { id: "todas",          label: "Todas"  },
          ].map(f => (
            <TouchableOpacity key={f.id} onPress={() => setFiltro(f.id)} activeOpacity={0.75}
              style={{
                flex: 1, paddingVertical: 8, borderRadius: 9,
                borderWidth: 1, borderColor: filtro === f.id ? C.amberB : C.border,
                backgroundColor: filtro === f.id ? C.amberD : C.bg2,
                alignItems: "center",
              }}>
              <Text style={{ color: filtro === f.id ? C.amber : C.text2, fontSize: 12, fontWeight: filtro === f.id ? "700" : "400" }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ gap: 10 }}>
          {area.subjects.map(subj => (
            <TouchableOpacity key={subj}
              onPress={() => { setSubject(subj); loadQuestion(subj); }}
              activeOpacity={0.75}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: C.text }}>{subj}</Text>
              </View>
              <Text style={{ fontSize: 16, color: C.text3 }}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (screen === "loading") {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg0, alignItems: "center", justifyContent: "center", gap: 16 }}>
        <Spinner size={36} />
        <Text style={{ fontSize: 13, color: C.text2 }}>Buscando questão…</Text>
      </View>
    );
  }

  if (screen === "error") {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg0, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
        <ErrorMsg>{error}</ErrorMsg>
        <Btn onPress={() => setScreen("select")} variant="secondary">← Voltar</Btn>
      </View>
    );
  }

  if (!question) return null;

  const acertou = chosen ? chosen === question.correta : null;

  // ── Questão + resultado ───────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: C.bg0 }}>
      {/* Header */}
      <View style={{ padding: 12, paddingHorizontal: 16, backgroundColor: C.bg1, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <TouchableOpacity onPress={() => setScreen("select")}>
            <Text style={{ fontSize: 20, color: C.text2 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: C.text }}>{subject}</Text>
            <Text style={{ fontSize: 11, color: C.text3 }}>{banca.abbr} · {fmtTime(elapsed)}</Text>
          </View>
          <Badge color={area.color}>{area.name.split("/")[0].trim()}</Badge>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Enunciado */}
        <View style={{ backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 14 }}>
          {question.artigo && <Text style={{ fontSize: 11, color: C.amber, fontWeight: "700", marginBottom: 8 }}>{question.artigo}</Text>}
          <Text style={{ fontSize: 14, color: C.text, lineHeight: 22 }}>{question.enunciado}</Text>
        </View>

        {/* Alternativas */}
        <View style={{ gap: 8, marginBottom: 16 }}>
          {question.alternativas?.map(alt => {
            const letter    = alt[0];
            const isCorrect = letter === question.correta;
            const isChosen  = letter === chosen;
            const revealed  = !!chosen;
            let bg     = C.bg2,   border = C.border, color = C.text;
            if (revealed && isCorrect)            { bg = C.greenD; border = C.greenB; color = C.green; }
            if (revealed && isChosen && !isCorrect) { bg = C.redD;   border = C.redB;   color = C.red;   }
            return (
              <TouchableOpacity key={letter}
                onPress={() => handleAnswer(letter)}
                disabled={!!chosen}
                activeOpacity={0.75}
                style={{ flexDirection: "row", gap: 10, padding: 13, backgroundColor: bg, borderWidth: 1, borderColor: border, borderRadius: 10, alignItems: "flex-start" }}>
                <Text style={{ fontFamily: "monospace", fontSize: 12, color, marginTop: 1, flexShrink: 0 }}>{letter})</Text>
                <Text style={{ flex: 1, fontSize: 13, color, lineHeight: 20, fontWeight: (revealed && (isCorrect || isChosen)) ? "700" : "400" }}>
                  {alt.slice(3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Resultado */}
        {(screen === "result") && (
          <View>
            {analyzing ? (
              <View style={{ flexDirection: "row", gap: 10, alignItems: "center", padding: 14, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 12 }}>
                <Spinner size={16} />
                <Text style={{ fontSize: 13, color: C.text2 }}>Analisando com IA…</Text>
              </View>
            ) : result && (
              <View style={{
                backgroundColor: acertou ? C.greenD : C.redD,
                borderWidth: 1, borderColor: acertou ? C.greenB : C.redB,
                borderRadius: 14, padding: 16,
              }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: acertou ? C.green : C.red, marginBottom: 10 }}>
                  {acertou ? "✓ Correto!" : "✗ Errado"}
                </Text>
                {result.explicacao ? (
                  <Text style={{ fontSize: 13, color: C.text, lineHeight: 20, marginBottom: result.dica ? 10 : 0 }}>
                    {result.explicacao}
                  </Text>
                ) : null}
                {result.dica ? (
                  <View style={{ backgroundColor: C.bg3, borderRadius: 8, padding: 10 }}>
                    <Text style={{ fontSize: 12, color: C.text2, lineHeight: 18 }}>💡 {result.dica}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {!analyzing && (
              <Btn onPress={() => loadQuestion()} style={{ marginTop: 12 }}>
                <Text style={{ fontWeight: "700", fontSize: 14, color: "#000" }}>Próxima questão →</Text>
              </Btn>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
