# Deploy AprovAI

## Pré-requisitos
- Conta [Railway](https://railway.app) — para o backend
- Conta [Vercel](https://vercel.com) — para o frontend
- Banco [Supabase](https://supabase.com) — PostgreSQL gerenciado

---

## 1. Supabase (banco de dados)

1. Crie um projeto em supabase.com
2. Vá em **SQL Editor** e execute `packages/db/migrations/001_initial.sql`
3. Copie a **Connection String (Transaction)** em Settings → Database → Connection string
   - Formato: `postgresql://postgres.[ref]:[senha]@aws-0-...supabase.com:6543/postgres`

---

## 2. Railway (API Fastify)

1. Crie conta em railway.app → **New Project → Deploy from GitHub repo**
2. Selecione o repositório `aprovai`
3. Railway detectará o `railway.json` e usará o `packages/api/Dockerfile`
4. Adicione as variáveis de ambiente em **Variables**:

```
DATABASE_URL=<connection string do Supabase>
JWT_SECRET=<string aleatória longa, ex: openssl rand -hex 32>
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ELITE=price_...
APP_URL=https://aprovai.vercel.app
ALLOWED_ORIGINS=https://aprovai.vercel.app
NODE_ENV=production
PORT=3001
```

5. Após o deploy copie a URL gerada, ex: `https://aprovai-api.up.railway.app`

### Stripe Webhook
- Dashboard Stripe → Developers → Webhooks → Add endpoint
- URL: `https://aprovai-api.up.railway.app/api/payments/webhook`
- Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

---

## 3. Vercel (frontend React)

1. Crie conta em vercel.com → **New Project → Import Git Repository**
2. Selecione o repositório `aprovai`
3. Vercel usará o `vercel.json` na raiz
4. Adicione a variável de ambiente:

```
VITE_API_URL=https://aprovai-api.up.railway.app
```

5. Clique **Deploy**

---

## 4. Primeiro admin

Após o deploy, registre uma conta normalmente e execute no Supabase SQL Editor:

```sql
UPDATE users SET is_admin = true WHERE email = 'seu@email.com';
```

---

## Desenvolvimento local

```bash
# Instalar dependências
pnpm install

# Copiar e preencher .env
cp .env.example packages/api/.env

# Rodar API + Web em paralelo
pnpm dev
```
