import { FastifyInstance } from "fastify";
import { ReviewIssueRepository } from "./review-issue.repository";

const reviewIssueRepository = new ReviewIssueRepository();

export async function registerReviewIssueRoutes(app: FastifyInstance) {
  app.get(
    "/api/tallymark/reconciliation-runs/:reconciliationRunId/review-issues",
    (request, reply) => {
      const params = request.params as { reconciliationRunId: string };
      return reviewIssueRepository.listReviewIssuesByRunId(params.reconciliationRunId);
    },
  );

  app.get("/api/tallymark/funds/:fundId/review-issues", (request, reply) => {
    const params = request.params as { fundId: string };
    return reviewIssueRepository.listReviewIssuesByFundId(params.fundId);
  });

  app.get("/api/tallymark/transactions/:transactionId/review-issues", (request, reply) => {
    const params = request.params as { transactionId: string };
    return reviewIssueRepository.listReviewIssuesByTransactionId(params.transactionId);
  });

  app.get("/api/tallymark/investors/:investorId/review-issues", (request, reply) => {
    const params = request.params as { investorId: string };
    return reviewIssueRepository.listReviewIssuesByInvestorId(params.investorId);
  });

  app.get("/api/tallymark/review-issues/:reviewIssueId", async (request, reply) => {
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
  });
}
