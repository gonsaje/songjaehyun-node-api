import { db } from "./db/postgres";
import fastify from "fastify";
import { registerSwagger } from "./plugins/swagger";
import { registerProductRoutes } from "./modules/products/product.routes";
import { registerTallymarkRoutes } from "./modules/tallymark/tallymark.routes";
import { registerCors } from "./plugins/cors";

export async function buildApp() {
  const app = fastify({
    logger: true,
  });

  await registerCors(app);

  app.register(registerSwagger);

  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.get("/health/db", async () => {
    const result = await db.query("select now() as now");

    return {
      status: "ok",
      databaseTime: result.rows[0].now,
    };
  });

  app.register(registerProductRoutes);
  app.register(registerTallymarkRoutes);

  return app;
}
