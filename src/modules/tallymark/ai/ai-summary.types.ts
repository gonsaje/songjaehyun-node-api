import type { CreateReviewIssueInput, ReviewIssue } from "../domain/types";

export interface ReconciliationSummaryInput {
  fundName: string;
  runId: string;
  issues: ReviewIssue[];
}

export interface AiSummaryService {
  summarizeReviewIssue(input: CreateReviewIssueInput): Promise<string>;
  summarizeReconciliationRun(input: ReconciliationSummaryInput): Promise<string>;
}
