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
import FlashScreen     from "./screens/FlashScreen";
import AdminScreen     from "./screens/AdminScreen";

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
      case "admin":    return <AdminScreen />;
      default:         return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg0 }}>
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {renderScreen()}
      </div>
      <BottomTabs active={tab} onChange={t => { setTab(t); if (t !== "study") setStudyParams({}); }} isAdmin={user?.is_admin} />
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
