const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db     = require("../db");

const SALT_ROUNDS = 12;

module.exports = async function(app) {

  // POST /api/auth/register
  app.post("/register", {
    schema: {
      body: {
        type: "object",
        required: ["email", "username", "password"],
        properties: {
          email:    { type: "string", format: "email", maxLength: 254 },
          username: { type: "string", minLength: 3, maxLength: 40 },
          password: { type: "string", minLength: 8, maxLength: 128 },
        },
      },
    },
  }, async (req, reply) => {
    const { email, username, password } = req.body;
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    try {
      const user = await db.createUser({ email, username, passwordHash: hash });
      const tokens = await issueTokens(app, user);
      return reply.status(201).send({ user: publicUser(user), ...tokens });
    } catch(e) {
      if (e.message?.includes("unique")) {
        return reply.status(409).send({ error: "Email ou nome de usuário já em uso" });
      }
      throw e;
    }
  });

  // POST /api/auth/login
  app.post("/login", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email:    { type: "string" },
          password: { type: "string" },
        },
      },
    },
  }, async (req, reply) => {
    const { email, password } = req.body;
    const user = await db.getUserByEmail(email);
    if (!user) return reply.status(401).send({ error: "Credenciais inválidas" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return reply.status(401).send({ error: "Credenciais inválidas" });

    const tokens = await issueTokens(app, user);
    return { user: publicUser(user), ...tokens };
  });

  // POST /api/auth/refresh
  app.post("/refresh", async (req, reply) => {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return reply.status(400).send({ error: "Token ausente" });

    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const stored = await db.getRefreshToken(tokenHash);
    if (!stored || stored.revoked || new Date(stored.expires_at) < new Date()) {
      return reply.status(401).send({ error: "Refresh token inválido ou expirado" });
    }

    await db.revokeRefreshToken(tokenHash);
    const user = await db.getUserById(stored.user_id);
    const tokens = await issueTokens(app, user);
    return tokens;
  });

  // POST /api/auth/logout
  app.post("/logout", { preHandler: [app.authenticate] }, async (req, reply) => {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
      await db.revokeRefreshToken(tokenHash);
    }
    return { ok: true };
  });

  // GET /api/auth/me
  app.get("/me", { preHandler: [app.authenticate] }, async (req) => {
    const user = await db.getUserById(req.user.id);
    const agents = await db.getUserAgents(req.user.id);
    const sub = await db.getUserSubscription(req.user.id);
    return { user: publicUser(user), agents, subscription: sub };
  });
};

// ── Helpers ──────────────────────────────────────────────────
async function issueTokens(app, user) {
  const accessToken = app.jwt.sign({
    id: user.id, email: user.email, username: user.username, is_admin: user.is_admin,
  });

  const rawRefresh = crypto.randomBytes(48).toString("hex");
  const tokenHash  = crypto.createHash("sha256").update(rawRefresh).digest("hex");
  const expiresAt  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

  await db.saveRefreshToken({ userId: user.id, tokenHash, expiresAt });

  return { accessToken, refreshToken: rawRefresh };
}

function publicUser(u) {
  return { id: u.id, email: u.email, username: u.username, is_admin: u.is_admin, created_at: u.created_at };
}
