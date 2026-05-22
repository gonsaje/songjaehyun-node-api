import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  IssueEvent,
  ReviewIssue,
  ReviewIssueStatus,
} from "../../src/modules/tallymark/domain/types";
import type { IssueEventRepository } from "../../src/modules/tallymark/events/issue-events.repository";
import type { ReviewIssueRepository } from "../../src/modules/tallymark/issues/review-issue.repository";
import { ReviewIssueService } from "../../src/modules/tallymark/issues/review-issue.service";

const openIssue: ReviewIssue = {
  id: "issue-1",
  reconciliationRunId: "run-1",
  fundId: "fund-1",
  transactionId: "transaction-1",
  investorId: "investor-1",
  issueType: "missing_settlement_date",
  severity: "low",
  status: "open",
  title: "Missing settlement date",
  description: "The transaction has no settlement date.",
  aiSummary: null,
  metadata: {},
  createdAt: "2026-05-22T00:00:00.000Z",
  updatedAt: "2026-05-22T00:00:00.000Z",
};

function buildService(issue: ReviewIssue | undefined) {
  const statusUpdates: Array<{ id: string; status: ReviewIssueStatus }> = [];
  const statusEvents: Array<{
    reviewIssueId: string;
    fromStatus: ReviewIssueStatus;
    toStatus: ReviewIssueStatus;
    note: string;
  }> = [];

  const reviewIssueRepository = {
    async getReviewIssueById() {
      return issue;
    },
    async updateReviewIssueStatus(id: string, status: ReviewIssueStatus) {
      statusUpdates.push({ id, status });

      return issue ? { ...issue, status } : undefined;
    },
  } as unknown as ReviewIssueRepository;

  const issueEventRepository = {
    async createStatusChangedEvent(input: (typeof statusEvents)[number]): Promise<IssueEvent> {
      statusEvents.push(input);

      return {
        id: "event-1",
        reviewIssueId: input.reviewIssueId,
        eventType: "status_changed",
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        note: input.note,
        metadata: {},
        createdAt: "2026-05-22T00:00:00.000Z",
      };
    },
  } as unknown as IssueEventRepository;

  return {
    service: new ReviewIssueService(reviewIssueRepository, issueEventRepository),
    statusEvents,
    statusUpdates,
  };
}

describe("ReviewIssueService", () => {
  it("updates an open issue and records a trimmed status event note", async () => {
    const { service, statusEvents, statusUpdates } = buildService(openIssue);

    const updatedIssue = await service.updateStatus("issue-1", {
      status: "resolved",
      note: "  Confirmed against cash detail.  ",
    });

    assert.equal(updatedIssue?.status, "resolved");
    assert.deepEqual(statusUpdates, [{ id: "issue-1", status: "resolved" }]);
    assert.deepEqual(statusEvents, [
      {
        reviewIssueId: "issue-1",
        fromStatus: "open",
        toStatus: "resolved",
        note: "Confirmed against cash detail.",
      },
    ]);
  });

  it("returns undefined when the issue does not exist", async () => {
    const { service, statusEvents, statusUpdates } = buildService(undefined);

    const updatedIssue = await service.updateStatus("missing-issue", {
      status: "dismissed",
      note: "Not actionable.",
    });

    assert.equal(updatedIssue, undefined);
    assert.deepEqual(statusUpdates, []);
    assert.deepEqual(statusEvents, []);
  });

  it("rejects updates for issues that are no longer open", async () => {
    const { service, statusEvents, statusUpdates } = buildService({
      ...openIssue,
      status: "resolved",
    });

    await assert.rejects(
      service.updateStatus("issue-1", {
        status: "dismissed",
        note: "Duplicate.",
      }),
      /Only open review issues can be resolved or dismissed/,
    );

    assert.deepEqual(statusUpdates, []);
    assert.deepEqual(statusEvents, []);
  });

  it("requires a non-empty status change note", async () => {
    const { service, statusEvents, statusUpdates } = buildService(openIssue);

    await assert.rejects(
      service.updateStatus("issue-1", {
        status: "resolved",
        note: "   ",
      }),
      /A note is required when changing review issue status/,
    );

    assert.deepEqual(statusUpdates, []);
    assert.deepEqual(statusEvents, []);
  });
});
