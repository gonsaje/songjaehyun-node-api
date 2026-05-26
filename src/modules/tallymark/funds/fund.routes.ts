import { FastifyInstance } from "fastify";
import { FundRepository } from "./fund.repository";

const fundRepository = new FundRepository();

export async function registerFundRoutes(app: FastifyInstance) {
  app.get("/api/tallymark/funds", async () => {
    return fundRepository.listFunds();
  });

  app.get("/api/tallymark/funds/summary", async () => {
    return fundRepository.listFundSummaries();
  });

  app.get("/api/tallymark/funds/:fundId", async (request, reply) => {
    const params = request.params as { fundId: string };
    const fund = await fundRepository.getFundById(params.fundId);

    if (!fund) {
      return reply.status(404).send({
        error: {
          code: "FUND_NOT_FOUND",
          message: `Fund with id ${params.fundId} was not found.`,
        },
      });
    }

    return fund;
  });
}
