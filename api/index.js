const buildApp = require("../packages/api/src/app");

let app;
let ready = false;

module.exports = async (req, res) => {
  if (!app) {
    app = buildApp();
    await app.ready();
    ready = true;
  }
  if (!ready) await app.ready();
  app.server.emit("request", req, res);
};
