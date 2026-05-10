require("dotenv").config();
const buildApp = require("./app");

const app = buildApp();
const PORT = process.env.PORT || 3001;

app.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(`\n✅ AprovAI API rodando em http://localhost:${PORT}`);
});
