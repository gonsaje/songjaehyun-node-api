import { FastifyInstance } from "fastify";
import { InvestorRepository } from "./investor.repository";

const investorRepository = new InvestorRepository();

export async function registerInvestorRoutes(app: FastifyInstance) {
  app.get("/api/tallymark/funds/:fundId/investors", async (request, reply) => {
    const params = request.params as { fundId: string };
    return investorRepository.listInvestorsByFundId(params.fundId);
  });

  app.get("/api/tallymark/investors/:investorId", async (request, reply) => {
    const params = request.params as { investorId: string };
    const investor = await investorRepository.listInvestorsByFundId(params.investorId);

    if (!investor) {
      return reply.status(404).send({
        error: {
          code: "INVESTOR_NOT_FOUND",
          message: `Investor with id ${params.investorId} was not found.`,
        },
      });
    }
  });
}
