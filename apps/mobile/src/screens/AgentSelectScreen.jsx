import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useAgent } from "../hooks/useAgent";
import { C } from "../constants/colors";
import { Btn } from "../components/UI";
import { AREAS, BANCAS } from "../../../../packages/shared/src/agents.js";

export default function AgentSelectScreen() {
  const { agents } = useAuth();
  const { selectAgent } = useAgent();
  const [step,       setStep]       = useState("area");  // "area" | "banca"
  const [chosenArea, setChosenArea] = useState(null);

  function pickArea(area) {
    setChosenArea(area);
    setStep("banca");
  }

  async function pickBanca(banca) {
    await selectAgent(chosenArea, banca);
  }

  const ownedSet = new Set(agents.map(a => `${a.area_id}__${a.banca_id}`));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg0 }}>
      {/* Header */}
      <View style={{ padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: C.border }}>
        {step === "banca" && (
          <TouchableOpacity onPress={() => setStep("area")} style={{ marginBottom: 12 }}>
            <Text style={{ color: C.text2, fontSize: 14 }}>← Voltar</Text>
          </TouchableOpacity>
        )}
        <Text style={{ fontSize: 22, fontWeight: "800", color: C.text }}>
          {step === "area" ? "Escolha a área" : chosenArea?.name}
        </Text>
        <Text style={{ fontSize: 13, color: C.text3, marginTop: 4 }}>
          {step === "area" ? "Qual concurso você vai prestar?" : "Selecione a banca examinadora"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {step === "area" ? (
          AREAS.map(area => {
            const owned = agents.some(a => a.area_id === area.id);
            return (
              <TouchableOpacity key={area.id} onPress={() => pickArea(area)} activeOpacity={0.75}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 14,
                  padding: 16, backgroundColor: C.bg2,
                  borderWidth: 1, borderColor: owned ? area.color + "55" : C.border,
                  borderRadius: 14,
                }}>
                <View style={{
                  width: 48, height: 48, borderRadius: 12,
                  backgroundColor: area.color + "18", alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 22 }}>{area.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: C.text }}>{area.name}</Text>
                  <Text style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{area.cargos.slice(0, 2).join(" · ")}</Text>
                </View>
                {owned && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: C.green + "22", borderRadius: 6, borderWidth: 1, borderColor: C.greenB }}>
                    <Text style={{ fontSize: 10, color: C.green, fontWeight: "700" }}>Ativo</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          BANCAS.map(banca => {
            const owned = ownedSet.has(`${chosenArea.id}__${banca.id}`);
            return (
              <TouchableOpacity key={banca.id} onPress={() => pickBanca(banca)} activeOpacity={0.75}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 14,
                  padding: 16, backgroundColor: C.bg2,
                  borderWidth: 1, borderColor: owned ? banca.color + "55" : C.border,
                  borderRadius: 14,
                }}>
                <View style={{
                  width: 48, height: 48, borderRadius: 12,
                  backgroundColor: banca.color + "18", alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: banca.color }}>{banca.abbr}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: C.text }}>{banca.name}</Text>
                  <Text style={{ fontSize: 11, color: C.text3, marginTop: 2 }} numberOfLines={1}>{banca.tip}</Text>
                </View>
                {owned && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: C.green + "22", borderRadius: 6, borderWidth: 1, borderColor: C.greenB }}>
                    <Text style={{ fontSize: 10, color: C.green, fontWeight: "700" }}>Ativo</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}
