const db = require("../db");

module.exports = async function(app) {

  // GET /api/agents — lista todos agentes disponíveis
  app.get("/", async () => {
    const { AREAS, BANCAS } = require("../../../shared/src/agents");
    return { areas: AREAS, bancas: BANCAS };
  });

  // GET /api/agents/mine — agentes do usuário autenticado
  app.get("/mine", { preHandler: [app.authenticate] }, async (req) => {
    const agents = await db.getUserAgents(req.user.id);
    return { agents };
  });

  // POST /api/agents/activate — admin ativa agente para usuário
  app.post("/activate", { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const { userId, areaId, bancaId } = req.body;
    if (!userId || !areaId || !bancaId)
      return reply.status(400).send({ error: "Dados incompletos" });
    await db.activateUserAgent({ userId, areaId, bancaId });
    return { ok: true };
  });
};
