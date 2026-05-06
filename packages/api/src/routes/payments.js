/**
 * Integração Stripe — checkout + webhook
 */
const Stripe = require("stripe");
const db     = require("../db");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function(app) {

  // POST /api/payments/checkout — cria sessão de pagamento
  app.post("/checkout", { preHandler: [app.authenticate] }, async (req, reply) => {
    const { planId, areaId, bancaId } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: req.user.email,
      metadata: {
        userId: req.user.id,
        planId,
        areaId:  areaId  || "",
        bancaId: bancaId || "",
      },
      line_items: [{
        price: process.env[`STRIPE_PRICE_${planId?.toUpperCase()}`],
        quantity: 1,
      }],
      success_url: `${process.env.APP_URL}/success?session={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.APP_URL}/planos`,
    });

    return { url: session.url };
  });

  // POST /api/payments/webhook — eventos Stripe (sem auth JWT)
  app.post("/webhook", {
    config: { rawBody: true },
  }, async (req, reply) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch(e) {
      return reply.status(400).send({ error: "Webhook signature inválida" });
    }

    switch(event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const { userId, planId, areaId, bancaId } = s.metadata;
        await db.createSubscription({
          userId,
          planId,
          stripeSubId:      s.subscription,
          stripeCustomerId: s.customer,
          status: "active",
        });
        if (areaId && bancaId) {
          await db.activateUserAgent({ userId, areaId, bancaId });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await db.updateSubscriptionStatus({
          stripeSubId: sub.id,
          status:      sub.status,
          periodEnd:   new Date(sub.current_period_end * 1000),
        });
        break;
      }
    }

    return { received: true };
  });

  // GET /api/payments/portal — portal de gerenciamento Stripe
  app.get("/portal", { preHandler: [app.authenticate] }, async (req) => {
    const sub = await db.getUserSubscription(req.user.id);
    if (!sub?.stripe_customer_id)
      return { url: null };

    const session = await stripe.billingPortal.sessions.create({
      customer:   sub.stripe_customer_id,
      return_url: process.env.APP_URL + "/perfil",
    });
    return { url: session.url };
  });
};
