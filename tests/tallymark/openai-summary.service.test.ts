import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ReviewIssue } from "../../src/modules/tallymark/domain/types";
import { OpenAiSummaryService } from "../../src/modules/tallymark/ai/openai-summary.service";

const issue: ReviewIssue = {
  id: "issue-1",
  reconciliationRunId: "run-1",
  fundId: "fund-1",
  transactionId: "transaction-1",
  investorId: "investor-1",
  issueType: "missing_settlement_date",
  severity: "low",
  status: "open",
  title: "Missing settlement date for NS-CC-2024-NO-SETTLE",
  description: "The transaction has a transaction date but no settlement date.",
  aiSummary: null,
  metadata: {
    reference: "NS-CC-2024-NO-SETTLE",
  },
  createdAt: "2026-05-24T00:00:00.000Z",
  updatedAt: "2026-05-24T00:00:00.000Z",
};

describe("OpenAiSummaryService", () => {
  it("returns a fixed summary when there are no review issues", async () => {
    const service = new OpenAiSummaryService(
      {
        responses: {
          async create() {
            throw new Error("should not call OpenAI for zero issues");
          },
        },
      },
      "test-model",
    );

    const summary = await service.summarizeReconciliationRun({
      fundName: "Northstar Private Markets Fund I",
      runId: "run-1",
      issues: [],
    });

    assert.equal(summary, "Reconciliation completed with no review issues.");
  });

  it("sends bounded issue context to OpenAI and returns trimmed output text", async () => {
    const requests: Array<{
      model: string;
      instructions: string;
      input: string;
      max_output_tokens: number;
    }> = [];

    const service = new OpenAiSummaryService(
      {
        responses: {
          async create(request) {
            requests.push(request);
            return {
              output_text: "  Review the missing settlement date against bank records.  ",
            };
          },
        },
      },
      "test-model",
    );

    const summary = await service.summarizeReconciliationRun({
      fundName: "Northstar Private Markets Fund I",
      runId: "run-1",
      issues: [issue],
    });

    assert.equal(summary, "Review the missing settlement date against bank records.");
    assert.equal(requests.length, 1);
    assert.equal(requests[0].model, "test-model");
    assert.equal(requests[0].max_output_tokens, 450);
    assert.match(requests[0].instructions, /Do not invent amounts/);

    const input = JSON.parse(requests[0].input) as {
      fundName: string;
      runId: string;
      issues: Array<Partial<ReviewIssue>>;
    };

    assert.equal(input.fundName, "Northstar Private Markets Fund I");
    assert.equal(input.runId, "run-1");
    assert.deepEqual(input.issues, [
      {
        issueType: "missing_settlement_date",
        severity: "low",
        title: "Missing settlement date for NS-CC-2024-NO-SETTLE",
        description: "The transaction has a transaction date but no settlement date.",
        metadata: {
          reference: "NS-CC-2024-NO-SETTLE",
        },
      },
    ]);
  });

  it("returns a deterministic fallback summary when OpenAI fails", async () => {
    const service = new OpenAiSummaryService(
      {
        responses: {
          async create() {
            throw new Error("rate limited");
          },
        },
      },
      "test-model",
    );

    const summary = await service.summarizeReconciliationRun({
      fundName: "Northstar Private Markets Fund I",
      runId: "run-1",
      issues: [
        issue,
        {
          ...issue,
          id: "issue-2",
          severity: "high",
          issueType: "duplicate_transaction_reference",
        },
      ],
    });

    assert.equal(
      summary,
      "Reconciliation completed with 2 review issue(s) requiring human review: 1 low, 1 high.",
    );
  });

  it("returns a deterministic fallback summary when OpenAI returns blank text", async () => {
    const service = new OpenAiSummaryService(
      {
        responses: {
          async create() {
            return {
              output_text: "   ",
            };
          },
        },
      },
      "test-model",
    );

    const summary = await service.summarizeReconciliationRun({
      fundName: "Northstar Private Markets Fund I",
      runId: "run-1",
      issues: [issue],
    });

    assert.equal(
      summary,
      "Reconciliation completed with 1 review issue(s) requiring human review: 1 low.",
    );
  });
});
