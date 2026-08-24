-- ============================================================
-- 0003: Service manager user management (scoped to his service)
-- ============================================================

-- Helper: the current user's assigned service
create or replace function public.current_service()
returns uuid language sql stable security definer set search_path = public as $$
  select service_id from public.profiles where id = auth.uid();
$$;

-- Allow service_manager to update servants inside his own church + service
-- (approve/reject requests, activate/deactivate). The WITH CHECK prevents
-- him from moving users to another church/service or escalating roles.
drop policy if exists profiles_service_manager_update on public.profiles;
create policy profiles_service_manager_update on public.profiles
  for update using (
    public.current_role() = 'service_manager'
    and id <> auth.uid()
    and church_id = public.current_church()
    and service_id = public.current_service()
    and role = 'servant'
  ) with check (
    church_id = public.current_church()
    and service_id = public.current_service()
    and role = 'servant'
  );
