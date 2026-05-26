import { db } from "../../../db/postgres";
import { Fund, FundSummary } from "../domain/types";

export class FundRepository {
  async listFunds(): Promise<Fund[]> {
    const result = await db.query(`
            select
                id,
                name,
                strategy,
                vintage_year as "vintageYear",
                currency,
                metadata,
                created_at as "createdAt",
                updated_at as "updatedAt"
            from funds
            order by name asc
        `);

    return result.rows;
  }

  async getFundById(id: string): Promise<Fund | undefined> {
    const result = await db.query(
      `
            select
                id,
                name,
                strategy,
                vintage_year as "vintageYear",
                currency,
                metadata,
                created_at as "createdAt",
                updated_at as "updatedAt"
            from funds
            where id = $1
        `,
      [id],
    );

    return result.rows[0];
  }

  async listFundSummaries(): Promise<FundSummary[]> {
    const result = await db.query(`
            select
                f.id,
                f.name,
                f.strategy,
                f.vintage_year as "vintageYear",
                f.currency,
                f.metadata,
                f.created_at as "createdAt",
                f.updated_at as "updatedAt",
                count(distinct i.id)::int as "investorCount",
                count(distinct t.id)::int as "transactionCount",
                count(distinct rr.id)::int as "reconciliationRunCount",
                count(distinct ri.id)::int as "reviewIssueCount",
                count(distinct ri.id) filter (where ri.status = 'open')::int as "openReviewIssueCount",
                count(distinct ri.id) filter (where ri.severity = 'critical')::int as "criticalReviewIssueCount",
                latest_run.status as "latestReconciliationRunStatus",
                latest_run.created_at as "latestReconciliationRunCreatedAt"
            from funds f
            left join investors i
                on i.fund_id = f.id
            left join transactions t
                on t.fund_id = f.id
            left join reconciliation_runs rr
                on rr.fund_id = f.id
            left join review_issues ri
                on ri.fund_id = f.id
            left join lateral (
                select status, created_at
                from reconciliation_runs
                where fund_id = f.id
                order by created_at desc
                limit 1
            ) latest_run on true
            group by
                f.id,
                latest_run.status,
                latest_run.created_at
            order by f.name asc
        `);

    return result.rows;
  }
}
