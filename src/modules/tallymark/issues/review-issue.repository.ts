import { db } from "../../../db/postgres";
import { CreateReviewIssueInput, ReviewIssue, ReviewIssueStatus } from "../domain/types";

const REVIEW_ISSUE_COLUMNS = `
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
`;

export class ReviewIssueRepository {
  // Read
  async listReviewIssuesByRunId(runId: string): Promise<ReviewIssue[]> {
    const result = await db.query(
      `
        select
          ${REVIEW_ISSUE_COLUMNS}
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
          ${REVIEW_ISSUE_COLUMNS}
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
          ${REVIEW_ISSUE_COLUMNS}
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
          ${REVIEW_ISSUE_COLUMNS}
        from review_issues
        where investor_id = $1
        `,
      [investorId],
    );
    return result.rows;
  }

  async getReviewIssueById(id: string): Promise<ReviewIssue | undefined> {
    const result = await db.query(
      `
        select
          ${REVIEW_ISSUE_COLUMNS}
        from review_issues
        where id = $1
        `,
      [id],
    );
    return result.rows[0];
  }

  async updateReviewIssueStatus(
    id: string,
    status: ReviewIssueStatus,
  ): Promise<ReviewIssue | undefined> {
    const result = await db.query(
      `
        update review_issues
        set
          status = $2,
          updated_at = now()
        where id = $1
        returning
          ${REVIEW_ISSUE_COLUMNS}
      `,
      [id, status],
    );

    return result.rows[0];
  }

  async createReviewIssue(input: CreateReviewIssueInput): Promise<ReviewIssue> {
    const result = await db.query(
      `
        insert into review_issues (
          reconciliation_run_id,
          fund_id,
          transaction_id,
          investor_id,
          issue_type,
          severity,
          status,
          title,
          description,
          ai_summary,
          metadata
        )
        values (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11
        )
        returning
          ${REVIEW_ISSUE_COLUMNS}
      `,
      [
        input.reconciliationRunId,
        input.fundId,
        input.transactionId,
        input.investorId,
        input.issueType,
        input.severity,
        input.status,
        input.title,
        input.description,
        input.aiSummary,
        input.metadata,
      ],
    );

    return result.rows[0];
  }
}
