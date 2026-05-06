/**
 * Proxy seguro para a Anthropic API.
 * Chave de API nunca exposta ao cliente.
 */
const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const HAIKU  = "claude-haiku-4-5-20251001";
const SONNET = "claude-sonnet-4-6";

module.exports = async function(app) {

  // POST /api/ai/complete — chamada geral (autenticado)
  app.post("/complete", {
    preHandler: [app.authenticate],
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const { prompt, system, model = HAIKU, maxTokens = 2048 } = req.body;
    if (!prompt) return reply.status(400).send({ error: "prompt obrigatório" });

    const allowed = [HAIKU, SONNET];
    if (!allowed.includes(model))
      return reply.status(400).send({ error: "model inválido" });

    const msg = await client.messages.create({
      model,
      max_tokens: Math.min(maxTokens, 4096),
      system: system || undefined,
      messages: [{ role: "user", content: prompt }],
    });

    return { text: msg.content[0]?.text || "" };
  });

  // POST /api/ai/analyze — análise de resposta (Sonnet)
  app.post("/analyze", {
    preHandler: [app.authenticate],
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const { question, userAnswer } = req.body;
    if (!question || !userAnswer)
      return reply.status(400).send({ error: "question e userAnswer obrigatórios" });

    const ok = userAnswer === question.correta;
    const prompt = `QUESTÃO: ${question.enunciado}
ALTERNATIVAS: ${question.alternativas.join(" | ")}
GABARITO: ${question.correta}  RESPOSTA DO ALUNO: ${userAnswer}  ACERTOU: ${ok}

Analise como instrutor especializado. APENAS JSON válido:
{"acertou":${ok},"explicacao":"por que ${question.correta} está correta — cite artigo exato","erro":"${!ok?`por que ${userAnswer} está errada`:""}","dica":"armadilha típica desta banca","dj":${ok?4:2},"mp":${ok?4:2}}`;

    const msg = await client.messages.create({
      model: SONNET,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content[0]?.text || "{}";
    try {
      return JSON.parse(text);
    } catch {
      return reply.status(502).send({ error: "Resposta inválida da IA" });
    }
  });
};
