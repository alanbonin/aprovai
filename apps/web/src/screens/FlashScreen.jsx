import { useState, useEffect } from "react";
import { useAgent } from "../hooks/useAgent";
import { C } from "../constants/colors";
import { Spinner, Badge, Btn } from "../components/UI";
import { api } from "../api/client";

export default function FlashScreen() {
  const { activeAgent, fetchFlashcards } = useAgent();
  const { area, banca } = activeAgent;

  const [screen, setScreen]   = useState("subjects"); // subjects | study | done
  const [subject, setSubject] = useState(null);
  const [cards, setCards]     = useState([]);
  const [idx, setIdx]         = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [results, setResults] = useState([]); // "lembrei" | "nao"

  const [subjectList, setSubjectList] = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/flashcards/subjects?areaId=${area.id}&bancaId=${banca.id}`)
      .then(d => setSubjectList(d.subjects || []))
      .catch(() => setSubjectList([]))
      .finally(() => setSubsLoading(false));
  }, [area.id, banca.id]);

  async function startSubject(subj) {
    setSubject(subj);
    setLoading(true); setError(null);
    try {
      const d = await fetchFlashcards(subj);
      if (!d.cards?.length) throw new Error("Nenhum flashcard disponível para esta matéria.");
      // Shuffle cards
      const shuffled = [...d.cards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setIdx(0);
      setFlipped(false);
      setResults([]);
      setScreen("study");
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  function handleResult(remembered) {
    const r = [...results, remembered ? "lembrei" : "nao"];
    setResults(r);
    if (idx + 1 >= cards.length) {
      setScreen("done");
    } else {
      setIdx(i => i + 1);
      setFlipped(false);
    }
  }

  function restart() {
    setScreen("study");
    setIdx(0);
    setFlipped(false);
    setResults([]);
    setCards(c => [...c].sort(() => Math.random() - 0.5));
  }

  // ── Seleção de matérias ───────────────────────────────────────
  if (screen === "subjects") {
    return (
      <div style={{ height: "100%", overflowY: "auto", padding: "20px 16px" }}>
        <div style={{ fontSize: 10, color: C.text3, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
          Flashcards por matéria
        </div>

        {error && <div style={{ fontSize: 13, color: C.red, marginBottom: 12 }}>{error}</div>}

        {subsLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
        ) : subjectList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.text2 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🃏</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Nenhum flashcard disponível</div>
            <div style={{ fontSize: 12, color: C.text3 }}>O administrador ainda não gerou flashcards para este agente.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {subjectList.map(s => (
              <button key={s.subject} onClick={() => startSubject(s.subject)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 18px", background: C.bg2,
                  border: `1px solid ${C.border}`, borderRadius: 14,
                  cursor: "pointer", textAlign: "left",
                }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: area.color + "18", border: `1px solid ${area.color}33`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>
                  🃏
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.subject}</div>
                  <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{s.count} cards</div>
                </div>
                <div style={{ fontSize: 16, color: C.text3 }}>→</div>
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><Spinner /></div>
        )}
        <div style={{ height: 24 }} />
      </div>
    );
  }

  // ── Resultado final ───────────────────────────────────────────
  if (screen === "done") {
    const lembrei = results.filter(r => r === "lembrei").length;
    const pct = Math.round(lembrei / cards.length * 100);
    const pctColor = pct >= 70 ? C.green : pct >= 50 ? C.amber : C.red;
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 20 }}>
        <div style={{ textAlign: "center", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 20, padding: "28px 32px", width: "100%", maxWidth: 320 }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: pctColor, fontFamily: "monospace", lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 14, color: C.text2, marginTop: 10 }}>{lembrei}/{cards.length} lembrados</div>
          <div style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>{subject}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
          <Btn onClick={restart}>🔄 Repetir com shuffle</Btn>
          <Btn variant="secondary" onClick={() => setScreen("subjects")}>← Outras matérias</Btn>
        </div>
      </div>
    );
  }

  // ── Card flip ─────────────────────────────────────────────────
  const card    = cards[idx];
  const progress = ((idx) / cards.length) * 100;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", background: C.bg1, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <button onClick={() => setScreen("subjects")}
            style={{ background: "none", border: "none", color: C.text2, cursor: "pointer", fontSize: 20, padding: 0 }}>←</button>
          <div style={{ fontSize: 12, color: C.text2 }}>{idx + 1}/{cards.length}</div>
          <Badge color={area.color}>{subject?.split(" ")[0]}</Badge>
        </div>
        {/* Progress bar manual */}
        <div style={{ height: 3, background: C.bg3, borderRadius: 99 }}>
          <div style={{ height: "100%", width: `${progress}%`, background: area.color, borderRadius: 99, transition: "width .3s" }} />
        </div>
      </div>

      {/* Card area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, gap: 20 }}>
        {/* Flip card */}
        <div
          onClick={() => setFlipped(f => !f)}
          style={{
            width: "100%", maxWidth: 400, minHeight: 220,
            cursor: "pointer", perspective: "1000px",
          }}
        >
          <div style={{
            position: "relative", width: "100%", minHeight: 220,
            transformStyle: "preserve-3d",
            transition: "transform 0.5s cubic-bezier(.4,2,.6,1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}>
            {/* Frente */}
            <div style={{
              position: "absolute", inset: 0,
              backfaceVisibility: "hidden",
              background: C.bg2, border: `2px solid ${area.color}44`,
              borderRadius: 20, padding: "24px 20px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
            }}>
              <div style={{ fontSize: 10, color: area.color, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Frente</div>
              <div style={{ fontSize: 15, color: C.text, textAlign: "center", lineHeight: 1.7 }}>{card.front}</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>Toque para virar</div>
            </div>

            {/* Verso */}
            <div style={{
              position: "absolute", inset: 0,
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: C.bg2, border: `2px solid ${C.green}55`,
              borderRadius: 20, padding: "24px 20px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
            }}>
              <div style={{ fontSize: 10, color: C.green, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Resposta</div>
              <div style={{ fontSize: 15, color: C.text, textAlign: "center", lineHeight: 1.7 }}>{card.back}</div>
            </div>
          </div>
        </div>

        {/* Botões de resultado — aparecem após virar */}
        {flipped && (
          <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 400, animation: "fadeUp .2s ease" }}>
            <button onClick={() => handleResult(false)}
              style={{
                flex: 1, padding: "14px 10px", background: C.redD,
                border: `1px solid ${C.redB}`, borderRadius: 14,
                color: C.red, fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>
              ✗ Não lembrei
            </button>
            <button onClick={() => handleResult(true)}
              style={{
                flex: 1, padding: "14px 10px", background: C.greenD,
                border: `1px solid ${C.greenB}`, borderRadius: 14,
                color: C.green, fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>
              ✓ Lembrei!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
