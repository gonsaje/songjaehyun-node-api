import { db } from "../../../db/postgres";
import { Investor, InvestorSummary } from "../domain/types";

const INVESTOR_COLUMNS = `
  id,
  fund_id as "fundId",
  name,
  commitment_amount as "commitmentAmount",
  metadata,
  created_at as "createdAt",
  updated_at as "updatedAt"
`;

export class InvestorRepository {
  async listInvestorsByFundId(fundId: string): Promise<Investor[]> {
    const result = await db.query(
      `
        select
            ${INVESTOR_COLUMNS}
        from investors
        where fund_id = $1
    `,
      [fundId],
    );

    return result.rows;
  }

  async getInvestorById(investorId: string): Promise<Investor | undefined> {
    const result = await db.query(
      `
        select
            ${INVESTOR_COLUMNS}
        from investors
        where id = $1
    `,
      [investorId],
    );

    return result.rows[0];
  }

  async listInvestorSummaries(): Promise<InvestorSummary[]> {
    const result = await db.query(`
        select
            i.id,
            i.fund_id as "fundId",
            f.name as "fundName",
            i.name,
            i.commitment_amount as "commitmentAmount",
            i.metadata,
            i.created_at as "createdAt",
            i.updated_at as "updatedAt",
            coalesce(transaction_summary.transaction_count, 0)::int as "transactionCount",
            coalesce(transaction_summary.capital_call_count, 0)::int as "capitalCallCount",
            coalesce(transaction_summary.distribution_count, 0)::int as "distributionCount",
            coalesce(transaction_summary.total_transaction_amount, 0)::text as "totalTransactionAmount",
            coalesce(issue_summary.review_issue_count, 0)::int as "reviewIssueCount",
            coalesce(issue_summary.open_review_issue_count, 0)::int as "openReviewIssueCount",
            coalesce(issue_summary.critical_review_issue_count, 0)::int as "criticalReviewIssueCount",
            transaction_summary.latest_transaction_date as "latestTransactionDate"
        from investors i
        join funds f
            on f.id = i.fund_id
        left join (
            select
                investor_id,
                count(*)::int as transaction_count,
                count(*) filter (where transaction_type = 'capital_call')::int as capital_call_count,
                count(*) filter (where transaction_type = 'distribution')::int as distribution_count,
                sum(amount) as total_transaction_amount,
                max(transaction_date) as latest_transaction_date
            from transactions
            where investor_id is not null
            group by investor_id
        ) transaction_summary
            on transaction_summary.investor_id = i.id
        left join (
            select
                investor_id,
                count(*)::int as review_issue_count,
                count(*) filter (where status = 'open')::int as open_review_issue_count,
                count(*) filter (where severity = 'critical')::int as critical_review_issue_count
            from review_issues
            where investor_id is not null
            group by investor_id
        ) issue_summary
            on issue_summary.investor_id = i.id
        order by f.name asc, i.name asc
    `);

    return result.rows;
  }

  async listInvestorSummariesByFundId(fundId: string): Promise<InvestorSummary[]> {
    const result = await db.query(
      `
        select
            i.id,
            i.fund_id as "fundId",
            f.name as "fundName",
            i.name,
            i.commitment_amount as "commitmentAmount",
            i.metadata,
            i.created_at as "createdAt",
            i.updated_at as "updatedAt",
            coalesce(transaction_summary.transaction_count, 0)::int as "transactionCount",
            coalesce(transaction_summary.capital_call_count, 0)::int as "capitalCallCount",
            coalesce(transaction_summary.distribution_count, 0)::int as "distributionCount",
            coalesce(transaction_summary.total_transaction_amount, 0)::text as "totalTransactionAmount",
            coalesce(issue_summary.review_issue_count, 0)::int as "reviewIssueCount",
            coalesce(issue_summary.open_review_issue_count, 0)::int as "openReviewIssueCount",
            coalesce(issue_summary.critical_review_issue_count, 0)::int as "criticalReviewIssueCount",
            transaction_summary.latest_transaction_date as "latestTransactionDate"
        from investors i
        join funds f
            on f.id = i.fund_id
        left join (
            select
                investor_id,
                count(*)::int as transaction_count,
                count(*) filter (where transaction_type = 'capital_call')::int as capital_call_count,
                count(*) filter (where transaction_type = 'distribution')::int as distribution_count,
                sum(amount) as total_transaction_amount,
                max(transaction_date) as latest_transaction_date
            from transactions
            where investor_id is not null
            group by investor_id
        ) transaction_summary
            on transaction_summary.investor_id = i.id
        left join (
            select
                investor_id,
                count(*)::int as review_issue_count,
                count(*) filter (where status = 'open')::int as open_review_issue_count,
                count(*) filter (where severity = 'critical')::int as critical_review_issue_count
            from review_issues
            where investor_id is not null
            group by investor_id
        ) issue_summary
            on issue_summary.investor_id = i.id
        where i.fund_id = $1
        order by i.name asc
    `,
      [fundId],
    );

    return result.rows;
  }
}
