-- ============================================================
-- Seed / bootstrap script
-- 1. Sign up your first user from the app (or Supabase dashboard)
-- 2. Then run the lines below in Supabase SQL Editor, replacing the email
-- ============================================================

-- Make yourself the App Owner:
-- update public.profiles set role = 'app_owner'
--   where id = (select id from auth.users where email = 'YOUR_EMAIL_HERE');

-- Create a demo church:
-- insert into public.churches (name, address) values ('كنيسة السيدة العذراء - الأقصر', 'Luxor, Egypt');

-- Attach a user to a church as church_manager:
-- update public.profiles set
--   church_id = (select id from public.churches limit 1),
--   role = 'church_manager'
--   where id = (select id from auth.users where email = 'MANAGER_EMAIL_HERE');
