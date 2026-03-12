import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerCors } from "./plugins/cors";
import { registerSwagger } from "./plugins/swagger";
import { registerProductRoutes } from "./modules/products/product.routes";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PATCH"],
  });
  app.register(registerSwagger);

  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.register(registerProductRoutes);

  return app;
}