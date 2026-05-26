import { FastifyInstance, FastifyReply } from "fastify";
import { ReviewIssueRepository } from "./review-issue.repository";
import { ReviewIssueService } from "./review-issue.service";
import { ReviewIssueResolutionService } from "./review-issue-resolution.service";
import { IssueEventRepository } from "../events/issue-events.repository";
import { TransactionType, UpdateReviewIssueStatusInput } from "../domain/types";
import { TransactionRepository } from "../transactions/transaction.repository";
import { InvestorRepository } from "../investors/investor.repository";
import {
  errorResponseSchema,
  fundParamsSchema,
  reconciliationRunParamsSchema,
  reviewIssueParamsSchema,
  reviewIssueSchema,
} from "../openapi.schemas";
import { InMemoryRateLimiter } from "../../../shared/rate-limit/in-memory-rate-limiter";

const reviewIssueRepository = new ReviewIssueRepository();
const issueEventRepository = new IssueEventRepository();
const transactionRepository = new TransactionRepository();
const investorRepository = new InvestorRepository();

const reviewIssueService = new ReviewIssueService(reviewIssueRepository, issueEventRepository);
const reviewIssueResolutionService = new ReviewIssueResolutionService(
  reviewIssueRepository,
  reviewIssueService,
  transactionRepository,
  investorRepository,
);
const allowedReviewIssueUpdateStatuses = ["resolved", "dismissed"] as const;
const allowedTransactionTypes: TransactionType[] = [
  "capital_call",
  "distribution",
  "management_fee",
  "expense",
  "investment_wire",
];
const reviewIssueRateLimiter = new InMemoryRateLimiter(10, 5 * 60 * 1000);

export async function registerReviewIssueRoutes(app: FastifyInstance) {
  app.get(
    "/api/tallymark/reconciliation-runs/:reconciliationRunId/review-issues",
    {
      schema: {
        tags: ["Tallymark"],
        summary: "List review issues for a reconciliation run",
        params: reconciliationRunParamsSchema,
        response: {
          200: {
            type: "array",
            items: reviewIssueSchema,
          },
        },
      },
    },
    (request, reply) => {
      const params = request.params as { reconciliationRunId: string };
      return reviewIssueRepository.listReviewIssuesByRunId(params.reconciliationRunId);
    },
  );

  app.get(
    "/api/tallymark/funds/:fundId/review-issues",
    {
      schema: {
        tags: ["Tallymark"],
        summary: "List review issues for a fund",
        params: fundParamsSchema,
        response: {
          200: {
            type: "array",
            items: reviewIssueSchema,
          },
        },
      },
    },
    (request, reply) => {
      const params = request.params as { fundId: string };
      return reviewIssueRepository.listReviewIssuesByFundId(params.fundId);
    },
  );

  app.get("/api/tallymark/transactions/:transactionId/review-issues", (request, reply) => {
    const params = request.params as { transactionId: string };
    return reviewIssueRepository.listReviewIssuesByTransactionId(params.transactionId);
  });

  app.get("/api/tallymark/investors/:investorId/review-issues", (request, reply) => {
    const params = request.params as { investorId: string };
    return reviewIssueRepository.listReviewIssuesByInvestorId(params.investorId);
  });

  app.get(
    "/api/tallymark/review-issues/:reviewIssueId",
    {
      schema: {
        tags: ["Tallymark"],
        summary: "Get a review issue",
        params: reviewIssueParamsSchema,
        response: {
          200: reviewIssueSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { reviewIssueId: string };
      const reviewIssue = await reviewIssueRepository.getReviewIssueById(params.reviewIssueId);

      if (!reviewIssue) {
        return reply.status(404).send({
          error: {
            code: "ISSUE_NOT_FOUND",
            message: `Review issue with id ${params.reviewIssueId} was not found.`,
          },
        });
      }

      return reviewIssue;
    },
  );

  app.patch(
    "/api/tallymark/review-issues/:reviewIssueId/status",
    {
      schema: {
        tags: ["Tallymark"],
        summary: "Resolve or dismiss a review issue",
        params: reviewIssueParamsSchema,
        body: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["resolved", "dismissed"] },
            note: { type: "string", minLength: 1 },
          },
          required: ["status", "note"],
        },
        response: {
          200: reviewIssueSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { reviewIssueId: string };
      const body = request.body as Partial<UpdateReviewIssueStatusInput>;

      const rateLimit = reviewIssueRateLimiter.check(
        `tallymark:review-issue:${params.reviewIssueId}`,
      );

      if (!rateLimit.allowed) {
        return reply
          .status(429)
          .header("Retry-After", String(rateLimit.retryAfterSeconds ?? 60))
          .send({
            error: {
              code: "TOO_MANY_ISSUE_UPDATES",
              message: "Too many updates made for this issue. Try again later.",
            },
          });
      }

      if (
        !body.status ||
        !allowedReviewIssueUpdateStatuses.includes(body.status as "resolved" | "dismissed")
      ) {
        return reply.status(400).send({
          error: {
            code: "INVALID_STATUS",
            message: "status must be one of: resolved, dismissed",
          },
        });
      }

      if (!body.note || typeof body.note !== "string" || !body.note.trim()) {
        return reply.status(400).send({
          error: {
            code: "INVALID_NOTE",
            message: "note is required",
          },
        });
      }

      try {
        const updatedIssue = await reviewIssueService.updateStatus(params.reviewIssueId, {
          status: body.status,
          note: body.note,
        });

        if (!updatedIssue) {
          return reply.status(404).send({
            error: {
              code: "ISSUE_NOT_FOUND",
              message: `Review issue with id ${params.reviewIssueId} was not found.`,
            },
          });
        }

        return updatedIssue;
      } catch (error) {
        return reply.status(400).send({
          error: {
            code: "INVALID_STATUS_TRANSITION",
            message:
              error instanceof Error ? error.message : "Invalid review issue status transition.",
          },
        });
      }
    },
  );

  app.patch(
    "/api/tallymark/review-issues/:reviewIssueId/actions/add-settlement-date",
    {
      schema: {
        tags: ["Tallymark"],
        summary: "Fix a missing settlement date issue",
        params: reviewIssueParamsSchema,
        body: {
          type: "object",
          properties: {
            settlementDate: { type: "string", format: "date" },
            note: { type: "string", minLength: 1 },
          },
          required: ["settlementDate", "note"],
        },
        response: {
          200: { type: "object", additionalProperties: true },
          400: errorResponseSchema,
          404: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { reviewIssueId: string };
      const body = request.body as { settlementDate?: string; note?: string };
      const rateLimit = reviewIssueRateLimiter.check(
        `tallymark:review-issue:${params.reviewIssueId}:action`,
      );

      if (!rateLimit.allowed) {
        return sendRateLimit(reply);
      }

      if (!body.settlementDate || !body.note?.trim()) {
        return reply.status(400).send({
          error: {
            code: "INVALID_ACTION_INPUT",
            message: "settlementDate and note are required",
          },
        });
      }

      try {
        const result = await reviewIssueResolutionService.addSettlementDate(params.reviewIssueId, {
          settlementDate: body.settlementDate,
          note: body.note,
        });

        if (!result) {
          return sendIssueNotFound(reply, params.reviewIssueId);
        }

        return result;
      } catch (error) {
        return sendActionError(reply, error);
      }
    },
  );

  app.patch(
    "/api/tallymark/review-issues/:reviewIssueId/actions/assign-investor",
    {
      schema: {
        tags: ["Tallymark"],
        summary: "Assign an investor to fix an unmatched transaction issue",
        params: reviewIssueParamsSchema,
        body: {
          type: "object",
          properties: {
            investorId: { type: "string", format: "uuid" },
            note: { type: "string", minLength: 1 },
          },
          required: ["investorId", "note"],
        },
        response: {
          200: { type: "object", additionalProperties: true },
          400: errorResponseSchema,
          404: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { reviewIssueId: string };
      const body = request.body as { investorId?: string; note?: string };
      const rateLimit = reviewIssueRateLimiter.check(
        `tallymark:review-issue:${params.reviewIssueId}:action`,
      );

      if (!rateLimit.allowed) {
        return sendRateLimit(reply);
      }

      if (!body.investorId || !body.note?.trim()) {
        return reply.status(400).send({
          error: {
            code: "INVALID_ACTION_INPUT",
            message: "investorId and note are required",
          },
        });
      }

      try {
        const result = await reviewIssueResolutionService.assignInvestor(params.reviewIssueId, {
          investorId: body.investorId,
          note: body.note,
        });

        if (!result) {
          return sendIssueNotFound(reply, params.reviewIssueId);
        }

        return result;
      } catch (error) {
        return sendActionError(reply, error);
      }
    },
  );

  app.patch(
    "/api/tallymark/review-issues/:reviewIssueId/actions/update-reference",
    {
      schema: {
        tags: ["Tallymark"],
        summary: "Correct a duplicate transaction reference",
        params: reviewIssueParamsSchema,
        body: {
          type: "object",
          properties: {
            reference: { type: "string", minLength: 1 },
            note: { type: "string", minLength: 1 },
          },
          required: ["reference", "note"],
        },
        response: {
          200: { type: "object", additionalProperties: true },
          400: errorResponseSchema,
          404: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { reviewIssueId: string };
      const body = request.body as { reference?: string; note?: string };
      const rateLimit = reviewIssueRateLimiter.check(
        `tallymark:review-issue:${params.reviewIssueId}:action`,
      );

      if (!rateLimit.allowed) {
        return sendRateLimit(reply);
      }

      if (!body.reference?.trim() || !body.note?.trim()) {
        return reply.status(400).send({
          error: {
            code: "INVALID_ACTION_INPUT",
            message: "reference and note are required",
          },
        });
      }

      try {
        const result = await reviewIssueResolutionService.updateReference(params.reviewIssueId, {
          reference: body.reference,
          note: body.note,
        });

        if (!result) {
          return sendIssueNotFound(reply, params.reviewIssueId);
        }

        return result;
      } catch (error) {
        return sendActionError(reply, error);
      }
    },
  );

  app.patch(
    "/api/tallymark/review-issues/:reviewIssueId/actions/classify-transaction",
    {
      schema: {
        tags: ["Tallymark"],
        summary: "Classify an unknown transaction type",
        params: reviewIssueParamsSchema,
        body: {
          type: "object",
          properties: {
            transactionType: { type: "string", enum: allowedTransactionTypes },
            note: { type: "string", minLength: 1 },
          },
          required: ["transactionType", "note"],
        },
        response: {
          200: { type: "object", additionalProperties: true },
          400: errorResponseSchema,
          404: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { reviewIssueId: string };
      const body = request.body as { transactionType?: TransactionType; note?: string };
      const rateLimit = reviewIssueRateLimiter.check(
        `tallymark:review-issue:${params.reviewIssueId}:action`,
      );

      if (!rateLimit.allowed) {
        return sendRateLimit(reply);
      }

      if (
        !body.transactionType ||
        !allowedTransactionTypes.includes(body.transactionType) ||
        !body.note?.trim()
      ) {
        return reply.status(400).send({
          error: {
            code: "INVALID_ACTION_INPUT",
            message: "transactionType and note are required",
          },
        });
      }

      try {
        const result = await reviewIssueResolutionService.classifyTransaction(
          params.reviewIssueId,
          {
            transactionType: body.transactionType,
            note: body.note,
          },
        );

        if (!result) {
          return sendIssueNotFound(reply, params.reviewIssueId);
        }

        return result;
      } catch (error) {
        return sendActionError(reply, error);
      }
    },
  );
}

function sendRateLimit(reply: FastifyReply) {
  return reply
    .status(429)
    .header("Retry-After", "60")
    .send({
      error: {
        code: "TOO_MANY_ISSUE_UPDATES",
        message: "Too many updates made for this issue. Try again later.",
      },
    });
}

function sendIssueNotFound(reply: FastifyReply, reviewIssueId: string) {
  return reply.status(404).send({
    error: {
      code: "ISSUE_NOT_FOUND",
      message: `Review issue with id ${reviewIssueId} was not found.`,
    },
  });
}

function sendActionError(reply: FastifyReply, error: unknown) {
  return reply.status(400).send({
    error: {
      code: "INVALID_ISSUE_ACTION",
      message: error instanceof Error ? error.message : "Issue action could not be applied.",
    },
  });
}
