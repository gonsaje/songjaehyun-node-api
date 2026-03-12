import { buildApp } from "./app";

async function start() {
  const app = await buildApp();

  const PORT = Number(process.env.PORT) || 3001;

  try {
    const address = await app.listen({
      port: PORT,
      host: "0.0.0.0",
    });

    app.log.info(`Node API running at ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();