import { createContext, useContext, useState, useCallback } from "react";
import { api } from "../api/client";

const AgentContext = createContext(null);

export function AgentProvider({ children }) {
  const [activeAgent, setActiveAgent] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aprovai_agent")); } catch { return null; }
  });

  const selectAgent = useCallback((area, banca) => {
    const agent = { area, banca };
    setActiveAgent(agent);
    localStorage.setItem("aprovai_agent", JSON.stringify(agent));
  }, []);

  const clearAgent = useCallback(() => {
    setActiveAgent(null);
    localStorage.removeItem("aprovai_agent");
  }, []);

  // Helpers para montar query params
  const agentParams = activeAgent
    ? `areaId=${activeAgent.area.id}&bancaId=${activeAgent.banca.id}`
    : "";

  async function fetchQuestion(subject, seen = [], filtro = "naorespondidas") {
    const seenStr = seen.length ? `&seen=${encodeURIComponent(JSON.stringify(seen))}` : "";
    const subjStr = subject ? `&subject=${encodeURIComponent(subject)}` : "";
    return api.get(`/api/questions?${agentParams}${subjStr}&filtro=${filtro}${seenStr}`);
  }

  async function listQuestions(subject) {
    const subjStr = subject ? `&subject=${encodeURIComponent(subject)}` : "";
    return api.get(`/api/questions/list?${agentParams}${subjStr}`);
  }

  async function recordProgress(questionId, correct, timeSecs) {
    return api.post(`/api/questions/${questionId}/progress`, { correct, timeSecs });
  }

  async function fetchFlashcards(subject) {
    return api.get(`/api/flashcards?${agentParams}&subject=${encodeURIComponent(subject)}`);
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

  return (
    <AgentContext.Provider value={{
      activeAgent, selectAgent, clearAgent, agentParams,
      fetchQuestion, listQuestions, recordProgress,
      fetchFlashcards, fetchSavedSimulados, fetchSavedSimulado,
      analyzeAnswer,
    }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  return useContext(AgentContext);
}
