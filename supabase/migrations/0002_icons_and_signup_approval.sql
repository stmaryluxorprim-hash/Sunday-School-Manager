-- ============================================================
-- 0002: Church/Service icons + link-based signup + approval flow
-- ============================================================

-- 1) Icons (lucide icon name key, rendered by the app icon map)
alter table public.churches add column if not exists icon text not null default 'church';
alter table public.services add column if not exists icon text not null default 'clipboard-list';

-- 2) Profiles: service assignment + approval status
alter table public.profiles add column if not exists service_id uuid references public.services(id) on delete set null;
alter table public.profiles add column if not exists approval_status text not null default 'pending'
  check (approval_status in ('pending','approved','rejected'));

-- Existing users keep working: approve everyone created before this migration
update public.profiles set approval_status = 'approved';

create index if not exists idx_profiles_approval on public.profiles(church_id, approval_status);

-- 3) Signup trigger: read church_id/service_id from signup metadata.
--    New users signing up via a church/service link start as 'pending'.
--    Users signing up without a link also start 'pending' (unassigned).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_church uuid;
  v_service uuid;
begin
  -- validate church from metadata (must exist and be active)
  select id into v_church from public.churches
    where id = nullif(new.raw_user_meta_data->>'church_id','')::uuid and is_active = true;

  -- validate service from metadata (must belong to that church and be active)
  if v_church is not null then
    select id into v_service from public.services
      where id = nullif(new.raw_user_meta_data->>'service_id','')::uuid
        and church_id = v_church and is_active = true;
  end if;

  insert into public.profiles (id, full_name, church_id, service_id, role, approval_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    v_church,
    v_service,
    'servant',
    'pending'
  );
  return new;
end; $$;

-- 4) Public (anon) read of active churches/services so the signup page
--    can show church & service name/icon before the user has an account.
drop policy if exists churches_public_signup_read on public.churches;
create policy churches_public_signup_read on public.churches
  for select to anon using (is_active = true);

drop policy if exists services_public_signup_read on public.services;
create policy services_public_signup_read on public.services
  for select to anon using (is_active = true);

-- 5) Helper: is the current user approved? (usable in future policies)
create or replace function public.is_approved()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select approval_status = 'approved' from public.profiles where id = auth.uid()),
    false
  );
$$;
