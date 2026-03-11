import Fastify from "fastify";
import { registerSwagger } from "./plugins/swagger";

export function buildApp() {

  const app = Fastify({
    logger: true
  });

  registerSwagger(app);

  app.get("/health", async () => {
    return { status: "ok" };
  });

  return app;
}