import { FastifyInstance } from "fastify";
import { registerFundRoutes } from "./funds/fund.routes";
import { registerInvestorRoutes } from "./investors/investor.routes";
import { registerTransactionRoutes } from "./transactions/transaction.routes";

export async function registerTallymarkRoutes(app: FastifyInstance) {
  app.register(registerFundRoutes);
  app.register(registerInvestorRoutes);
  app.register(registerTransactionRoutes);
}
