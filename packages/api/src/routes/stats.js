const db         = require("../db");
const checkAgent = require("../middleware/checkAgent");

module.exports = async function(app) {

  // GET /api/stats?areaId=&bancaId=
  app.get("/", { preHandler: [app.authenticate, checkAgent] }, async (req) => {
    const { areaId, bancaId } = req.query;
    const { AREAS } = await import("../../../shared/src/agents.js");
    const area     = AREAS.find(a => a.id === areaId);
    const subjects = area?.subjects || [];
    return db.getUserStats(req.user.id, areaId, bancaId, subjects);
  });
};
