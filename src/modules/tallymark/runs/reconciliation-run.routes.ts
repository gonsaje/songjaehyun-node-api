import { FastifyInstance } from "fastify";
import { ReconciliationRunRepository } from "./reconciliation-run.repository";

const reconciliationRunRepository = new ReconciliationRunRepository();

export async function registerReconciliationRunRoutes(app: FastifyInstance) {
  app.get("/api/tallymark/funds/:fundId/reconciliation-runs", async (request, reply) => {
    const params = request.params as { fundId: string };
    return reconciliationRunRepository.listReconciliationRunsByFundId(params.fundId);
  });
}
