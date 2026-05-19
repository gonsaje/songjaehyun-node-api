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

  app.get("/api/tallymark/transactions/:transactionId", async (request, reply) => {
    const params = request.params as { transactionId: string };
    const transaction = await transactionRepository.getTransactionById(params.transactionId);

    if (!transaction) {
      return reply.status(404).send({
        error: {
          code: "TRANSACTION_NOT_FOUND",
          message: `Transaction with id ${params.transactionId} was not found.`,
        },
      });
    }

    return transaction;
  });
}
