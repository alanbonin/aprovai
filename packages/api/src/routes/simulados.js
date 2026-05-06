const db         = require("../db");
const checkAgent = require("../middleware/checkAgent");

module.exports = async function(app) {

  // GET /api/simulados/saved?areaId=&bancaId=
  app.get("/saved", { preHandler: [app.authenticate, checkAgent] }, async (req) => {
    const { areaId, bancaId } = req.query;
    const simulados = await db.getSavedSimulados({ areaId, bancaId });
    return { simulados };
  });

  // GET /api/simulados/saved/:id
  app.get("/saved/:id", { preHandler: [app.authenticate] }, async (req, reply) => {
    const pack = await db.getSavedSimulado(req.params.id);
    if (!pack) return reply.status(404).send({ error: "Simulado não encontrado" });
    return pack;
  });

  // POST /api/simulados/saved — admin cria pack
  app.post("/saved", { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const { areaId, bancaId, name, size, questions } = req.body;
    if (!areaId || !bancaId || !name || !Array.isArray(questions))
      return reply.status(400).send({ error: "Dados incompletos" });
    const row = await db.saveSimuladoPack({ areaId, bancaId, name, size: size || questions.length, questions });
    return reply.status(201).send({ id: row.id });
  });

  // DELETE /api/simulados/saved/:id — admin remove pack
  app.delete("/saved/:id", { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const row = await db.deleteSimuladoPack(req.params.id);
    if (!row) return reply.status(404).send({ error: "Simulado não encontrado" });
    return { ok: true };
  });

  // POST /api/simulados/history — aluno salva resultado
  app.post("/history", { preHandler: [app.authenticate] }, async (req) => {
    const { areaId, bancaId, total, correct, timeSecs, questions, answers } = req.body;
    await db.saveSimuladoHistory({
      userId: req.user.id, areaId, bancaId, total, correct, timeSecs, questions, answers,
    });
    return { ok: true };
  });
};
