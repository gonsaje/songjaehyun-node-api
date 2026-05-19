import { FastifyInstance } from "fastify";
import { ReconciliationRunRepository } from "./reconciliation-run.repository";

const reconciliationRunRepository = new ReconciliationRunRepository();

export async function registerReconciliationRunRoutes(app: FastifyInstance) {
  app.get("/api/tallymark/funds/:fundId/reconciliation-runs", async (request, reply) => {
    const params = request.params as { fundId: string };
    return reconciliationRunRepository.listReconciliationRunsByFundId(params.fundId);
  });

  app.get("/api/tallymark/reconciliation-runs/:reconciliationRunId", async (request, reply) => {
    const params = request.params as { reconciliationRunId: string };
    const reconciliationRun = await reconciliationRunRepository.getReconciliationRunById(
      params.reconciliationRunId,
    );

    if (!reconciliationRun) {
      return reply.status(404).send({
        error: {
          code: "RUN_NOT_FOUND",
          message: `Reconciliation run with id ${params.reconciliationRunId} was not found.`,
        },
      });
    }

    return reconciliationRun;
  });
}
