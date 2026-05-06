import { useState, useEffect, useRef } from "react";
import { useAgent } from "../hooks/useAgent";
import { C } from "../constants/colors";
import { Spinner, ProgressBar, Badge, Btn, ErrorMsg } from "../components/UI";

export default function StudyScreen({ initSubject }) {
  const { activeAgent, fetchQuestion, listQuestions, recordProgress, analyzeAnswer } = useAgent();
  const { area, banca } = activeAgent;

  const [subject, setSubject] = useState(initSubject || null);
  const [question, setQuestion] = useState(null);
  const [screen, setScreen]     = useState("select"); // "select"|"question"|"result"
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [filtro, setFiltro]     = useState("naorespondidas");

  const [chosen, setChosen]     = useState(null);    // letra escolhida
  const [result, setResult]     = useState(null);    // análise IA ou justificativa
  const [analyzing, setAnalyzing] = useState(false);

  const seenIds = useRef(new Set());
  const timerRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);

  // Timer por questão
  useEffect(() => {
    if (screen !== "question") return;
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, question?.id]);

  async function loadQuestion(subj) {
    setLoading(true); setError(null); setQuestion(null);
    setChosen(null); setResult(null);
    try {
      const seen = [...seenIds.current];
      const data = await fetchQuestion(subj || subject, seen, filtro);
      if (!data.question) {
        if (filtro === "naorespondidas") {
          seenIds.current.clear();
          const retry = await fetchQuestion(subj || subject, [], "todas");
          if (retry.question) { seenIds.current.add(retry.question.id); setQuestion(retry.question); setScreen("question"); }
          else setError("Sem questões disponíveis para esta matéria.");
        } else {
          setError("Nenhuma questão encontrada com esse filtro.");
        }
      } else {
        seenIds.current.add(data.question.id);
        setQuestion(data.question);
        setScreen("question");
      }
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  async function handleAnswer(letter) {
    if (chosen) return;
    setChosen(letter);
    clearInterval(timerRef.current);
    const acertou = letter === question.correta;

    await recordProgress(question.id, acertou, elapsed).catch(() => {});

    if (question.justificativa) {
      setResult({
        acertou,
        explicacao: question.justificativa,
        erro: acertou ? "" : `${letter} está incorreta. A correta é ${question.correta}. ${question.justificativa}`,
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

  function next() {
    loadQuestion();
  }

  // ── Tela de seleção de matéria ─────────────────────────────
  if (screen === "select") {
    return (
      <div style={{ height: "100%", overflowY: "auto", padding: "20px 16px" }}>
        <div style={{ fontSize: 10, color: C.text3, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
          Escolha a matéria
        </div>

        {/* Filtro */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[
            { id: "naorespondidas", label: "Novas" },
            { id: "erradas",        label: "Erros" },
            { id: "todas",          label: "Todas" },
          ].map(f => (
            <button key={f.id} onClick={() => setFiltro(f.id)}
              style={{
                flex: 1, padding: "8px 4px", border: `1px solid ${filtro === f.id ? C.amberB : C.border}`,
                borderRadius: 9, background: filtro === f.id ? C.amberD : C.bg2,
                color: filtro === f.id ? C.amber : C.text2, fontSize: 12,
                fontWeight: filtro === f.id ? 700 : 400, cursor: "pointer",
              }}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {area.subjects.map(subj => (
            <button key={subj}
              onClick={() => { setSubject(subj); loadQuestion(subj); }}
              style={{
                padding: "14px 16px", background: C.bg2,
                border: `1px solid ${C.border}`, borderRadius: 12,
                cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 12,
              }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{subj}</div>
              </div>
              <div style={{ fontSize: 16, color: C.text3 }}>→</div>
            </button>
          ))}
        </div>
        <div style={{ height: 24 }} />
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <Spinner size={36} />
        <div style={{ fontSize: 13, color: C.text2 }}>Buscando questão...</div>
      </div>
    );
  }

  // ── Erro ──────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
        <ErrorMsg>{error}</ErrorMsg>
        <Btn variant="secondary" onClick={() => { setError(null); setScreen("select"); }}>← Voltar</Btn>
      </div>
    );
  }

  if (!question) return null;

  const acertou = chosen ? chosen === question.correta : null;

  // ── Questão ───────────────────────────────────────────────
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", background: C.bg1, borderBottom: `1px solid ${C.border}`, flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setScreen("select")}
          style={{ background: "none", border: "none", color: C.text2, cursor: "pointer", fontSize: 20, padding: 0, lineHeight: 1 }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{subject}</div>
          <div style={{ fontSize: 11, color: C.text3 }}>{banca.abbr} · {Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,"0")}</div>
        </div>
        <Badge color={area.color}>{area.name.split("/")[0].trim()}</Badge>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

        {/* Enunciado */}
        <div style={{
          background: C.bg2, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: "16px 18px", marginBottom: 14,
        }}>
          {question.artigo && (
            <div style={{ fontSize: 11, color: C.amber, fontWeight: 700, marginBottom: 8 }}>{question.artigo}</div>
          )}
          <div style={{ fontSize: 14, color: C.text, lineHeight: 1.7 }}>{question.enunciado}</div>
        </div>

        {/* Alternativas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {question.alternativas?.map(alt => {
            const letter = alt[0];
            const isCorrect = letter === question.correta;
            const isChosen  = letter === chosen;
            const revealed  = !!chosen;
            let bg = C.bg2, border = C.border, color = C.text;
            if (revealed && isCorrect) { bg = C.greenD; border = C.greenB; color = C.green; }
            if (revealed && isChosen && !isCorrect) { bg = C.redD; border = C.redB; color = C.red; }
            return (
              <button key={letter} onClick={() => handleAnswer(letter)} disabled={!!chosen}
                style={{
                  padding: "13px 14px", background: bg, border: `1px solid ${border}`,
                  borderRadius: 10, cursor: chosen ? "default" : "pointer",
                  textAlign: "left", fontSize: 13, color, lineHeight: 1.55,
                  display: "flex", gap: 10, alignItems: "flex-start",
                  fontWeight: (revealed && (isCorrect || isChosen)) ? 700 : 400,
                  transition: "all .15s",
                }}>
                <span style={{ fontFamily: "monospace", flexShrink: 0, fontSize: 12, marginTop: 1 }}>{letter})</span>
                <span>{alt.slice(3)}</span>
              </button>
            );
          })}
        </div>

        {/* Resultado */}
        {screen === "result" && (
          <div style={{ animation: "fadeUp .2s ease" }}>
            {analyzing ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "14px 16px", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                <Spinner size={16} />
                <span style={{ fontSize: 13, color: C.text2 }}>Analisando com IA...</span>
              </div>
            ) : result && (
              <div style={{
                background: acertou ? C.greenD : C.redD,
                border: `1px solid ${acertou ? C.greenB : C.redB}`,
                borderRadius: 14, padding: "16px 18px",
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: acertou ? C.green : C.red, marginBottom: 10 }}>
                  {acertou ? "✓ Correto!" : "✗ Errado"}
                </div>
                {result.explicacao && (
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: result.dica ? 10 : 0 }}>
                    {result.explicacao}
                  </div>
                )}
                {result.dica && (
                  <div style={{ fontSize: 12, color: C.text2, background: C.bg3, borderRadius: 8, padding: "10px 12px", lineHeight: 1.6 }}>
                    💡 {result.dica}
                  </div>
                )}
              </div>
            )}

            {!analyzing && (
              <Btn onClick={next} style={{ width: "100%", marginTop: 12 }}>
                Próxima questão →
              </Btn>
            )}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
