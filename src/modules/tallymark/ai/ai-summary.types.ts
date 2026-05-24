import type { ReviewIssue } from "../domain/types";

export interface ReconciliationSummaryInput {
  fundName: string;
  runId: string;
  issues: ReviewIssue[];
}

export interface AiSummaryService {
  summarizeReconciliationRun(input: ReconciliationSummaryInput): Promise<string>;
}
