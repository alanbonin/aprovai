import { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api/client";

const AgentContext = createContext(null);

export function AgentProvider({ children }) {
  const [activeAgent, setActiveAgent] = useState(null);
  const [agentLoaded, setAgentLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("aprovai_agent").then(raw => {
      try { if (raw) setActiveAgent(JSON.parse(raw)); } catch {}
      setAgentLoaded(true);
    });
  }, []);

  const selectAgent = useCallback(async (area, banca) => {
    const agent = { area, banca };
    setActiveAgent(agent);
    await AsyncStorage.setItem("aprovai_agent", JSON.stringify(agent));
  }, []);

  const clearAgent = useCallback(async () => {
    setActiveAgent(null);
    await AsyncStorage.removeItem("aprovai_agent");
  }, []);

  const agentParams = activeAgent
    ? `areaId=${activeAgent.area.id}&bancaId=${activeAgent.banca.id}`
    : "";

  async function fetchQuestion(subject, seen = [], filtro = "naorespondidas") {
    const seenStr = seen.length ? `&seen=${encodeURIComponent(JSON.stringify(seen))}` : "";
    const subjStr = subject ? `&subject=${encodeURIComponent(subject)}` : "";
    return api.get(`/api/questions?${agentParams}${subjStr}&filtro=${filtro}${seenStr}`);
  }

  async function recordProgress(questionId, correct, timeSecs) {
    return api.post(`/api/questions/${questionId}/progress`, { correct, timeSecs });
  }

  async function fetchFlashcards(subject) {
    return api.get(`/api/flashcards?${agentParams}&subject=${encodeURIComponent(subject)}`);
  }

  async function fetchFlashcardSubjects() {
    return api.get(`/api/flashcards/subjects?${agentParams}`);
  }

  async function fetchSavedSimulados() {
    return api.get(`/api/simulados/saved?${agentParams}`);
  }

  async function fetchSavedSimulado(id) {
    return api.get(`/api/simulados/saved/${id}`);
  }

  async function analyzeAnswer(question, userAnswer) {
    return api.post("/api/ai/analyze", { question, userAnswer });
  }

  async function fetchStats() {
    return api.get(`/api/stats?${agentParams}`);
  }

  return (
    <AgentContext.Provider value={{
      activeAgent, agentLoaded, selectAgent, clearAgent, agentParams,
      fetchQuestion, recordProgress,
      fetchFlashcards, fetchFlashcardSubjects,
      fetchSavedSimulados, fetchSavedSimulado,
      analyzeAnswer, fetchStats,
    }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  return useContext(AgentContext);
}
