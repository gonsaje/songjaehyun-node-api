import { FastifyInstance } from "fastify";
import { ReviewIssueRepository } from "./review-issue.repository";
import { ReviewIssueService } from "./review-issue.service";
import { IssueEventRepository } from "../events/issue-events.repository";
import { UpdateReviewIssueStatusInput } from "../domain/types";
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

const reviewIssueService = new ReviewIssueService(reviewIssueRepository, issueEventRepository);
const allowedReviewIssueUpdateStatuses = ["resolved", "dismissed"] as const;
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
}
