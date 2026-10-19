alter table public.alert_log
  add column if not exists acknowledged_at timestamptz;

drop policy if exists "farm members can acknowledge alerts" on public.alert_log;
create policy "farm members can acknowledge alerts"
  on public.alert_log
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.water_logs w
      where w.id = alert_log.water_log_id
        and public.is_cycle_member(w.cycle_id)
    )
  )
  with check (
    exists (
      select 1
      from public.water_logs w
      where w.id = alert_log.water_log_id
        and public.is_cycle_member(w.cycle_id)
    )
  );

revoke update on table public.alert_log from public, anon, authenticated;
grant update (acknowledged_at) on table public.alert_log to authenticated;

notify pgrst, 'reload schema';
