alter table reconciliation_runs
  add column scheduled_at timestamptz,
  add column trigger_run_id text;

create index reconciliation_runs_scheduled_at_idx
  on reconciliation_runs(scheduled_at);
