# AprovAI

Plataforma multi-agente de preparação para concursos públicos brasileiros.

Cada aluno contrata um **agente especializado** = combinação de área + banca examinadora.

## Áreas cobertas

| Área | Exemplos de cargo |
|------|------------------|
| Tributário / Auditoria | Auditor Fiscal, TCE, TCU, CGU |
| Policial | Delegado, Investigador, PF, PRF |
| Judiciário / Tribunais | Analista Judiciário, TJ, TRF |
| Legislativo | Analista Legislativo, Câmara, Senado |
| Ministério Público | Promotor, Analista MP |
| Procuradoria | PGE, PGM, Defensor Público |
| Agências Reguladoras | ANATEL, ANEEL, ANVISA |
| Financeiro | Banco Central, CVM, SUSEP |
| Gestão Pública | INSS, Ministérios, Administração |
| Saúde Pública | ANVISA, ANS, SUS |

## Bancas suportadas

CESPE/CEBRASPE · FCC · VUNESP · FGV · AOCP · IBFC · QUADRIX · IDECAN

## Stack

- **Web**: React 18 + Vite
- **Mobile**: React Native + Expo
- **API**: Node.js + Fastify
- **DB**: PostgreSQL (Supabase)
- **IA**: Anthropic API (Haiku + Sonnet)
- **Pagamentos**: Stripe + Mercado Pago

## Início rápido

```bash
pnpm install
cp .env.example .env  # preencha as variáveis
pnpm dev
```

## Estrutura

```
apps/
  web/      ← frontend React
  mobile/   ← Expo React Native
packages/
  api/      ← Fastify REST API
  db/       ← migrations e seeds
  shared/   ← tipos e constantes compartilhados
scripts/    ← geração de questões em lote
```
