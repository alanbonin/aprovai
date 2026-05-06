import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { C } from "../constants/colors";
import { Btn, Spinner } from "../components/UI";

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [tab,      setTab]      = useState("login");
  const [email,    setEmail]    = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  async function handleSubmit() {
    setError(null);
    if (!email || !password) return setError("Preencha todos os campos.");
    if (tab === "register" && !username) return setError("Informe um nome de usuário.");
    setLoading(true);
    try {
      if (tab === "login") await login(email, password);
      else                 await register(email, username, password);
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg0 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <Text style={{ fontSize: 40 }}>🎓</Text>
          <Text style={{ fontSize: 28, fontWeight: "800", color: C.amber, marginTop: 8 }}>AprovAI</Text>
          <Text style={{ fontSize: 13, color: C.text3, marginTop: 4 }}>Agentes de estudo para concursos</Text>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: "row", backgroundColor: C.bg2, borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {["login", "register"].map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} activeOpacity={0.8}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center",
                backgroundColor: tab === t ? C.amberD : "transparent",
                borderWidth: tab === t ? 1 : 0, borderColor: C.amberB,
              }}>
              <Text style={{ fontWeight: tab === t ? "700" : "400", color: tab === t ? C.amber : C.text3, fontSize: 13 }}>
                {t === "login" ? "Entrar" : "Criar conta"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form */}
        <View style={{ gap: 12 }}>
          <TextInput
            value={email} onChangeText={setEmail}
            placeholder="E-mail" placeholderTextColor={C.text3}
            keyboardType="email-address" autoCapitalize="none"
            style={inputStyle}
          />
          {tab === "register" && (
            <TextInput
              value={username} onChangeText={setUsername}
              placeholder="Nome de usuário" placeholderTextColor={C.text3}
              autoCapitalize="none"
              style={inputStyle}
            />
          )}
          <TextInput
            value={password} onChangeText={setPassword}
            placeholder="Senha" placeholderTextColor={C.text3}
            secureTextEntry
            style={inputStyle}
          />
        </View>

        {error && (
          <View style={{ marginTop: 12, padding: 12, backgroundColor: C.redD, borderRadius: 10, borderWidth: 1, borderColor: C.redB }}>
            <Text style={{ color: C.red, fontSize: 13 }}>{error}</Text>
          </View>
        )}

        <Btn onPress={handleSubmit} disabled={loading} style={{ marginTop: 20 }}>
          {loading
            ? <Spinner size={18} color="#000" />
            : <Text style={{ fontWeight: "700", fontSize: 14, color: "#000" }}>{tab === "login" ? "Entrar" : "Criar conta"}</Text>
          }
        </Btn>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const inputStyle = {
  backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border,
  borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
  color: C.text, fontSize: 14,
};
