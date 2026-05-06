const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function q(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}
async function one(sql, params = []) {
  return (await q(sql, params))[0] || null;
}

// ── Usuários ──────────────────────────────────────────────────

async function createUser({ email, username, passwordHash }) {
  return one(
    `INSERT INTO users (email, username, password_hash)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email, username, passwordHash]
  );
}

async function getUserByEmail(email) {
  return one("SELECT * FROM users WHERE email = $1", [email]);
}

async function getUserById(id) {
  return one("SELECT * FROM users WHERE id = $1", [id]);
}

async function listUsers() {
  return q("SELECT id, email, username, is_admin, created_at FROM users ORDER BY created_at DESC");
}

async function promoteUser(userId) {
  return one("UPDATE users SET is_admin = true WHERE id = $1 RETURNING *", [userId]);
}

// ── Refresh tokens ────────────────────────────────────────────

async function saveRefreshToken({ userId, tokenHash, expiresAt }) {
  return one(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, tokenHash, expiresAt]
  );
}

async function getRefreshToken(tokenHash) {
  return one("SELECT * FROM refresh_tokens WHERE token_hash = $1", [tokenHash]);
}

async function revokeRefreshToken(tokenHash) {
  return one("UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1 RETURNING id", [tokenHash]);
}

// ── Agentes / assinaturas ─────────────────────────────────────

async function getUserAgents(userId) {
  return q(
    "SELECT area_id, banca_id, active, created_at FROM user_agents WHERE user_id = $1 AND active = true",
    [userId]
  );
}

async function getUserSubscription(userId) {
  return one(
    "SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
    [userId]
  );
}

async function activateUserAgent({ userId, areaId, bancaId }) {
  return one(
    `INSERT INTO user_agents (user_id, area_id, banca_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, area_id, banca_id) DO UPDATE SET active = true
     RETURNING *`,
    [userId, areaId, bancaId]
  );
}

async function createSubscription({ userId, planId, stripeSubId, stripeCustomerId, status }) {
  return one(
    `INSERT INTO subscriptions (user_id, plan_id, stripe_sub_id, stripe_customer_id, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, planId, stripeSubId, stripeCustomerId, status]
  );
}

async function updateSubscriptionStatus({ stripeSubId, status, periodEnd }) {
  return one(
    `UPDATE subscriptions
     SET status = $2, current_period_end = $3
     WHERE stripe_sub_id = $1
     RETURNING *`,
    [stripeSubId, status, periodEnd]
  );
}

// ── Questões ──────────────────────────────────────────────────

async function getQuestion({ areaId, bancaId, subject, seen = [], filtro = "naorespondidas", userId }) {
  const seenClause = seen.length
    ? `AND q.id NOT IN (${seen.map((_, i) => `$${i + 5}`).join(",")})`
    : "";

  let filtroJoin = "";
  let filtroWhere = "";

  if (filtro === "naorespondidas") {
    filtroJoin  = `LEFT JOIN user_progress up ON up.question_id = q.id AND up.user_id = $4`;
    filtroWhere = `AND up.question_id IS NULL`;
  } else if (filtro === "erradas") {
    filtroJoin  = `INNER JOIN user_progress up ON up.question_id = q.id AND up.user_id = $4 AND up.correct = false`;
  }
  // "todas" — sem join extra

  const sql = `
    SELECT q.* FROM questions q
    ${filtroJoin}
    WHERE q.area_id = $1 AND q.banca_id = $2 AND q.subject = $3
    ${filtroWhere}
    ${seenClause}
    ORDER BY RANDOM()
    LIMIT 1
  `;

  const params = [areaId, bancaId, subject, userId, ...seen];
  return one(sql, params);
}

async function listQuestions({ areaId, bancaId, subject }) {
  const subjClause = subject ? "AND subject = $3" : "";
  const params = subject ? [areaId, bancaId, subject] : [areaId, bancaId];
  return q(
    `SELECT id, subject, enunciado, correta, topico, artigo, created_at
     FROM questions
     WHERE area_id = $1 AND banca_id = $2 ${subjClause}
     ORDER BY created_at DESC`,
    params
  );
}

async function saveQuestion({ areaId, bancaId, subject, enunciado, alternativas, correta, justificativa, topico, artigo }) {
  const row = await one(
    `INSERT INTO questions (area_id, banca_id, subject, enunciado, alternativas, correta, justificativa, topico, artigo)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9)
     RETURNING id`,
    [areaId, bancaId, subject, enunciado, JSON.stringify(alternativas), correta, justificativa, topico, artigo]
  );
  return row.id;
}

async function deleteQuestion(id) {
  return one("DELETE FROM questions WHERE id = $1 RETURNING id", [id]);
}

async function countQuestions({ areaId, bancaId }) {
  const row = await one(
    "SELECT COUNT(*)::int AS total FROM questions WHERE area_id = $1 AND banca_id = $2",
    [areaId, bancaId]
  );
  return row?.total || 0;
}

// ── Progresso ─────────────────────────────────────────────────

async function saveProgress({ userId, questionId, correct, timeSecs }) {
  // Busca area/banca da questão para gravar na linha de progresso
  const question = await one("SELECT area_id, banca_id FROM questions WHERE id = $1", [questionId]);
  const areaId  = question?.area_id  || "";
  const bancaId = question?.banca_id || "";

  return one(
    `INSERT INTO user_progress (user_id, area_id, banca_id, question_id, correct, time_secs)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (user_id, question_id)
     DO UPDATE SET correct = EXCLUDED.correct, answered_at = now(), time_secs = EXCLUDED.time_secs
     RETURNING id`,
    [userId, areaId, bancaId, questionId, correct, timeSecs]
  );
}

async function getUserStats(userId, areaId, bancaId, subjects) {
  const totRow = await one(
    "SELECT COUNT(*)::int AS total FROM questions WHERE area_id = $1 AND banca_id = $2",
    [areaId, bancaId]
  );

  const progRows = await q(
    `SELECT correct, q.subject
     FROM user_progress up
     JOIN questions q ON q.id = up.question_id
     WHERE up.user_id = $1 AND up.area_id = $2 AND up.banca_id = $3`,
    [userId, areaId, bancaId]
  );

  const answered = progRows.length;
  const correct  = progRows.filter(r => r.correct).length;

  const bySubject = {};
  for (const subj of (subjects || [])) {
    bySubject[subj] = { answered: 0, correct: 0 };
  }
  for (const r of progRows) {
    if (!bySubject[r.subject]) bySubject[r.subject] = { answered: 0, correct: 0 };
    bySubject[r.subject].answered++;
    if (r.correct) bySubject[r.subject].correct++;
  }

  return { totalQuestions: totRow?.total || 0, answered, correct, bySubject };
}

// ── Flashcards ────────────────────────────────────────────────

async function getFlashcards({ areaId, bancaId, subject }) {
  return one(
    "SELECT * FROM flashcard_sets WHERE area_id = $1 AND banca_id = $2 AND subject = $3",
    [areaId, bancaId, subject]
  );
}

async function listFlashcardSubjects({ areaId, bancaId }) {
  return q(
    "SELECT subject, jsonb_array_length(cards) AS count FROM flashcard_sets WHERE area_id = $1 AND banca_id = $2 ORDER BY subject",
    [areaId, bancaId]
  );
}

async function saveFlashcards({ areaId, bancaId, subject, cards }) {
  return one(
    `INSERT INTO flashcard_sets (area_id, banca_id, subject, cards)
     VALUES ($1,$2,$3,$4::jsonb)
     ON CONFLICT (area_id, banca_id, subject)
     DO UPDATE SET cards = EXCLUDED.cards
     RETURNING id`,
    [areaId, bancaId, subject, JSON.stringify(cards)]
  );
}

// ── Simulados ─────────────────────────────────────────────────

async function getSavedSimulados({ areaId, bancaId }) {
  return q(
    "SELECT id, name, size, created_at FROM saved_simulados WHERE area_id = $1 AND banca_id = $2 ORDER BY created_at DESC",
    [areaId, bancaId]
  );
}

async function getSavedSimulado(id) {
  return one("SELECT * FROM saved_simulados WHERE id = $1", [id]);
}

async function saveSimuladoPack({ areaId, bancaId, name, size, questions }) {
  return one(
    `INSERT INTO saved_simulados (area_id, banca_id, name, size, questions)
     VALUES ($1,$2,$3,$4,$5::jsonb)
     RETURNING id`,
    [areaId, bancaId, name, size, JSON.stringify(questions)]
  );
}

async function deleteSimuladoPack(id) {
  return one("DELETE FROM saved_simulados WHERE id = $1 RETURNING id", [id]);
}

async function saveSimuladoHistory({ userId, areaId, bancaId, total, correct, timeSecs, questions, answers }) {
  return one(
    `INSERT INTO simulado_history (user_id, area_id, banca_id, total, correct, time_secs, questions, answers)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb)
     RETURNING id`,
    [userId, areaId, bancaId, total, correct, timeSecs, JSON.stringify(questions), JSON.stringify(answers)]
  );
}

// ── Admin stats ───────────────────────────────────────────────

async function getAdminStats() {
  const [users, questions, simulados, subs] = await Promise.all([
    one("SELECT COUNT(*)::int AS total FROM users"),
    one("SELECT COUNT(*)::int AS total FROM questions"),
    one("SELECT COUNT(*)::int AS total FROM saved_simulados"),
    one("SELECT COUNT(*)::int AS total FROM subscriptions WHERE status = 'active'"),
  ]);
  return {
    totalUsers:     users?.total     || 0,
    totalQuestions: questions?.total || 0,
    totalSimulados: simulados?.total || 0,
    activeSubscriptions: subs?.total || 0,
  };
}

async function getQuestionCountByAreaBanca() {
  return q(
    `SELECT area_id, banca_id, COUNT(*)::int AS total
     FROM questions GROUP BY area_id, banca_id ORDER BY area_id, banca_id`
  );
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
