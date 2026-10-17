drop policy if exists "members can view farm memberships" on farm_members;
create policy "members can view farm memberships" on farm_members
  for select using (user_id = auth.uid());
