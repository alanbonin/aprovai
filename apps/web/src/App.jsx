import { useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { AgentProvider, useAgent } from "./hooks/useAgent";
import { C } from "./constants/colors";
import { LoadScreen } from "./components/UI";
import BottomTabs      from "./components/BottomTabs";
import LoginScreen     from "./screens/LoginScreen";
import AgentSelectScreen from "./screens/AgentSelectScreen";
import HomeScreen      from "./screens/HomeScreen";
import StudyScreen     from "./screens/StudyScreen";
import SimuladoScreen  from "./screens/SimuladoScreen";
import ProfileScreen   from "./screens/ProfileScreen";

// Placeholder flashcard screen
function FlashScreen() {
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.text2 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🃏</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Flashcards</div>
        <div style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>Em breve</div>
      </div>
    </div>
  );
}

function AppShell() {
  const { user, loading } = useAuth();
  const { activeAgent }   = useAgent();
  const [tab, setTab]     = useState("home");
  const [studyParams, setStudyParams] = useState({});

  if (loading) return <LoadScreen msg="Carregando AprovAI..." />;
  if (!user)   return <LoginScreen />;
  if (!activeAgent) return <AgentSelectScreen />;

  function handleNavigate(target, params = {}) {
    if (target === "study") setStudyParams(params);
    setTab(target);
  }

  const renderScreen = () => {
    switch(tab) {
      case "home":     return <HomeScreen onNavigate={handleNavigate} />;
      case "study":    return <StudyScreen initSubject={studyParams.subject} key={studyParams.subject} />;
      case "flash":    return <FlashScreen />;
      case "simulado": return <SimuladoScreen />;
      case "profile":  return <ProfileScreen />;
      default:         return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg0 }}>
      {/* Screen */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {renderScreen()}
      </div>
      {/* Bottom nav */}
      <BottomTabs active={tab} onChange={t => { setTab(t); if (t !== "study") setStudyParams({}); }} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AgentProvider>
        <AppShell />
      </AgentProvider>
    </AuthProvider>
  );
}
