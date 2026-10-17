-- Remove every existing policy on these two related tables. Older policy names
-- can otherwise remain permissive and continue to trigger recursive RLS checks.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('farms', 'farm_members')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end
$$;

alter table public.farms enable row level security;
alter table public.farm_members enable row level security;

create or replace function public.is_farm_member(target_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1
    from public.farm_members fm
    where fm.farm_id = target_farm_id
      and fm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_farm_owner(target_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1
    from public.farms f
    where f.id = target_farm_id
      and f.owner_id = (select auth.uid())
  );
$$;

revoke all on function public.is_farm_member(uuid) from public, anon;
revoke all on function public.is_farm_owner(uuid) from public, anon;
grant execute on function public.is_farm_member(uuid) to authenticated;
grant execute on function public.is_farm_owner(uuid) to authenticated;

create policy "farm owners and members can view farms"
  on public.farms
  for select
  to authenticated
  using (owner_id = (select auth.uid()) or public.is_farm_member(id));

create policy "users can create their own farms"
  on public.farms
  for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "farm owners can update farms"
  on public.farms
  for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "farm owners can delete farms"
  on public.farms
  for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- This policy deliberately checks only the caller's own membership row.
-- Do not query farms here: farms policies consult is_farm_member().
create policy "users can view their own farm memberships"
  on public.farm_members
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "farm owners can add members"
  on public.farm_members
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_farm_owner(farm_id)
  );

create policy "farm owners can remove members"
  on public.farm_members
  for delete
  to authenticated
  using (public.is_farm_owner(farm_id));
