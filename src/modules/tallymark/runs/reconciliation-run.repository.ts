import { db } from "../../../db/postgres";
import { ReconciliationRun } from "../domain/types";

export class ReconciliationRunRepository {
  async listReconciliationRunsByFundId(fundId: string): Promise<ReconciliationRun[]> {
    const result = await db.query(
      `
        select
            id,
            fund_id as "fundId",
            status,
            started_at as "startedAt",
            completed_at as "completedAt",
            ai_summary as "aiSummary",
            error_message as "errorMessage",
            metadata,
            created_at as "createdAt",
            updated_at as "updatedAt"
        from reconciliation_runs
        where fund_id = $1
        `,
      [fundId],
    );
    return result.rows;
  }
}
