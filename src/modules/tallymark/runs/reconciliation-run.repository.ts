import { db } from "../../../db/postgres";
import { ReconciliationRun } from "../domain/types";

const RECONCILIATION_RUN_COLUMNS = `
  id,
  fund_id as "fundId",
  status,
  started_at as "startedAt",
  completed_at as "completedAt",
  scheduled_at as "scheduledAt",
  trigger_run_id as "triggerRunId",
  ai_summary as "aiSummary",
  error_message as "errorMessage",
  metadata,
  created_at as "createdAt",
  updated_at as "updatedAt"
`;

export class ReconciliationRunRepository {
  async listReconciliationRunsByFundId(fundId: string): Promise<ReconciliationRun[]> {
    const result = await db.query(
      `
        select
          ${RECONCILIATION_RUN_COLUMNS}
        from reconciliation_runs
        where fund_id = $1
        `,
      [fundId],
    );
    return result.rows;
  }

  async getReconciliationRunById(id: string): Promise<ReconciliationRun | undefined> {
    const result = await db.query(
      `
        select
          ${RECONCILIATION_RUN_COLUMNS}
        from reconciliation_runs
        where id = $1
        `,
      [id],
    );
    return result.rows[0];
  }

  async createQueuedRun(fundId: string): Promise<ReconciliationRun> {
    const result = await db.query(
      `
        insert into reconciliation_runs (
          fund_id,
          status,
          started_at,
          completed_at,
          ai_summary,
          error_message,
          metadata
        )
        values (
          $1,
          'queued',
          null,
          null,
          null,
          null,
          '{}'::jsonb
        )
        returning
          ${RECONCILIATION_RUN_COLUMNS}
      `,
      [fundId],
    );

    return result.rows[0];
  }

  async createProcessingRun(fundId: string): Promise<ReconciliationRun> {
    const result = await db.query(
      `
        insert into reconciliation_runs (
          fund_id,
          status,
          started_at,
          completed_at,
          ai_summary,
          error_message,
          metadata
        )
        values (
          $1,
          'processing',
          now(),
          null,
          null,
          null,
          '{}'::jsonb
        )
        returning
          ${RECONCILIATION_RUN_COLUMNS}
      `,
      [fundId],
    );

    return result.rows[0];
  }

  async createScheduledRun(fundId: string, scheduledAt: string): Promise<ReconciliationRun> {
    const result = await db.query(
      `
        insert into reconciliation_runs (
          fund_id,
          status,
          started_at,
          completed_at,
          scheduled_at,
          trigger_run_id,
          ai_summary,
          error_message,
          metadata
        )
        values (
          $1,
          'queued',
          null,
          null,
          $2,
          null,
          null,
          null,
          '{}'::jsonb
        )
        returning
          ${RECONCILIATION_RUN_COLUMNS}
      `,
      [fundId, scheduledAt],
    );

    return result.rows[0];
  }

  async markProcessingRun(reconciliationRunId: string): Promise<ReconciliationRun> {
    const result = await db.query(
      `
      update reconciliation_runs
      set
        status = 'processing',
        started_at = now(),
        updated_at = now()
      where id = $1
      returning 
        ${RECONCILIATION_RUN_COLUMNS}
      `,
      [reconciliationRunId],
    );
    return result.rows[0];
  }

  async markTriggerRunId(runId: string, triggerRunId: string): Promise<ReconciliationRun> {
    const result = await db.query(
      `
        update reconciliation_runs
        set
          trigger_run_id = $2,
          updated_at = now()
        where id = $1
        returning
          ${RECONCILIATION_RUN_COLUMNS}
      `,
      [runId, triggerRunId],
    );

    return result.rows[0];
  }

  async markRunCancelled(runId: string): Promise<ReconciliationRun> {
    const result = await db.query(
      `
        update reconciliation_runs
        set
          status = 'cancelled',
          completed_at = now(),
          updated_at = now()
        where id = $1
        returning
          ${RECONCILIATION_RUN_COLUMNS}
      `,
      [runId],
    );

    return result.rows[0];
  }

  async markRunCompleted(runId: string, aiSummary: string): Promise<ReconciliationRun> {
    const result = await db.query(
      `
        update reconciliation_runs
        set
          status = 'completed',
          completed_at = now(),
          ai_summary = $2,
          updated_at = now()
        where id = $1
        returning
          ${RECONCILIATION_RUN_COLUMNS}
      `,
      [runId, aiSummary],
    );

    return result.rows[0];
  }

  async markRunFailed(runId: string, errorMessage: string): Promise<ReconciliationRun> {
    const result = await db.query(
      `
        update reconciliation_runs
        set
          status = 'failed',
          completed_at = now(),
          error_message = $2,
          updated_at = now()
        where id = $1
        returning
          ${RECONCILIATION_RUN_COLUMNS}
      `,
      [runId, errorMessage],
    );

    return result.rows[0];
  }
}
