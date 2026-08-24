-- ============================================================
-- 0005: Owner privacy, role hierarchy enforcement, delete rights
-- ============================================================
-- 1. The app owner's profile is invisible to everyone else and
--    can only be modified by the owner himself.
-- 2. Managers can only see/act on users strictly below their level:
--      church_manager  -> service_manager, servant (his church)
--      service_manager -> servant (his service; can also see peers read-only)
-- 3. Delete rights:
--      owner           -> anything (existing *_owner_all policies)
--      church_manager  -> service_manager/servant in his church
--      service_manager -> servants in his service
-- ============================================================

-- ------------------------------------------------------------
-- Re-scope manager read: hide app_owner rows; limit service_manager
-- to his own service only.
-- ------------------------------------------------------------
drop policy if exists profiles_manager_read on public.profiles;
create policy profiles_manager_read on public.profiles
  for select using (
    (
      public.current_role() = 'church_manager'
      and church_id = public.current_church()
      and role <> 'app_owner'
    )
    or (
      public.current_role() = 'service_manager'
      and church_id = public.current_church()
      and service_id = public.current_service()
      and role in ('service_manager','servant')
    )
  );

-- ------------------------------------------------------------
-- Church manager update: never touch app_owner rows, never
-- escalate anyone to app_owner.
-- ------------------------------------------------------------
drop policy if exists profiles_manager_update on public.profiles;
create policy profiles_manager_update on public.profiles
  for update using (
    public.current_role() = 'church_manager'
    and church_id = public.current_church()
    and id <> auth.uid()
    and role <> 'app_owner'
  ) with check (
    role <> 'app_owner'
  );

-- ------------------------------------------------------------
-- Church manager claiming unassigned users: exclude owners.
-- ------------------------------------------------------------
drop policy if exists profiles_manager_claim on public.profiles;
create policy profiles_manager_claim on public.profiles
  for update using (
    public.current_role() = 'church_manager'
    and church_id is null
    and role <> 'app_owner'
  ) with check (
    church_id = public.current_church()
    and role <> 'app_owner'
  );

drop policy if exists profiles_manager_read_unassigned on public.profiles;
create policy profiles_manager_read_unassigned on public.profiles
  for select using (
    public.current_role() = 'church_manager'
    and church_id is null
    and role <> 'app_owner'
  );

-- ------------------------------------------------------------
-- Delete policies
-- ------------------------------------------------------------
drop policy if exists profiles_manager_delete on public.profiles;
create policy profiles_manager_delete on public.profiles
  for delete using (
    public.current_role() = 'church_manager'
    and church_id = public.current_church()
    and id <> auth.uid()
    and role in ('service_manager','servant')
  );

drop policy if exists profiles_service_manager_delete on public.profiles;
create policy profiles_service_manager_delete on public.profiles
  for delete using (
    public.current_role() = 'service_manager'
    and church_id = public.current_church()
    and service_id = public.current_service()
    and id <> auth.uid()
    and role = 'servant'
  );

-- ------------------------------------------------------------
-- Hard protection: nobody except the owner himself may delete
-- or demote an app_owner profile (even through owner-level
-- policies applied by another future owner account).
-- ------------------------------------------------------------
create or replace function public.protect_owner_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if old.role = 'app_owner' and old.id <> auth.uid() then
      raise exception 'Cannot delete the app owner profile';
    end if;
    return old;
  end if;
  if old.role = 'app_owner' and old.id <> auth.uid() then
    raise exception 'Cannot modify the app owner profile';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_owner_delete on public.profiles;
create trigger trg_protect_owner_delete
  before update or delete on public.profiles
  for each row execute function public.protect_owner_profile();
