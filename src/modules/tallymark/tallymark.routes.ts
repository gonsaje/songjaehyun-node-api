import { FastifyInstance } from "fastify";
import { registerFundRoutes } from "./funds/fund.routes";

export async function registerTallymarkRoutes(app: FastifyInstance) {
  app.register(registerFundRoutes);
}
