const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Helper — throw on Supabase error
function check({ data, error }, single = false) {
  if (error) throw new Error(error.message);
  return single ? data : data;
}

// ── Usuários ──────────────────────────────────────────────────

async function createUser({ email, username, passwordHash }) {
  const { data, error } = await supabase
    .from("users")
    .insert({ email, username, password_hash: passwordHash })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function getUserByEmail(email) {
  const { data } = await supabase
    .from("users").select("*").eq("email", email).maybeSingle();
  return data;
}

async function getUserById(id) {
  const { data } = await supabase
    .from("users").select("*").eq("id", id).maybeSingle();
  return data;
}

async function listUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, username, is_admin, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

async function promoteUser(userId) {
  const { data, error } = await supabase
    .from("users").update({ is_admin: true }).eq("id", userId).select().single();
  if (error) throw new Error(error.message);
  return data;
}

// ── Refresh tokens ────────────────────────────────────────────

async function saveRefreshToken({ userId, tokenHash, expiresAt }) {
  const { data, error } = await supabase
    .from("refresh_tokens")
    .insert({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt })
    .select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function getRefreshToken(tokenHash) {
  const { data } = await supabase
    .from("refresh_tokens").select("*").eq("token_hash", tokenHash).maybeSingle();
  return data;
}

async function revokeRefreshToken(tokenHash) {
  const { data, error } = await supabase
    .from("refresh_tokens").update({ revoked: true }).eq("token_hash", tokenHash).select("id").single();
  if (error) throw new Error(error.message);
  return data;
}

// ── Agentes / assinaturas ─────────────────────────────────────

async function getUserAgents(userId) {
  const { data, error } = await supabase
    .from("user_agents")
    .select("area_id, banca_id, active, created_at")
    .eq("user_id", userId)
    .eq("active", true);
  if (error) throw new Error(error.message);
  return data;
}

async function getUserSubscription(userId) {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function activateUserAgent({ userId, areaId, bancaId }) {
  const { data, error } = await supabase
    .from("user_agents")
    .upsert(
      { user_id: userId, area_id: areaId, banca_id: bancaId, active: true },
      { onConflict: "user_id,area_id,banca_id" }
    )
    .select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function createSubscription({ userId, planId, stripeSubId, stripeCustomerId, status }) {
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({ user_id: userId, plan_id: planId, stripe_sub_id: stripeSubId, stripe_customer_id: stripeCustomerId, status })
    .select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function updateSubscriptionStatus({ stripeSubId, status, periodEnd }) {
  const { data, error } = await supabase
    .from("subscriptions")
    .update({ status, current_period_end: periodEnd })
    .eq("stripe_sub_id", stripeSubId)
    .select().single();
  if (error) throw new Error(error.message);
  return data;
}

// ── Questões ──────────────────────────────────────────────────

async function getQuestion({ areaId, bancaId, subject, seen = [], filtro = "naorespondidas", userId }) {
  // Fetch candidates
  let query = supabase
    .from("questions")
    .select("*")
    .eq("area_id", areaId)
    .eq("banca_id", bancaId)
    .eq("subject", subject)
    .limit(200);

  if (seen.length) query = query.not("id", "in", `(${seen.join(",")})`);

  const { data: candidates, error } = await query;
  if (error) throw new Error(error.message);
  if (!candidates?.length) return null;

  // Apply filtro in JS
  let pool = candidates;
  if (filtro === "naorespondidas" || filtro === "erradas") {
    const { data: progress } = await supabase
      .from("user_progress")
      .select("question_id, correct")
      .eq("user_id", userId);

    const progressMap = {};
    for (const p of (progress || [])) progressMap[p.question_id] = p.correct;

    if (filtro === "naorespondidas") {
      pool = candidates.filter(c => !(c.id in progressMap));
    } else {
      pool = candidates.filter(c => progressMap[c.id] === false);
    }
    if (!pool.length) pool = candidates; // fallback to all
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

async function listQuestions({ areaId, bancaId, subject }) {
  let query = supabase
    .from("questions")
    .select("id, subject, enunciado, correta, topico, artigo, created_at")
    .eq("area_id", areaId)
    .eq("banca_id", bancaId)
    .order("created_at", { ascending: false });

  if (subject) query = query.eq("subject", subject);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

async function saveQuestion({ areaId, bancaId, subject, enunciado, alternativas, correta, justificativa, topico, artigo }) {
  const { data, error } = await supabase
    .from("questions")
    .insert({ area_id: areaId, banca_id: bancaId, subject, enunciado, alternativas, correta, justificativa, topico, artigo })
    .select("id").single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function deleteQuestion(id) {
  const { data, error } = await supabase
    .from("questions").delete().eq("id", id).select("id").single();
  if (error) throw new Error(error.message);
  return data;
}

async function countQuestions({ areaId, bancaId }) {
  const { count, error } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("area_id", areaId)
    .eq("banca_id", bancaId);
  if (error) throw new Error(error.message);
  return count || 0;
}

// ── Progresso ─────────────────────────────────────────────────

async function saveProgress({ userId, questionId, correct, timeSecs }) {
  const { data: question } = await supabase
    .from("questions").select("area_id, banca_id").eq("id", questionId).maybeSingle();

  const { data, error } = await supabase
    .from("user_progress")
    .upsert(
      {
        user_id: userId,
        area_id: question?.area_id || "",
        banca_id: question?.banca_id || "",
        question_id: questionId,
        correct,
        time_secs: timeSecs,
        answered_at: new Date().toISOString(),
      },
      { onConflict: "user_id,question_id" }
    )
    .select("id").single();
  if (error) throw new Error(error.message);
  return data;
}

async function getUserStats(userId, areaId, bancaId, subjects) {
  const [{ count: totalQuestions }, progressRes] = await Promise.all([
    supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("area_id", areaId)
      .eq("banca_id", bancaId),
    supabase
      .from("user_progress")
      .select("correct, question_id, questions(subject)")
      .eq("user_id", userId)
      .eq("area_id", areaId)
      .eq("banca_id", bancaId),
  ]);

  const progRows = progressRes.data || [];
  const answered = progRows.length;
  const correct  = progRows.filter(r => r.correct).length;

  const bySubject = {};
  for (const subj of (subjects || [])) {
    bySubject[subj] = { answered: 0, correct: 0 };
  }
  for (const r of progRows) {
    const subj = r.questions?.subject;
    if (!subj) continue;
    if (!bySubject[subj]) bySubject[subj] = { answered: 0, correct: 0 };
    bySubject[subj].answered++;
    if (r.correct) bySubject[subj].correct++;
  }

  return { totalQuestions: totalQuestions || 0, answered, correct, bySubject };
}

// ── Flashcards ────────────────────────────────────────────────

async function getFlashcards({ areaId, bancaId, subject }) {
  const { data } = await supabase
    .from("flashcard_sets")
    .select("*")
    .eq("area_id", areaId)
    .eq("banca_id", bancaId)
    .eq("subject", subject)
    .maybeSingle();
  return data;
}

async function listFlashcardSubjects({ areaId, bancaId }) {
  const { data, error } = await supabase
    .from("flashcard_sets")
    .select("subject, cards")
    .eq("area_id", areaId)
    .eq("banca_id", bancaId)
    .order("subject");
  if (error) throw new Error(error.message);
  return (data || []).map(r => ({
    subject: r.subject,
    count: Array.isArray(r.cards) ? r.cards.length : 0,
  }));
}

async function saveFlashcards({ areaId, bancaId, subject, cards }) {
  const { data, error } = await supabase
    .from("flashcard_sets")
    .upsert(
      { area_id: areaId, banca_id: bancaId, subject, cards },
      { onConflict: "area_id,banca_id,subject" }
    )
    .select("id").single();
  if (error) throw new Error(error.message);
  return data;
}

// ── Simulados ─────────────────────────────────────────────────

async function getSavedSimulados({ areaId, bancaId }) {
  const { data, error } = await supabase
    .from("saved_simulados")
    .select("id, name, size, created_at")
    .eq("area_id", areaId)
    .eq("banca_id", bancaId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

async function getSavedSimulado(id) {
  const { data } = await supabase
    .from("saved_simulados").select("*").eq("id", id).maybeSingle();
  return data;
}

async function saveSimuladoPack({ areaId, bancaId, name, size, questions }) {
  const { data, error } = await supabase
    .from("saved_simulados")
    .insert({ area_id: areaId, banca_id: bancaId, name, size, questions })
    .select("id").single();
  if (error) throw new Error(error.message);
  return data;
}

async function deleteSimuladoPack(id) {
  const { data, error } = await supabase
    .from("saved_simulados").delete().eq("id", id).select("id").single();
  if (error) throw new Error(error.message);
  return data;
}

async function saveSimuladoHistory({ userId, areaId, bancaId, total, correct, timeSecs, questions, answers }) {
  const { data, error } = await supabase
    .from("simulado_history")
    .insert({ user_id: userId, area_id: areaId, banca_id: bancaId, total, correct, time_secs: timeSecs, questions, answers })
    .select("id").single();
  if (error) throw new Error(error.message);
  return data;
}

// ── Admin stats ───────────────────────────────────────────────

async function getAdminStats() {
  const [usersRes, questionsRes, simuladosRes, subsRes] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("questions").select("*", { count: "exact", head: true }),
    supabase.from("saved_simulados").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);
  return {
    totalUsers:          usersRes.count     || 0,
    totalQuestions:      questionsRes.count || 0,
    totalSimulados:      simuladosRes.count || 0,
    activeSubscriptions: subsRes.count      || 0,
  };
}

async function getQuestionCountByAreaBanca() {
  const { data, error } = await supabase
    .from("questions")
    .select("area_id, banca_id");
  if (error) throw new Error(error.message);

  const counts = {};
  for (const r of (data || [])) {
    const key = `${r.area_id}__${r.banca_id}`;
    counts[key] = (counts[key] || { area_id: r.area_id, banca_id: r.banca_id, total: 0 });
    counts[key].total++;
  }
  return Object.values(counts).sort((a, b) => `${a.area_id}${a.banca_id}`.localeCompare(`${b.area_id}${b.banca_id}`));
}

module.exports = {
  createUser, getUserByEmail, getUserById, listUsers, promoteUser,
  saveRefreshToken, getRefreshToken, revokeRefreshToken,
  getUserAgents, getUserSubscription, activateUserAgent,
  createSubscription, updateSubscriptionStatus,
  getQuestion, listQuestions, saveQuestion, deleteQuestion, countQuestions,
  saveProgress, getUserStats,
  getFlashcards, listFlashcardSubjects, saveFlashcards,
  getSavedSimulados, getSavedSimulado, saveSimuladoPack, deleteSimuladoPack,
  saveSimuladoHistory,
  getAdminStats, getQuestionCountByAreaBanca,
};
