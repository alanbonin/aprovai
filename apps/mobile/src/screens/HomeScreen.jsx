import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useAgent } from "../hooks/useAgent";
import { C } from "../constants/colors";
import { Spinner, ProgressBar } from "../components/UI";

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { activeAgent, clearAgent, fetchStats } = useAgent();
  const { area, banca } = activeAgent;

  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [area.id, banca.id]);

  const answered = stats?.answered || 0;
  const correct  = stats?.correct  || 0;
  const pct      = answered > 0 ? Math.round(correct / answered * 100) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg0 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

      {/* Agente ativo */}
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 14,
        padding: 16, backgroundColor: C.bg2,
        borderWidth: 1, borderColor: area.color + "33",
        borderRadius: 16, marginBottom: 20,
      }}>
        <View style={{
          width: 52, height: 52, borderRadius: 14,
          backgroundColor: area.color + "18", borderWidth: 1, borderColor: area.color + "44",
          alignItems: "center", justifyContent: "center",
        }}>
          <Text style={{ fontSize: 26 }}>{area.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: C.text }}>{area.name}</Text>
          <Text style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>
            <Text style={{ color: banca.color, fontWeight: "700" }}>{banca.name}</Text>
            {" · "}{user?.username}
          </Text>
        </View>
        <TouchableOpacity onPress={clearAgent}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: C.border, borderRadius: 8 }}>
          <Text style={{ fontSize: 11, color: C.text3 }}>Trocar</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {loading ? (
        <View style={{ alignItems: "center", paddingVertical: 20 }}><Spinner /></View>
      ) : (
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Respondidas", val: answered,  color: C.blue  },
            { label: "Acertos",     val: correct,   color: C.green },
            { label: "Aproveit.",   val: pct + "%", color: pct >= 70 ? C.green : pct >= 50 ? C.amber : C.red },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, alignItems: "center" }}>
              <Text style={{ fontSize: 26, fontWeight: "800", color: s.color, fontVariant: ["tabular-nums"] }}>{s.val}</Text>
              <Text style={{ fontSize: 10, color: C.text3, marginTop: 6, textTransform: "uppercase", letterSpacing: 0.6 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Dica */}
      <View style={{
        backgroundColor: banca.color + "0d", borderWidth: 1, borderColor: banca.color + "2a",
        borderRadius: 14, padding: 14, marginBottom: 20,
      }}>
        <Text style={{ fontSize: 11, color: banca.color, fontWeight: "700", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 }}>
          💡 Estratégia {banca.name}
        </Text>
        <Text style={{ fontSize: 13, color: C.text2, lineHeight: 20 }}>{banca.tip}</Text>
      </View>

      {/* Matérias */}
      <Text style={{ fontSize: 10, color: C.text3, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
        Matérias do agente
      </Text>
      <View style={{ gap: 8, marginBottom: 20 }}>
        {area.subjects.map(subj => {
          const subjStat = stats?.bySubject?.[subj] || { answered: 0, correct: 0 };
          const sp = subjStat.answered > 0 ? Math.round(subjStat.correct / subjStat.answered * 100) : 0;
          return (
            <TouchableOpacity key={subj}
              onPress={() => navigation.navigate("Study", { subject: subj })}
              activeOpacity={0.75}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 4 }}>{subj}</Text>
                <ProgressBar pct={sp} color={sp >= 70 ? C.green : sp >= 50 ? C.amber : C.blue} height={3} />
              </View>
              <Text style={{ fontSize: 11, color: C.text3, fontVariant: ["tabular-nums"] }}>
                {subjStat.answered > 0 ? sp + "%" : "—"}
              </Text>
              <Text style={{ fontSize: 16, color: C.text3 }}>→</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Atalhos */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity onPress={() => navigation.navigate("Study")} activeOpacity={0.75}
          style={{ flex: 1, padding: 16, backgroundColor: C.amberD, borderWidth: 1, borderColor: C.amberB, borderRadius: 14, alignItems: "center" }}>
          <Text style={{ color: C.amber, fontWeight: "700", fontSize: 13 }}>📖 Estudar agora</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Simulado")} activeOpacity={0.75}
          style={{ flex: 1, padding: 16, backgroundColor: C.blueD, borderWidth: 1, borderColor: C.blue + "33", borderRadius: 14, alignItems: "center" }}>
          <Text style={{ color: C.blue, fontWeight: "700", fontSize: 13 }}>🎯 Simulado</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}
