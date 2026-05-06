import { View, Text, TouchableOpacity, ScrollView, Linking } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useAgent } from "../hooks/useAgent";
import { C } from "../constants/colors";
import { Btn } from "../components/UI";
import { AREAS, BANCAS } from "../../../../packages/shared/src/agents.js";
import { api } from "../api/client";
import { useState } from "react";

export default function ProfileScreen() {
  const { user, agents, logout }        = useAuth();
  const { activeAgent, selectAgent }    = useAgent();
  const [portalLoad, setPortalLoad]     = useState(false);

  async function openBillingPortal() {
    setPortalLoad(true);
    try {
      const { url } = await api.get("/api/payments/portal");
      if (url) await Linking.openURL(url);
    } catch {}
    setPortalLoad(false);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg0 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

      {/* Usuário */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 18, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 16, marginBottom: 20 }}>
        <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: C.amber, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#000" }}>{user?.username?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 16, color: C.text }}>{user?.username}</Text>
          <Text style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{user?.email}</Text>
        </View>
      </View>

      {/* Agentes */}
      <Text style={{ fontSize: 10, color: C.text3, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
        Meus agentes ({agents.length})
      </Text>
      <View style={{ gap: 10, marginBottom: 24 }}>
        {agents.length === 0 ? (
          <Text style={{ textAlign: "center", paddingVertical: 20, color: C.text3, fontSize: 13 }}>Nenhum agente contratado.</Text>
        ) : agents.map(a => {
          const area  = AREAS.find(x => x.id === a.area_id);
          const banca = BANCAS.find(x => x.id === a.banca_id);
          if (!area || !banca) return null;
          const isActive = activeAgent?.area.id === area.id && activeAgent?.banca.id === banca.id;
          return (
            <View key={`${a.area_id}__${a.banca_id}`}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: C.bg2, borderWidth: 1, borderColor: isActive ? area.color + "55" : C.border, borderRadius: 14 }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: area.color + "18", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 20 }}>{area.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", fontSize: 13, color: C.text }}>{area.name}</Text>
                <Text style={{ fontSize: 11, color: banca.color }}>{banca.name}</Text>
              </View>
              {isActive ? (
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: C.green + "22", borderRadius: 6, borderWidth: 1, borderColor: C.greenB }}>
                  <Text style={{ fontSize: 10, color: C.green, fontWeight: "700" }}>Ativo</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={() => selectAgent(area, banca)}
                  style={{ paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.blue + "44", borderRadius: 7 }}>
                  <Text style={{ fontSize: 11, color: C.blue }}>Ativar</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* Assinatura */}
      <Text style={{ fontSize: 10, color: C.text3, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
        Assinatura
      </Text>
      <Btn variant="secondary" onPress={openBillingPortal} disabled={portalLoad} style={{ marginBottom: 10 }}>
        <Text style={{ fontWeight: "700", fontSize: 14, color: C.text2 }}>
          {portalLoad ? "Abrindo…" : "💳 Gerenciar assinatura"}
        </Text>
      </Btn>

      {/* Sair */}
      <Btn variant="danger" onPress={logout} style={{ marginTop: 8 }}>
        <Text style={{ fontWeight: "700", fontSize: 14, color: C.red }}>Sair da conta</Text>
      </Btn>

    </ScrollView>
  );
}
