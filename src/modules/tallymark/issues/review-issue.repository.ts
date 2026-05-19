import { db } from "../../../db/postgres";
import { ReviewIssue } from "../domain/types";

export class ReviewIssueRepository {
  async listReviewIssuesByRunId(runId: string): Promise<ReviewIssue[]> {
    const result = await db.query(
      `
        select
            id,
            reconciliation_run_id as "reconciliationRunId",
            fund_id as "fundId",
            transaction_id as "transactionId",
            investor_id as "investorId",
            issue_type as "issueType",
            severity,
            status,
            title,
            description,
            ai_summary as "aiSummary",
            metadata,
            created_at as "createdAt",
            updated_at as "updatedAt"
        from review_issues
        where reconciliation_run_id = $1
        `,
      [runId],
    );
    return result.rows;
  }

  async listReviewIssuesByFundId(fundId: string): Promise<ReviewIssue[]> {
    const result = await db.query(
      `
        select
            id,
            reconciliation_run_id as "reconciliationRunId",
            fund_id as "fundId",
            transaction_id as "transactionId",
            investor_id as "investorId",
            issue_type as "issueType",
            severity,
            status,
            title,
            description,
            ai_summary as "aiSummary",
            metadata,
            created_at as "createdAt",
            updated_at as "updatedAt"
        from review_issues
        where fund_id = $1
        `,
      [fundId],
    );
    return result.rows;
  }

  async listReviewIssuesByTransactionId(transactionId: string): Promise<ReviewIssue[]> {
    const result = await db.query(
      `
        select
            id,
            reconciliation_run_id as "reconciliationRunId",
            fund_id as "fundId",
            transaction_id as "transactionId",
            investor_id as "investorId",
            issue_type as "issueType",
            severity,
            status,
            title,
            description,
            ai_summary as "aiSummary",
            metadata,
            created_at as "createdAt",
            updated_at as "updatedAt"
        from review_issues
        where transaction_id = $1
        `,
      [transactionId],
    );
    return result.rows;
  }

  async listReviewIssuesByInvestorId(investorId: string): Promise<ReviewIssue[]> {
    const result = await db.query(
      `
        select
            id,
            reconciliation_run_id as "reconciliationRunId",
            fund_id as "fundId",
            transaction_id as "transactionId",
            investor_id as "investorId",
            issue_type as "issueType",
            severity,
            status,
            title,
            description,
            ai_summary as "aiSummary",
            metadata,
            created_at as "createdAt",
            updated_at as "updatedAt"
        from review_issues
        where investor_id = $1
        `,
      [investorId],
    );
    return result.rows;
  }

  async getReviewIssueById(id: string): Promise<ReviewIssue[]> {
    const result = await db.query(
      `
        select
            id,
            reconciliation_run_id as "reconciliationRunId",
            fund_id as "fundId",
            transaction_id as "transactionId",
            investor_id as "investorId",
            issue_type as "issueType",
            severity,
            status,
            title,
            description,
            ai_summary as "aiSummary",
            metadata,
            created_at as "createdAt",
            updated_at as "updatedAt"
        from review_issues
        where id = $1
        `,
      [id],
    );
    return result.rows[0];
  }
}
