import { FastifyInstance } from "fastify";
import { FundRepository } from "../funds/fund.repository";
import { ReconciliationRunRepository } from "./reconciliation-run.repository";
import { ReconciliationRunService } from "./reconciliation-run.service";

const fundRepository = new FundRepository();
const reconciliationRunRepository = new ReconciliationRunRepository();
const reconciliationRunService = new ReconciliationRunService(
  reconciliationRunRepository,
  fundRepository,
);

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

  app.post("/api/tallymark/funds/:fundId/reconciliation-runs", async (request, reply) => {
    const params = request.params as { fundId: string };

    const run = await reconciliationRunService.startRun(params.fundId);

    if (!run) {
      return reply.status(404).send({
        error: {
          code: "FUND_NOT_FOUND",
          message: `Fund with id ${params.fundId} was not found.`,
        },
      });
    }

    return reply.status(201).send(run);
  });
}
