import { FastifyInstance } from "fastify";
import { IssueEventRepository } from "./issue-events.repository";

const issueEventRepository = new IssueEventRepository();

export async function registerIssueEventRoutes(app: FastifyInstance) {
  app.get("/api/tallymark/review-issues/:reviewIssueId/issue-events", (request, reply) => {
    const params = request.params as { reviewIssueId: string };
    return issueEventRepository.listIssueEventsByReviewIssueId(params.reviewIssueId);
  });

  app.get("/api/tallymark/issue-events/:issueEventId", async (request, reply) => {
    const params = request.params as { issueEventId: string };
    const issueEvent = await issueEventRepository.getIssueEventById(params.issueEventId);

    if (!issueEvent) {
      return reply.status(404).send({
        error: {
          code: "EVENT_NOT_FOUND",
          message: `Issue Event with id ${params.issueEventId} was not found.`,
        },
      });
    }

    return issueEvent;
  });
}
