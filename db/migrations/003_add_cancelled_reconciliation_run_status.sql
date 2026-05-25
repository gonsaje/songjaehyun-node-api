alter table reconciliation_runs
  drop constraint reconciliation_runs_status_check;

alter table reconciliation_runs
  add constraint reconciliation_runs_status_check
    check (status in ('queued', 'processing', 'completed', 'failed', 'cancelled'));
