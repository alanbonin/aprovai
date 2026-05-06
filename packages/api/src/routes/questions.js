const db           = require("../db");
const checkAgent   = require("../middleware/checkAgent");

module.exports = async function(app) {

  // GET /api/questions?areaId=&bancaId=&subject=&filtro=
  app.get("/", { preHandler: [app.authenticate, checkAgent] }, async (req) => {
    const { areaId, bancaId, subject, filtro = "todas" } = req.query;
    const seen = req.query.seen ? JSON.parse(req.query.seen) : [];
    const question = await db.getQuestion({ areaId, bancaId, subject, seen, filtro, userId: req.user.id });
    return { question };
  });

  // GET /api/questions/list?areaId=&bancaId=&subject=
  app.get("/list", { preHandler: [app.authenticate, checkAgent] }, async (req) => {
    const { areaId, bancaId, subject } = req.query;
    const questions = await db.listQuestions({ areaId, bancaId, subject });
    return { questions };
  });

  // POST /api/questions — admin salva questão
  app.post("/", { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const q = req.body;
    const id = await db.saveQuestion(q);
    return reply.status(201).send({ id });
  });

  // POST /api/questions/:id/progress — aluno registra resposta
  app.post("/:id/progress", { preHandler: [app.authenticate] }, async (req) => {
    const { correct, timeSecs } = req.body;
    await db.saveProgress({
      userId: req.user.id,
      questionId: req.params.id,
      correct,
      timeSecs,
    });
    return { ok: true };
  });

  // DELETE /api/questions/:id — admin remove questão
  app.delete("/:id", { preHandler: [app.requireAdmin] }, async (req) => {
    await db.deleteQuestion(req.params.id);
    return { ok: true };
  });
};
