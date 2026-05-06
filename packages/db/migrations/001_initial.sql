-- AprovAI — Schema inicial
-- PostgreSQL (Supabase)

-- ── Extensões ────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Usuários ─────────────────────────────────────────────────
create table users (
  id            uuid primary key default uuid_generate_v4(),
  email         text not null unique,
  username      text not null unique,
  password_hash text not null,           -- bcrypt
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Planos / assinaturas ─────────────────────────────────────
create table plans (
  id          text primary key,          -- "basic" | "pro" | "elite"
  name        text not null,
  max_agents  integer not null,          -- -1 = ilimitado
  price_brl   numeric(10,2) not null,
  interval    text not null default 'month'
);

insert into plans values
  ('basic',  'Básico',  1,  39.00, 'month'),
  ('pro',    'Pro',     3,  79.00, 'month'),
  ('elite',  'Elite',  -1, 149.00, 'month');

-- ── Assinaturas ──────────────────────────────────────────────
create table subscriptions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references users(id) on delete cascade,
  plan_id             text not null references plans(id),
  stripe_sub_id       text,
  stripe_customer_id  text,
  status              text not null default 'active',  -- active | canceled | past_due
  current_period_end  timestamptz,
  created_at          timestamptz not null default now()
);

-- ── Agentes contratados por usuário ─────────────────────────
create table user_agents (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references users(id) on delete cascade,
  area_id    text not null,
  banca_id   text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, area_id, banca_id)
);

-- ── Banco de questões ────────────────────────────────────────
create table questions (
  id          uuid primary key default uuid_generate_v4(),
  area_id     text not null,
  banca_id    text not null,
  subject     text not null,
  enunciado   text not null,
  alternativas jsonb not null,           -- ["A) ...", "B) ...", ...]
  correta     text not null,             -- "A" | "B" | ...
  justificativa text,
  topico      text,
  artigo      text,
  source      text not null default 'ai',
  times_used  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index idx_q_area_banca on questions(area_id, banca_id);
create index idx_q_subject    on questions(area_id, banca_id, subject);

-- ── Flashcards ───────────────────────────────────────────────
create table flashcard_sets (
  id         uuid primary key default uuid_generate_v4(),
  area_id    text not null,
  banca_id   text not null,
  subject    text not null,
  cards      jsonb not null,             -- [{front, back}, ...]
  created_at timestamptz not null default now(),
  unique (area_id, banca_id, subject)
);

-- ── Simulados salvos (gerados pelo admin) ────────────────────
create table saved_simulados (
  id         uuid primary key default uuid_generate_v4(),
  area_id    text not null,
  banca_id   text not null,
  name       text not null,
  size       integer not null,
  questions  jsonb not null,
  created_at timestamptz not null default now()
);
create index idx_sim_area_banca on saved_simulados(area_id, banca_id);

-- ── Progresso do aluno ───────────────────────────────────────
create table user_progress (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references users(id) on delete cascade,
  area_id         text not null,
  banca_id        text not null,
  question_id     uuid references questions(id) on delete set null,
  answered_at     timestamptz not null default now(),
  correct         boolean not null,
  time_secs       integer,
  unique (user_id, question_id)
);
create index idx_prog_user on user_progress(user_id, area_id, banca_id);

-- ── Histórico de simulados ───────────────────────────────────
create table simulado_history (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references users(id) on delete cascade,
  area_id         text not null,
  banca_id        text not null,
  total           integer not null,
  correct         integer not null,
  time_secs       integer not null,
  questions       jsonb not null,
  answers         jsonb not null,
  created_at      timestamptz not null default now()
);

-- ── Refresh tokens ───────────────────────────────────────────
create table refresh_tokens (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  token_hash  text not null unique,      -- sha256 do token
  expires_at  timestamptz not null,
  revoked     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ── Row Level Security ───────────────────────────────────────
alter table users           enable row level security;
alter table subscriptions   enable row level security;
alter table user_agents     enable row level security;
alter table user_progress   enable row level security;
alter table simulado_history enable row level security;
alter table refresh_tokens  enable row level security;

-- Usuário vê só seus próprios dados
create policy "users: own row" on users
  for all using (id = auth.uid());

create policy "subscriptions: own" on subscriptions
  for all using (user_id = auth.uid());

create policy "user_agents: own" on user_agents
  for all using (user_id = auth.uid());

create policy "progress: own" on user_progress
  for all using (user_id = auth.uid());

create policy "simulado_history: own" on simulado_history
  for all using (user_id = auth.uid());

-- Questões e flashcards: leitura pública (conteúdo filtrado pela API)
create policy "questions: read" on questions
  for select using (true);

create policy "flashcards: read" on flashcard_sets
  for select using (true);

create policy "simulados: read" on saved_simulados
  for select using (true);
