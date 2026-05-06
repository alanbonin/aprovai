import { C } from "../constants/colors";

const TABS = [
  { id: "home",      icon: "🏠", label: "Início"     },
  { id: "study",     icon: "📖", label: "Estudar"    },
  { id: "flash",     icon: "🃏", label: "Flashcards" },
  { id: "simulado",  icon: "🎯", label: "Simulado"   },
  { id: "profile",   icon: "👤", label: "Perfil"     },
];

export default function BottomTabs({ active, onChange }) {
  return (
    <nav className="safe-bottom" style={{
      display: "flex", background: C.bg1,
      borderTop: `1px solid ${C.border}`,
      flexShrink: 0,
    }}>
      {TABS.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            style={{
              flex: 1, padding: "10px 4px 6px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              background: "none", border: "none", cursor: "pointer",
              transition: "opacity .15s",
            }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{
              fontSize: 10, fontWeight: isActive ? 700 : 400,
              color: isActive ? C.amber : C.text3,
              transition: "color .15s",
            }}>
              {t.label}
            </span>
            {isActive && (
              <div style={{
                position: "absolute", bottom: 0, width: 32, height: 2,
                background: C.amber, borderRadius: 2,
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
