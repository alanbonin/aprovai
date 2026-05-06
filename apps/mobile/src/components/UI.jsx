import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { C } from "../constants/colors";

export function Spinner({ size = 24, color = C.amber }) {
  return <ActivityIndicator size={size > 20 ? "large" : "small"} color={color} />;
}

export function ProgressBar({ pct, color = C.amber, height = 4 }) {
  return (
    <View style={{ height, backgroundColor: C.bg3, borderRadius: 99 }}>
      <View style={{
        height, width: `${Math.min(100, Math.max(0, pct))}%`,
        backgroundColor: color, borderRadius: 99,
      }} />
    </View>
  );
}

export function Badge({ color = C.blue, children }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: color + "22", borderWidth: 1, borderColor: color + "44" }}>
      <Text style={{ fontSize: 10, fontWeight: "700", color }}>{children}</Text>
    </View>
  );
}

export function Btn({ onPress, disabled, variant = "primary", children, style }) {
  const isPrimary   = variant === "primary";
  const isDanger    = variant === "danger";
  const isSecondary = variant === "secondary";

  const bg     = isPrimary ? C.amber : isDanger ? C.redD : C.bg2;
  const border  = isPrimary ? "transparent" : isDanger ? C.redB : C.border;
  const txtColor = isPrimary ? "#000" : isDanger ? C.red : C.text2;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[{
        paddingVertical: 13, paddingHorizontal: 20,
        backgroundColor: bg,
        borderWidth: 1, borderColor: border,
        borderRadius: 12,
        alignItems: "center", justifyContent: "center",
        opacity: disabled ? 0.5 : 1,
      }, style]}
    >
      {typeof children === "string" ? (
        <Text style={{ color: txtColor, fontWeight: "700", fontSize: 14 }}>{children}</Text>
      ) : children}
    </TouchableOpacity>
  );
}

export function LoadScreen({ msg = "Carregando…" }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg0, alignItems: "center", justifyContent: "center", gap: 16 }}>
      <Spinner size={36} />
      <Text style={{ color: C.text2, fontSize: 13 }}>{msg}</Text>
    </View>
  );
}

export function ErrorMsg({ children }) {
  return (
    <View style={{ padding: 14, backgroundColor: C.redD, borderWidth: 1, borderColor: C.redB, borderRadius: 10 }}>
      <Text style={{ color: C.red, fontSize: 13 }}>{children}</Text>
    </View>
  );
}

export function SectionLabel({ children }) {
  return (
    <Text style={{ fontSize: 10, color: C.text3, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
      {children}
    </Text>
  );
}
