-- ============================================================
-- 0004: Pictures for churches / services / users (webp uploads)
-- ============================================================

-- 1) Picture columns (profiles already has avatar_url)
alter table public.churches add column if not exists picture_url text;
alter table public.services add column if not exists picture_url text;

-- 2) Storage bucket for all app pictures (churches/services/avatars)
insert into storage.buckets (id, name, public)
values ('app-pictures', 'app-pictures', true)
on conflict (id) do nothing;

drop policy if exists "app pictures read" on storage.objects;
create policy "app pictures read" on storage.objects
  for select using (bucket_id = 'app-pictures');

drop policy if exists "app pictures write" on storage.objects;
create policy "app pictures write" on storage.objects
  for insert with check (bucket_id = 'app-pictures' and auth.role() = 'authenticated');

drop policy if exists "app pictures update" on storage.objects;
create policy "app pictures update" on storage.objects
  for update using (bucket_id = 'app-pictures' and auth.role() = 'authenticated');

drop policy if exists "app pictures delete" on storage.objects;
create policy "app pictures delete" on storage.objects
  for delete using (bucket_id = 'app-pictures' and auth.role() = 'authenticated');
