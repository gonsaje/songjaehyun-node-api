export type ReconciliationRunStatus = "queued" | "processing" | "completed" | "failed";

export type ReviewIssueStatus = "open" | "resolved" | "dismissed";

export type ReviewIssueSeverity = "low" | "medium" | "high" | "critical";

export type TransactionType =
  | "capital_call"
  | "distribution"
  | "management_fee"
  | "expense"
  | "investment_wire";

export type ReviewIssueType =
  | "missing_investor"
  | "duplicate_transaction_reference"
  | "capital_call_underpayment"
  | "capital_call_overpayment"
  | "missing_settlement_date"
  | "distribution_without_investor"
  | "amount_exceeds_remaining_commitment"
  | "unknown_transaction_type";

export type IssueEventType = "created" | "ai_summary_generated" | "status_changed" | "note_added";

export interface Fund {
  id: string;
  name: string;
  strategy: string;
  vintageYear: number | null;
  currency: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Investor {
  id: string;
  fundId: string;
  name: string;
  commitmentAmount: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  fundId: string;
  investorId: string | null;
  transactionType: TransactionType;
  reference: string;
  amount: string;
  expectedAmount: string | null;
  transactionDate: string;
  settlementDate: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationRun {
  id: string;
  fundId: string;
  status: ReconciliationRunStatus;
  startedAt: string | null;
  completedAt: string | null;
  aiSummary: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewIssue {
  id: string;
  reconciliationRunId: string;
  fundId: string;
  transactionId: string | null;
  investorId: string | null;
  issueType: ReviewIssueType;
  severity: ReviewIssueSeverity;
  status: ReviewIssueStatus;
  title: string;
  description: string;
  aiSummary: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface IssueEvent {
  id: string;
  reviewIssueId: string;
  eventType: IssueEventType;
  fromStatus: ReviewIssueStatus | null;
  toStatus: ReviewIssueStatus | null;
  note: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface UpdateReviewIssueStatusInput {
  status: "resolved" | "dismissed";
  note: string;
}

export interface CreateReviewIssueInput {
  reconciliationRunId: string;
  fundId: string;
  transactionId: string | null;
  investorId: string | null;
  issueType: ReviewIssueType;
  severity: ReviewIssueSeverity;
  status: ReviewIssueStatus;
  title: string;
  description: string;
  aiSummary?: string | null;
  metadata: Record<string, unknown>;
}
