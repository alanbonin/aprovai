#!/usr/bin/env node
/**
 * Roda a migration 001_initial.sql contra o DATABASE_URL configurado no .env
 * Uso: node scripts/migrate.js
 */
require("dotenv").config({ path: "packages/api/.env" });
const { Pool } = require("pg");
const fs       = require("fs");
const path     = require("path");

const sql = fs.readFileSync(
  path.join(__dirname, "../packages/db/migrations/001_initial.sql"),
  "utf8"
);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  console.log("🔗 Conectando ao banco...");
  const client = await pool.connect();
  try {
    console.log("⚙️  Rodando migration 001_initial.sql...");
    await client.query(sql);
    console.log("✅ Migration concluída! Banco pronto.");
  } catch(e) {
    // Erros de "já existe" são normais numa re-execução
    if (e.message.includes("already exists") || e.message.includes("já existe")) {
      console.log("ℹ️  Tabelas já existem — nada a fazer.");
    } else {
      console.error("❌ Erro:", e.message);
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
})();
