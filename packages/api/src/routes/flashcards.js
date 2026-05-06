const db         = require("../db");
const checkAgent = require("../middleware/checkAgent");

module.exports = async function(app) {

  // GET /api/flashcards?areaId=&bancaId=&subject=
  app.get("/", { preHandler: [app.authenticate, checkAgent] }, async (req, reply) => {
    const { areaId, bancaId, subject } = req.query;
    if (!subject) return reply.status(400).send({ error: "subject obrigatório" });
    const set = await db.getFlashcards({ areaId, bancaId, subject });
    return { cards: set?.cards || [] };
  });

  // GET /api/flashcards/subjects?areaId=&bancaId=
  app.get("/subjects", { preHandler: [app.authenticate, checkAgent] }, async (req) => {
    const { areaId, bancaId } = req.query;
    const subjects = await db.listFlashcardSubjects({ areaId, bancaId });
    return { subjects };
  });

  // POST /api/flashcards — admin salva set
  app.post("/", { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const { areaId, bancaId, subject, cards } = req.body;
    if (!areaId || !bancaId || !subject || !Array.isArray(cards))
      return reply.status(400).send({ error: "Dados incompletos" });
    const row = await db.saveFlashcards({ areaId, bancaId, subject, cards });
    return reply.status(201).send({ id: row.id });
  });
};
