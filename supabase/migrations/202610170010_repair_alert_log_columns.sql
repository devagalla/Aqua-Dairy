alter table public.alert_log
  add column if not exists message text,
  add column if not exists action text;

notify pgrst, 'reload schema';
