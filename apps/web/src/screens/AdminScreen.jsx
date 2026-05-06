import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { C } from "../constants/colors";
import { Spinner, Btn, Badge } from "../components/UI";
import { api } from "../api/client";
import { AREAS, BANCAS } from "../../../../packages/shared/src/agents.js";

const TABS = [
  { id: "stats",      label: "Stats"      },
  { id: "questions",  label: "Questões"   },
  { id: "flashcards", label: "Flashcards" },
  { id: "simulados",  label: "Simulados"  },
  { id: "users",      label: "Usuários"   },
];

export default function AdminScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState("stats");

  if (!user?.is_admin) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.text3, fontSize: 13 }}>
        Acesso restrito.
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 2, padding: "10px 12px", background: C.bg1, borderBottom: `1px solid ${C.border}`, overflowX: "auto", flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: "7px 14px", borderRadius: 8, border: "none",
              background: tab === t.id ? C.amberD : "transparent",
              color: tab === t.id ? C.amber : C.text3,
              fontWeight: tab === t.id ? 700 : 400, fontSize: 12,
              cursor: "pointer", whiteSpace: "nowrap",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "stats"      && <StatsTab />}
        {tab === "questions"  && <QuestionsTab />}
        {tab === "flashcards" && <FlashcardsTab />}
        {tab === "simulados"  && <SimuladosTab />}
        {tab === "users"      && <UsersTab />}
      </div>
    </div>
  );
}

// ── Stats ─────────────────────────────────────────────────────
function StatsTab() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/admin/stats")
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Centered><Spinner /></Centered>;

  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Usuários",      val: stats?.totalUsers          || 0, color: C.blue  },
          { label: "Questões",      val: stats?.totalQuestions      || 0, color: C.amber },
          { label: "Simulados",     val: stats?.totalSimulados      || 0, color: C.green },
          { label: "Assinaturas",   val: stats?.activeSubscriptions || 0, color: "#a78bfa" },
        ].map(s => (
          <div key={s.label} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: "monospace", lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {stats?.questionsByAgent?.length > 0 && (
        <>
          <div style={{ fontSize: 10, color: C.text3, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            Questões por agente
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stats.questionsByAgent.map(r => {
              const area  = AREAS.find(a => a.id === r.area_id);
              const banca = BANCAS.find(b => b.id === r.banca_id);
              return (
                <div key={`${r.area_id}__${r.banca_id}`}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{area?.name || r.area_id}</div>
                    <div style={{ fontSize: 11, color: banca?.color || C.text3 }}>{banca?.name || r.banca_id}</div>
                  </div>
                  <div style={{ fontFamily: "monospace", fontWeight: 700, color: C.amber }}>{r.total}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Questões ──────────────────────────────────────────────────
function QuestionsTab() {
  const [areaId,    setAreaId]    = useState(AREAS[0].id);
  const [bancaId,   setBancaId]   = useState(BANCAS[0].id);
  const [subject,   setSubject]   = useState("");
  const [topico,    setTopico]    = useState("");
  const [n,         setN]         = useState(10);
  const [batchSize, setBatchSize] = useState(5);
  const [status,    setStatus]    = useState(null);
  const [loading,   setLoading]   = useState(false);

  const area = AREAS.find(a => a.id === areaId) || AREAS[0];

  async function generate() {
    if (!subject) return setStatus({ error: "Escolha uma matéria." });
    setLoading(true); setStatus(null);
    try {
      const d = await api.post("/api/admin/questions/generate", {
        areaId, bancaId, subject, topico, n, batchSize,
      });
      setStatus({ ok: true, msg: `✅ ${d.saved} questões salvas.` });
    } catch(e) { setStatus({ error: e.message }); }
    setLoading(false);
  }

  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
      <Row label="Área">
        <select value={areaId} onChange={e => { setAreaId(e.target.value); setSubject(""); }} style={sel}>
          {AREAS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Row>
      <Row label="Banca">
        <select value={bancaId} onChange={e => setBancaId(e.target.value)} style={sel}>
          {BANCAS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </Row>
      <Row label="Matéria">
        <select value={subject} onChange={e => setSubject(e.target.value)} style={sel}>
          <option value="">— Selecione —</option>
          {area.subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Row>
      <Row label="Tópico (opcional)">
        <input value={topico} onChange={e => setTopico(e.target.value)} placeholder="Ex: Lei Maria da Penha" style={inp} />
      </Row>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Row label="Total de questões">
          <input type="number" min={1} max={200} value={n} onChange={e => setN(+e.target.value)} style={inp} />
        </Row>
        <Row label="Por chamada IA">
          <input type="number" min={1} max={20} value={batchSize} onChange={e => setBatchSize(+e.target.value)} style={inp} />
        </Row>
      </div>
      {status && (
        <div style={{ fontSize: 13, color: status.ok ? C.green : C.red, padding: "10px 14px", background: status.ok ? C.greenD : C.redD, border: `1px solid ${status.ok ? C.greenB : C.redB}`, borderRadius: 10 }}>
          {status.ok ? status.msg : `⚠ ${status.error}`}
        </div>
      )}
      <Btn onClick={generate} disabled={loading} style={{ width: "100%" }}>
        {loading ? <><Spinner size={14} color="#000" /> Gerando…</> : `🤖 Gerar ${n} questões`}
      </Btn>
    </div>
  );
}

// ── Flashcards ────────────────────────────────────────────────
function FlashcardsTab() {
  const [areaId,  setAreaId]  = useState(AREAS[0].id);
  const [bancaId, setBancaId] = useState(BANCAS[0].id);
  const [subject, setSubject] = useState("");
  const [n,       setN]       = useState(20);
  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(false);

  const area = AREAS.find(a => a.id === areaId) || AREAS[0];

  async function generate() {
    if (!subject) return setStatus({ error: "Escolha uma matéria." });
    setLoading(true); setStatus(null);
    try {
      const d = await api.post("/api/admin/flashcards/generate", { areaId, bancaId, subject, n });
      setStatus({ ok: true, msg: `✅ ${d.count} flashcards salvos.` });
    } catch(e) { setStatus({ error: e.message }); }
    setLoading(false);
  }

  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
      <Row label="Área">
        <select value={areaId} onChange={e => { setAreaId(e.target.value); setSubject(""); }} style={sel}>
          {AREAS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Row>
      <Row label="Banca">
        <select value={bancaId} onChange={e => setBancaId(e.target.value)} style={sel}>
          {BANCAS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </Row>
      <Row label="Matéria">
        <select value={subject} onChange={e => setSubject(e.target.value)} style={sel}>
          <option value="">— Selecione —</option>
          {area.subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Row>
      <Row label="Qtd. de cards">
        <input type="number" min={5} max={100} value={n} onChange={e => setN(+e.target.value)} style={inp} />
      </Row>
      {status && (
        <div style={{ fontSize: 13, color: status.ok ? C.green : C.red, padding: "10px 14px", background: status.ok ? C.greenD : C.redD, border: `1px solid ${status.ok ? C.greenB : C.redB}`, borderRadius: 10 }}>
          {status.ok ? status.msg : `⚠ ${status.error}`}
        </div>
      )}
      <Btn onClick={generate} disabled={loading} style={{ width: "100%" }}>
        {loading ? <><Spinner size={14} color="#000" /> Gerando…</> : `🃏 Gerar ${n} flashcards`}
      </Btn>
    </div>
  );
}

// ── Simulados ─────────────────────────────────────────────────
function SimuladosTab() {
  const [areaId,  setAreaId]  = useState(AREAS[0].id);
  const [bancaId, setBancaId] = useState(BANCAS[0].id);
  const [name,    setName]    = useState("");
  const [size,    setSize]    = useState(30);
  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [packs,   setPacks]   = useState([]);
  const [packsLoading, setPacksLoading] = useState(false);

  async function loadPacks() {
    setPacksLoading(true);
    api.get(`/api/simulados/saved?areaId=${areaId}&bancaId=${bancaId}`)
      .then(d => setPacks(d.simulados || []))
      .catch(() => {})
      .finally(() => setPacksLoading(false));
  }

  useEffect(() => { loadPacks(); }, [areaId, bancaId]);

  async function generate() {
    if (!name.trim()) return setStatus({ error: "Dê um nome ao simulado." });
    setLoading(true); setStatus(null);
    try {
      const d = await api.post("/api/admin/simulados/generate", { areaId, bancaId, name, size });
      setStatus({ ok: true, msg: `✅ Simulado criado com ${d.size} questões.` });
      loadPacks();
    } catch(e) { setStatus({ error: e.message }); }
    setLoading(false);
  }

  async function deletePack(id) {
    if (!confirm("Deletar este simulado?")) return;
    await api.delete(`/api/admin/simulados/${id}`).catch(() => {});
    loadPacks();
  }

  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
      <Row label="Área">
        <select value={areaId} onChange={e => setAreaId(e.target.value)} style={sel}>
          {AREAS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Row>
      <Row label="Banca">
        <select value={bancaId} onChange={e => setBancaId(e.target.value)} style={sel}>
          {BANCAS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </Row>
      <Row label="Nome do simulado">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Simulado Completo Jun/26" style={inp} />
      </Row>
      <Row label="Qtd. de questões">
        <select value={size} onChange={e => setSize(+e.target.value)} style={sel}>
          {[20,30,40,50,60,80,100].map(n => <option key={n} value={n}>{n} questões</option>)}
        </select>
      </Row>
      {status && (
        <div style={{ fontSize: 13, color: status.ok ? C.green : C.red, padding: "10px 14px", background: status.ok ? C.greenD : C.redD, border: `1px solid ${status.ok ? C.greenB : C.redB}`, borderRadius: 10 }}>
          {status.ok ? status.msg : `⚠ ${status.error}`}
        </div>
      )}
      <Btn onClick={generate} disabled={loading} style={{ width: "100%" }}>
        {loading ? <><Spinner size={14} color="#000" /> Criando…</> : `🎯 Criar simulado de ${size}q`}
      </Btn>

      <div style={{ fontSize: 10, color: C.text3, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 8 }}>
        Packs salvos
      </div>
      {packsLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><Spinner /></div>
      ) : packs.length === 0 ? (
        <div style={{ fontSize: 13, color: C.text3, textAlign: "center", padding: "16px 0" }}>Nenhum simulado salvo.</div>
      ) : packs.map(p => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
            <div style={{ fontSize: 11, color: C.text3 }}>{p.size}q · {new Date(p.created_at).toLocaleDateString("pt-BR")}</div>
          </div>
          <button onClick={() => deletePack(p.id)}
            style={{ background: "none", border: `1px solid ${C.redB}`, borderRadius: 8, padding: "5px 10px", color: C.red, fontSize: 11, cursor: "pointer" }}>
            Excluir
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Usuários ──────────────────────────────────────────────────
function UsersTab() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(null);

  useEffect(() => {
    api.get("/api/admin/users")
      .then(d => setUsers(d.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function promote(id) {
    if (!confirm("Promover este usuário a administrador?")) return;
    setPromoting(id);
    try {
      await api.post(`/api/admin/users/${id}/promote`, {});
      setUsers(u => u.map(x => x.id === id ? { ...x, is_admin: true } : x));
    } catch {}
    setPromoting(null);
  }

  if (loading) return <Centered><Spinner /></Centered>;

  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
      {users.map(u => (
        <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{u.username}</div>
            <div style={{ fontSize: 11, color: C.text3 }}>{u.email}</div>
          </div>
          {u.is_admin ? (
            <Badge color={C.amber}>Admin</Badge>
          ) : (
            <button onClick={() => promote(u.id)} disabled={promoting === u.id}
              style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px", color: C.text3, fontSize: 11, cursor: "pointer" }}>
              {promoting === u.id ? "…" : "Promover"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────
function Centered({ children }) {
  return <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>;
}

function Row({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 11, color: C.text3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      {children}
    </div>
  );
}

const sel = {
  background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10,
  color: C.text, padding: "10px 12px", fontSize: 13, width: "100%",
};

const inp = {
  background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10,
  color: C.text, padding: "10px 12px", fontSize: 13, width: "100%",
  boxSizing: "border-box",
};
