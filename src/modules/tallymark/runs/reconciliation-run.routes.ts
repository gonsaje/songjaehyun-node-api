import { FastifyInstance } from "fastify";
import { FundRepository } from "../funds/fund.repository";
import { ReconciliationRunRepository } from "./reconciliation-run.repository";
import { ReconciliationRunService } from "./reconciliation-run.service";
import { TransactionRepository } from "../transactions/transaction.repository";
import { ReviewIssueRepository } from "../issues/review-issue.repository";
import { OpenAiSummaryService } from "../ai/openai-summary.service";
import {
  errorResponseSchema,
  fundParamsSchema,
  reconciliationRunParamsSchema,
  reconciliationRunSchema,
} from "../openapi.schemas";

const fundRepository = new FundRepository();
const reconciliationRunRepository = new ReconciliationRunRepository();
const transactionRepository = new TransactionRepository();
const reviewIssueRepository = new ReviewIssueRepository();
const aiSummaryService = new OpenAiSummaryService();
const reconciliationRunService = new ReconciliationRunService(
  reconciliationRunRepository,
  fundRepository,
  transactionRepository,
  reviewIssueRepository,
  aiSummaryService,
);

export async function registerReconciliationRunRoutes(app: FastifyInstance) {
  app.get(
    "/api/tallymark/funds/:fundId/reconciliation-runs",
    {
      schema: {
        tags: ["Tallymark"],
        summary: "List reconciliation runs for a fund",
        params: fundParamsSchema,
        response: {
          200: {
            type: "array",
            items: reconciliationRunSchema,
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { fundId: string };
      return reconciliationRunRepository.listReconciliationRunsByFundId(params.fundId);
    },
  );

  app.get(
    "/api/tallymark/reconciliation-runs/:reconciliationRunId",
    {
      schema: {
        tags: ["Tallymark"],
        summary: "Get a reconciliation run",
        params: reconciliationRunParamsSchema,
        response: {
          200: reconciliationRunSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
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
    },
  );

  app.post(
    "/api/tallymark/funds/:fundId/reconciliation-runs",
    {
      schema: {
        tags: ["Tallymark"],
        summary: "Start a reconciliation run for a fund",
        description:
          "Runs deterministic reconciliation checks, creates review issues, generates an AI summary, and stores the completed run.",
        params: fundParamsSchema,
        response: {
          201: reconciliationRunSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
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
    },
  );
}
