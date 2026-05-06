import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated } from "react-native";
import { useAgent } from "../hooks/useAgent";
import { C } from "../constants/colors";
import { Spinner, Btn } from "../components/UI";

export default function FlashScreen() {
  const { activeAgent, fetchFlashcards, fetchFlashcardSubjects } = useAgent();
  const { area, banca } = activeAgent;

  const [screen,   setScreen]   = useState("subjects");
  const [subject,  setSubject]  = useState(null);
  const [cards,    setCards]    = useState([]);
  const [idx,      setIdx]      = useState(0);
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [subsLoad, setSubsLoad] = useState(true);
  const [flipped,  setFlipped]  = useState(false);

  // Flip animation
  const flipAnim = useRef(new Animated.Value(0)).current;
  const frontRot = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  const backRot  = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });

  useEffect(() => {
    fetchFlashcardSubjects()
      .then(d => setSubjects(d.subjects || []))
      .catch(() => {})
      .finally(() => setSubsLoad(false));
  }, [area.id, banca.id]);

  async function startSubject(subj) {
    setSubject(subj);
    setLoading(true); setError(null);
    try {
      const d = await fetchFlashcards(subj);
      if (!d.cards?.length) throw new Error("Nenhum flashcard disponível para esta matéria.");
      const shuffled = [...d.cards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setIdx(0); setResults([]); setFlipped(false);
      flipAnim.setValue(0);
      setScreen("study");
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  function doFlip() {
    const toVal = flipped ? 0 : 1;
    Animated.spring(flipAnim, { toValue: toVal, friction: 8, tension: 10, useNativeDriver: true }).start();
    setFlipped(f => !f);
  }

  function handleResult(remembered) {
    const r = [...results, remembered ? "lembrei" : "nao"];
    setResults(r);
    if (idx + 1 >= cards.length) { setScreen("done"); return; }
    setIdx(i => i + 1);
    setFlipped(false);
    flipAnim.setValue(0);
  }

  function restart() {
    setIdx(0); setResults([]); setFlipped(false);
    flipAnim.setValue(0);
    setCards(c => [...c].sort(() => Math.random() - 0.5));
    setScreen("study");
  }

  // ── Seleção de matérias ───────────────────────────────────────
  if (screen === "subjects") {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: C.bg0 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text style={{ fontSize: 10, color: C.text3, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 16 }}>
          Flashcards por matéria
        </Text>
        {error && <Text style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{error}</Text>}
        {subsLoad ? (
          <View style={{ alignItems: "center", padding: 40 }}><Spinner /></View>
        ) : subjects.length === 0 ? (
          <View style={{ alignItems: "center", padding: 40 }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>🃏</Text>
            <Text style={{ fontWeight: "700", color: C.text, marginBottom: 4 }}>Nenhum flashcard disponível</Text>
            <Text style={{ fontSize: 12, color: C.text3, textAlign: "center" }}>O administrador ainda não gerou flashcards para este agente.</Text>
          </View>
        ) : subjects.map(s => (
          <TouchableOpacity key={s.subject} onPress={() => startSubject(s.subject)} activeOpacity={0.75}
            style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 14, marginBottom: 10 }}>
            <View style={{ width: 44, height: 44, borderRadius: 11, backgroundColor: area.color + "18", borderWidth: 1, borderColor: area.color + "33", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 20 }}>🃏</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: C.text }}>{s.subject}</Text>
              <Text style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{s.count} cards</Text>
            </View>
            <Text style={{ fontSize: 16, color: C.text3 }}>→</Text>
          </TouchableOpacity>
        ))}
        {loading && <View style={{ alignItems: "center", padding: 20 }}><Spinner /></View>}
      </ScrollView>
    );
  }

  // ── Resultado final ───────────────────────────────────────────
  if (screen === "done") {
    const lembrei = results.filter(r => r === "lembrei").length;
    const pct = Math.round(lembrei / cards.length * 100);
    const pctColor = pct >= 70 ? C.green : pct >= 50 ? C.amber : C.red;
    return (
      <View style={{ flex: 1, backgroundColor: C.bg0, alignItems: "center", justifyContent: "center", padding: 24, gap: 20 }}>
        <View style={{ alignItems: "center", backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 28, width: "100%" }}>
          <Text style={{ fontSize: 52, fontWeight: "800", color: pctColor }}>{pct}%</Text>
          <Text style={{ fontSize: 14, color: C.text2, marginTop: 10 }}>{lembrei}/{cards.length} lembrados</Text>
          <Text style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>{subject}</Text>
        </View>
        <Btn onPress={restart} style={{ width: "100%" }}>
          <Text style={{ fontWeight: "700", fontSize: 14, color: "#000" }}>🔄 Repetir com shuffle</Text>
        </Btn>
        <Btn onPress={() => setScreen("subjects")} variant="secondary" style={{ width: "100%" }}>
          <Text style={{ fontWeight: "700", fontSize: 14, color: C.text2 }}>← Outras matérias</Text>
        </Btn>
      </View>
    );
  }

  // ── Card flip ─────────────────────────────────────────────────
  const card = cards[idx];
  const progress = (idx / cards.length) * 100;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg0 }}>
      {/* Header */}
      <View style={{ padding: 12, paddingHorizontal: 16, backgroundColor: C.bg1, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <TouchableOpacity onPress={() => setScreen("subjects")}>
            <Text style={{ fontSize: 20, color: C.text2 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: C.text2 }}>{idx + 1}/{cards.length}</Text>
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: area.color + "22" }}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: area.color }}>{subject?.split(" ")[0]}</Text>
          </View>
        </View>
        <View style={{ height: 3, backgroundColor: C.bg3, borderRadius: 99 }}>
          <View style={{ height: 3, width: `${progress}%`, backgroundColor: area.color, borderRadius: 99 }} />
        </View>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20, gap: 20 }}>
        {/* Flip card */}
        <TouchableOpacity onPress={doFlip} activeOpacity={0.9}
          style={{ width: "100%", height: 240 }}>
          {/* Frente */}
          <Animated.View style={{
            position: "absolute", width: "100%", height: "100%",
            backfaceVisibility: "hidden",
            transform: [{ rotateY: frontRot }],
            backgroundColor: C.bg2, borderWidth: 2, borderColor: area.color + "44",
            borderRadius: 20, padding: 24, alignItems: "center", justifyContent: "center", gap: 12,
          }}>
            <Text style={{ fontSize: 10, color: area.color, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" }}>Frente</Text>
            <Text style={{ fontSize: 16, color: C.text, textAlign: "center", lineHeight: 24 }}>{card.front}</Text>
            <Text style={{ fontSize: 11, color: C.text3 }}>Toque para virar</Text>
          </Animated.View>

          {/* Verso */}
          <Animated.View style={{
            position: "absolute", width: "100%", height: "100%",
            backfaceVisibility: "hidden",
            transform: [{ rotateY: backRot }],
            backgroundColor: C.bg2, borderWidth: 2, borderColor: C.green + "55",
            borderRadius: 20, padding: 24, alignItems: "center", justifyContent: "center", gap: 12,
          }}>
            <Text style={{ fontSize: 10, color: C.green, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" }}>Resposta</Text>
            <Text style={{ fontSize: 16, color: C.text, textAlign: "center", lineHeight: 24 }}>{card.back}</Text>
          </Animated.View>
        </TouchableOpacity>

        {/* Botões após virar */}
        {flipped && (
          <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
            <TouchableOpacity onPress={() => handleResult(false)} activeOpacity={0.75}
              style={{ flex: 1, padding: 14, backgroundColor: C.redD, borderWidth: 1, borderColor: C.redB, borderRadius: 14, alignItems: "center" }}>
              <Text style={{ color: C.red, fontWeight: "700", fontSize: 13 }}>✗ Não lembrei</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleResult(true)} activeOpacity={0.75}
              style={{ flex: 1, padding: 14, backgroundColor: C.greenD, borderWidth: 1, borderColor: C.greenB, borderRadius: 14, alignItems: "center" }}>
              <Text style={{ color: C.green, fontWeight: "700", fontSize: 13 }}>✓ Lembrei!</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
