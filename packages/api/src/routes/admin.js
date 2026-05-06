/**
 * Rotas administrativas: geração IA em batch, gestão de usuários/simulados.
 * Todas exigem requireAdmin.
 */
const Anthropic = require("@anthropic-ai/sdk");
const db        = require("../db");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const HAIKU  = "claude-haiku-4-5-20251001";

module.exports = async function(app) {

  // GET /api/admin/stats
  app.get("/stats", { preHandler: [app.requireAdmin] }, async () => {
    const [overview, qByArea] = await Promise.all([
      db.getAdminStats(),
      db.getQuestionCountByAreaBanca(),
    ]);
    return { ...overview, questionsByAgent: qByArea };
  });

  // GET /api/admin/users
  app.get("/users", { preHandler: [app.requireAdmin] }, async () => {
    const users = await db.listUsers();
    return { users };
  });

  // POST /api/admin/users/:id/promote
  app.post("/users/:id/promote", { preHandler: [app.requireAdmin] }, async (req) => {
    const user = await db.promoteUser(req.params.id);
    return { ok: true, user };
  });

  // POST /api/admin/questions/generate
  // Body: { areaId, bancaId, subject, topico, estilo, n, batchSize }
  app.post("/questions/generate", { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const { areaId, bancaId, subject, topico, estilo, n = 10, batchSize = 5 } = req.body;
    if (!areaId || !bancaId || !subject)
      return reply.status(400).send({ error: "areaId, bancaId e subject obrigatórios" });

    const totalBatches = Math.ceil(n / batchSize);
    const saved = [];

    for (let batch = 0; batch < totalBatches; batch++) {
      const count = Math.min(batchSize, n - batch * batchSize);
      const prompt = `ÁREA: ${subject}${topico ? ` — Tópico: ${topico}` : ""}
Banca: ${estilo || bancaId.toUpperCase()} — Gere ${count} questões DISTINTAS de múltipla escolha (A-E).
Varie tópicos, gabaritos e dificuldade. JSON apenas:
{"questoes":[{"enunciado":"...","alternativas":["A) ...","B) ...","C) ...","D) ...","E) ..."],"correta":"LETRA","topico":"...","artigo":"Art. X Lei Y","justificativa":"2-3 frases explicando a correta"}]}`;

      const msg = await client.messages.create({
        model: HAIKU, max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });

      const text = msg.content[0]?.text || "{}";
      let parsed;
      try {
        const clean = text.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(clean);
      } catch {
        continue;
      }

      const questoes = parsed?.questoes || (Array.isArray(parsed) ? parsed : []);
      for (const q of questoes) {
        if (!q.enunciado || !q.alternativas || !q.correta) continue;
        const id = await db.saveQuestion({
          areaId, bancaId, subject,
          enunciado: q.enunciado,
          alternativas: q.alternativas,
          correta: q.correta,
          justificativa: q.justificativa || "",
          topico: q.topico || "",
          artigo: q.artigo || "",
        });
        saved.push(id);
      }
    }

    return { saved: saved.length, ids: saved };
  });

  // POST /api/admin/flashcards/generate
  // Body: { areaId, bancaId, subject, n }
  app.post("/flashcards/generate", { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const { areaId, bancaId, subject, n = 20 } = req.body;
    if (!areaId || !bancaId || !subject)
      return reply.status(400).send({ error: "areaId, bancaId e subject obrigatórios" });

    const prompt = `MATÉRIA: ${subject}
Gere ${n} flashcards de estudo para concurso público. Frente: conceito/artigo/pergunta. Verso: resposta objetiva.
JSON apenas:
{"cards":[{"front":"...","back":"..."}]}`;

    const msg = await client.messages.create({
      model: HAIKU, max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content[0]?.text || "{}";
    let cards = [];
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      cards = parsed?.cards || (Array.isArray(parsed) ? parsed : []);
    } catch {
      return reply.status(502).send({ error: "IA retornou resposta inválida" });
    }

    if (!cards.length) return reply.status(502).send({ error: "Nenhum card gerado" });
    const row = await db.saveFlashcards({ areaId, bancaId, subject, cards });
    return { ok: true, count: cards.length, id: row.id };
  });

  // POST /api/admin/simulados/generate
  // Body: { areaId, bancaId, name, size }
  // Monta pack a partir das questões já salvas no banco — zero custo IA
  app.post("/simulados/generate", { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const { areaId, bancaId, name, size = 30 } = req.body;
    if (!areaId || !bancaId || !name)
      return reply.status(400).send({ error: "areaId, bancaId e name obrigatórios" });

    const all = await db.listQuestions({ areaId, bancaId });
    if (all.length < size)
      return reply.status(400).send({ error: `Banco tem apenas ${all.length} questões (mínimo ${size})` });

    // Shuffle e pega as primeiras `size`
    const shuffled = all.sort(() => Math.random() - 0.5).slice(0, size);
    const row = await db.saveSimuladoPack({ areaId, bancaId, name, size: shuffled.length, questions: shuffled });
    return reply.status(201).send({ id: row.id, size: shuffled.length });
  });

  // DELETE /api/admin/simulados/:id
  app.delete("/simulados/:id", { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const row = await db.deleteSimuladoPack(req.params.id);
    if (!row) return reply.status(404).send({ error: "Simulado não encontrado" });
    return { ok: true };
  });
};
