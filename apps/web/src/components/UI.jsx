import { C } from "../constants/colors";

export function Spinner({ size = 28, color = C.amber }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      border: `2.5px solid rgba(120,160,240,0.12)`,
      borderTopColor: color, borderRadius: "50%",
      animation: "spin .7s linear infinite",
    }} />
  );
}

export function ProgressBar({ pct, color = C.amber, height = 6 }) {
  return (
    <div style={{ height, background: C.bg3, borderRadius: height, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${Math.min(100, Math.max(0, pct))}%`,
        background: color, borderRadius: height, transition: "width .3s ease",
      }} />
    </div>
  );
}

export function Badge({ children, color = C.blue }) {
  return (
    <span style={{
      fontSize: 10, padding: "2px 7px", borderRadius: 4,
      background: color + "22", color, fontWeight: 700,
      letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0,
    }}>
      {children}
    </span>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{
      background: C.bg2, border: `1px solid ${C.border}`,
      borderRadius: 16, padding: "18px 20px", ...style,
    }}>
      {children}
    </div>
  );
}

export function LoadScreen({ msg = "Carregando..." }) {
  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      background: C.bg0,
    }}>
      <Spinner size={36} />
      <div style={{ fontSize: 13, color: C.text2 }}>{msg}</div>
    </div>
  );
}

export function ErrorMsg({ children }) {
  return (
    <div style={{
      background: C.redD, border: `1px solid ${C.redB}`,
      borderRadius: 12, padding: "14px 16px",
      fontSize: 13, color: C.red, lineHeight: 1.6,
    }}>
      {children}
    </div>
  );
}

export function Btn({ children, onClick, disabled, variant = "primary", style: extra }) {
  const base = {
    padding: "13px 20px", border: "none", borderRadius: 12,
    fontSize: 14, fontWeight: 700, cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1, transition: "opacity .15s",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  };
  const variants = {
    primary:   { background: `linear-gradient(135deg,${C.amber},#e8911a)`, color: "#000" },
    secondary: { background: C.bg3, border: `1px solid ${C.border}`, color: C.text2 },
    danger:    { background: C.redD, border: `1px solid ${C.redB}`, color: C.red },
    ghost:     { background: "transparent", color: C.text2 },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...extra }}>
      {children}
    </button>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <div style={{ fontSize: 12, color: C.text2, fontWeight: 600 }}>{label}</div>}
      <input
        {...props}
        style={{
          width: "100%", background: C.bg1,
          border: `1px solid ${error ? C.redB : C.border}`,
          borderRadius: 10, padding: "12px 14px",
          color: C.text, fontSize: 14, outline: "none",
          transition: "border-color .15s",
          ...props.style,
        }}
        onFocus={e => { e.target.style.borderColor = error ? C.red : C.blue; }}
        onBlur={e  => { e.target.style.borderColor = error ? C.redB : C.border; }}
      />
      {error && <div style={{ fontSize: 12, color: C.red }}>{error}</div>}
    </div>
  );
}
