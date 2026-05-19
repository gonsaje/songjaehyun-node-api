import { FastifyInstance } from "fastify";
import { InvestorRepository } from "./investor.repository";

const investorRepository = new InvestorRepository();

export async function registerInvestorRoutes(app: FastifyInstance) {
  app.get("/api/tallymark/funds/:fundId/investors", async (request, reply) => {
    const params = request.params as { fundId: string };
    return investorRepository.listInvestorsByFundId(params.fundId);
  });
}
