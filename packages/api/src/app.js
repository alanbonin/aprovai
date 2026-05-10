const Fastify    = require("fastify");
const cors       = require("@fastify/cors");
const jwt        = require("@fastify/jwt");
const rateLimit  = require("@fastify/rate-limit");

const authRoutes     = require("./routes/auth");
const agentRoutes    = require("./routes/agents");
const questionRoutes = require("./routes/questions");
const flashRoutes    = require("./routes/flashcards");
const simRoutes      = require("./routes/simulados");
const payRoutes      = require("./routes/payments");
const adminRoutes    = require("./routes/admin");
const aiRoutes       = require("./routes/ai");
const statsRoutes    = require("./routes/stats");

function buildApp() {
  const app = Fastify({ logger: process.env.NODE_ENV !== "production" });

  app.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"],
    credentials: true,
  });

  app.register(jwt, {
    secret: process.env.JWT_SECRET || "dev-secret",
    sign: { expiresIn: "15m" },
  });

  app.register(rateLimit, { global: true, max: 100, timeWindow: "1 minute" });

  app.decorate("authenticate", async function(req, reply) {
    try { await req.jwtVerify(); }
    catch(e) { reply.status(401).send({ error: "Token inválido ou expirado" }); }
  });

  app.decorate("requireAdmin", async function(req, reply) {
    await app.authenticate(req, reply);
    if (!req.user?.is_admin)
      reply.status(403).send({ error: "Acesso restrito a administradores" });
  });

  app.register(authRoutes,     { prefix: "/api/auth" });
  app.register(agentRoutes,    { prefix: "/api/agents" });
  app.register(questionRoutes, { prefix: "/api/questions" });
  app.register(flashRoutes,    { prefix: "/api/flashcards" });
  app.register(simRoutes,      { prefix: "/api/simulados" });
  app.register(payRoutes,      { prefix: "/api/payments" });
  app.register(adminRoutes,    { prefix: "/api/admin" });
  app.register(aiRoutes,       { prefix: "/api/ai" });
  app.register(statsRoutes,    { prefix: "/api/stats" });
  app.get("/health", async () => ({ ok: true, ts: Date.now() }));

  return app;
}

module.exports = buildApp;
