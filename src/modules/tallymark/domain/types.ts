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
