import { FastifyInstance } from "fastify";
import { TransactionRepository } from "./transaction.repository";

const transactionRepository = new TransactionRepository();

export async function registerTransactionRoutes(app: FastifyInstance) {
  app.get("/api/tallymark/funds/:fundId/transactions", async (request, reply) => {
    const params = request.params as { fundId: string };
    return transactionRepository.listTransactionsByFundId(params.fundId);
  });

  app.get("/api/tallymark/investors/:investorId/transactions", async (request, reply) => {
    const params = request.params as { investorId: string };
    return transactionRepository.listTransactionsByInvestorId(params.investorId);
  });
}
