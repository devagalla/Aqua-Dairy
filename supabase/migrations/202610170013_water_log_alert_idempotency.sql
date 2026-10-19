delete from public.alert_log duplicate
using public.alert_log keeper
where duplicate.id > keeper.id
  and duplicate.rule_id is not null
  and duplicate.water_log_id is not null
  and duplicate.rule_id = keeper.rule_id
  and duplicate.water_log_id = keeper.water_log_id;

create unique index if not exists alert_log_rule_water_unique_idx
  on public.alert_log(rule_id, water_log_id);

notify pgrst, 'reload schema';
