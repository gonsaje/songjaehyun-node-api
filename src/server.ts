import { buildApp } from "./app";

async function start() {
  const app = buildApp();

  try {
    await app.listen({
      port: 3001,
      host: "0.0.0.0"
    });

    console.log("Node API running on http://localhost:3001");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();