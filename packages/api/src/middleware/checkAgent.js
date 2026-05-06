/**
 * Middleware: verifica se o usuário tem acesso ao agente (area + banca).
 * Usado em todas as rotas de conteúdo (questões, flashcards, simulados).
 */
const db = require("../db");

module.exports = async function checkAgent(req, reply) {
  const areaId  = req.params?.areaId  || req.query?.areaId  || req.body?.areaId;
  const bancaId = req.params?.bancaId || req.query?.bancaId || req.body?.bancaId;

  if (!areaId || !bancaId)
    return reply.status(400).send({ error: "areaId e bancaId são obrigatórios" });

  // Admin tem acesso irrestrito
  if (req.user?.is_admin) return;

  const hasAccess = await db.userHasAgent({ userId: req.user.id, areaId, bancaId });
  if (!hasAccess)
    return reply.status(403).send({ error: "Você não tem acesso a este agente. Faça o upgrade do seu plano." });
};
