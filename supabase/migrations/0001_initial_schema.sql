-- ============================================================
-- Church Services Management Platform - Initial Schema
-- Multi-tenant architecture with RBAC
-- Run this in Supabase SQL Editor (or via supabase db push)
-- ============================================================

-- ---------- ENUMS ----------
create type public.app_role as enum ('app_owner', 'church_manager', 'service_manager', 'servant');

-- ---------- CHURCHES (Tenants) ----------
create table public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- PROFILES (linked to auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  church_id uuid references public.churches(id) on delete set null,
  role public.app_role not null default 'servant',
  full_name text not null default '',
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- SERVICES ----------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Which servants/managers are assigned to which service
create table public.service_members (
  service_id uuid not null references public.services(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  primary key (service_id, profile_id)
);

-- ---------- CHILDREN ----------
create table public.children (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  child_code text not null,                      -- unique per church
  name text not null,
  date_of_birth date,
  phone_number text,
  address text,
  notes text,
  attendance_count integer not null default 0,   -- number of times attended
  points integer not null default 0,
  picture_url text,                              -- Supabase Storage bucket 'children-pictures'
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (church_id, child_code)
);

create index idx_children_church on public.children(church_id);
create index idx_children_service on public.children(service_id);
create index idx_children_code on public.children(church_id, child_code);

-- ---------- ATTENDANCE LOG ----------
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  attended_on date not null default current_date,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (child_id, attended_on)                 -- one attendance per child per day
);

create index idx_attendance_church on public.attendance(church_id);
create index idx_attendance_child on public.attendance(child_id);

-- ---------- POINTS LOG ----------
create table public.points_log (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  delta integer not null,                        -- +/- points
  reason text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_points_child on public.points_log(child_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep children.attendance_count in sync with attendance rows
create or replace function public.sync_attendance_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.children set attendance_count = attendance_count + 1, updated_at = now()
      where id = new.child_id;
  elsif (tg_op = 'DELETE') then
    update public.children set attendance_count = greatest(attendance_count - 1, 0), updated_at = now()
      where id = old.child_id;
  end if;
  return null;
end; $$;

create trigger trg_sync_attendance
  after insert or delete on public.attendance
  for each row execute function public.sync_attendance_count();

-- Keep children.points in sync with points_log
create or replace function public.sync_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.children set points = greatest(points + new.delta, 0), updated_at = now()
    where id = new.child_id;
  return null;
end; $$;

create trigger trg_sync_points
  after insert on public.points_log
  for each row execute function public.sync_points();

-- ============================================================
-- RBAC HELPER FUNCTIONS (used inside RLS policies)
-- ============================================================
create or replace function public.current_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_church()
returns uuid language sql stable security definer set search_path = public as $$
  select church_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_app_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'app_owner' from public.profiles where id = auth.uid()), false);
$$;

-- ============================================================
-- ROW LEVEL SECURITY (multi-tenant isolation)
-- ============================================================
alter table public.churches enable row level security;
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.service_members enable row level security;
alter table public.children enable row level security;
alter table public.attendance enable row level security;
alter table public.points_log enable row level security;

-- CHURCHES: app_owner full access; members can read their own church
create policy churches_owner_all on public.churches
  for all using (public.is_app_owner()) with check (public.is_app_owner());
create policy churches_member_read on public.churches
  for select using (id = public.current_church());

-- PROFILES
create policy profiles_self_read on public.profiles
  for select using (id = auth.uid());
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid());
create policy profiles_owner_all on public.profiles
  for all using (public.is_app_owner()) with check (public.is_app_owner());
create policy profiles_manager_read on public.profiles
  for select using (
    public.current_role() in ('church_manager','service_manager')
    and church_id = public.current_church()
  );
create policy profiles_manager_update on public.profiles
  for update using (
    public.current_role() = 'church_manager'
    and church_id = public.current_church()
  );
-- Allow church_manager to attach unassigned users to their church
create policy profiles_manager_claim on public.profiles
  for update using (
    public.current_role() = 'church_manager' and church_id is null
  );
-- Allow managers to see unassigned users (to attach them)
create policy profiles_manager_read_unassigned on public.profiles
  for select using (
    public.current_role() = 'church_manager' and church_id is null
  );

-- SERVICES: tenant-scoped
create policy services_owner_all on public.services
  for all using (public.is_app_owner()) with check (public.is_app_owner());
create policy services_member_read on public.services
  for select using (church_id = public.current_church());
create policy services_manager_write on public.services
  for all using (
    public.current_role() = 'church_manager' and church_id = public.current_church()
  ) with check (
    public.current_role() = 'church_manager' and church_id = public.current_church()
  );

-- SERVICE MEMBERS
create policy sm_owner_all on public.service_members
  for all using (public.is_app_owner()) with check (public.is_app_owner());
create policy sm_member_read on public.service_members
  for select using (
    exists (select 1 from public.services s where s.id = service_id and s.church_id = public.current_church())
  );
create policy sm_manager_write on public.service_members
  for all using (
    public.current_role() in ('church_manager','service_manager')
    and exists (select 1 from public.services s where s.id = service_id and s.church_id = public.current_church())
  ) with check (
    public.current_role() in ('church_manager','service_manager')
    and exists (select 1 from public.services s where s.id = service_id and s.church_id = public.current_church())
  );

-- CHILDREN: all church members read; servants+ can write within their church
create policy children_owner_all on public.children
  for all using (public.is_app_owner()) with check (public.is_app_owner());
create policy children_member_read on public.children
  for select using (church_id = public.current_church());
create policy children_member_write on public.children
  for all using (
    public.current_role() in ('church_manager','service_manager','servant')
    and church_id = public.current_church()
  ) with check (
    public.current_role() in ('church_manager','service_manager','servant')
    and church_id = public.current_church()
  );

-- ATTENDANCE
create policy attendance_owner_all on public.attendance
  for all using (public.is_app_owner()) with check (public.is_app_owner());
create policy attendance_member_read on public.attendance
  for select using (church_id = public.current_church());
create policy attendance_member_write on public.attendance
  for insert with check (church_id = public.current_church());
create policy attendance_member_delete on public.attendance
  for delete using (church_id = public.current_church());

-- POINTS LOG
create policy points_owner_all on public.points_log
  for all using (public.is_app_owner()) with check (public.is_app_owner());
create policy points_member_read on public.points_log
  for select using (church_id = public.current_church());
create policy points_member_write on public.points_log
  for insert with check (church_id = public.current_church());

-- ============================================================
-- STORAGE: bucket for children pictures
-- ============================================================
insert into storage.buckets (id, name, public) values ('children-pictures', 'children-pictures', true)
on conflict (id) do nothing;

create policy "pictures read" on storage.objects
  for select using (bucket_id = 'children-pictures');
create policy "pictures write" on storage.objects
  for insert with check (bucket_id = 'children-pictures' and auth.role() = 'authenticated');
create policy "pictures update" on storage.objects
  for update using (bucket_id = 'children-pictures' and auth.role() = 'authenticated');
create policy "pictures delete" on storage.objects
  for delete using (bucket_id = 'children-pictures' and auth.role() = 'authenticated');
