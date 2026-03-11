import Fastify from "fastify";
import { registerSwagger } from "./plugins/swagger";
import { registerProductRoutes } from "./modules/products/product.routes";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(registerSwagger);

  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.register(registerProductRoutes);

  return app;
}