import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { AppRole, Profile } from '@/lib/types';
import { hasMinRole } from '@/lib/types';

/**
 * Server-side guard: returns the current user's profile.
 * Redirects to /login if unauthenticated,
 * or /dashboard if the role is insufficient.
 */
export async function requireRole(minRole: AppRole = 'servant'): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  const p = profile as Profile;
  // Block unapproved accounts (app_owner is always allowed)
  if (p.role !== 'app_owner' && p.approval_status !== 'approved') redirect('/pending');
  if (!hasMinRole(p.role, minRole)) redirect('/dashboard');

  return p;
}

export type ProfileWithContext = Profile & {
  churches: { name: string; icon: string; picture_url: string | null } | null;
  services: { name: string; icon: string; picture_url: string | null } | null;
};

/** Profile + church & service names (embeds disambiguated by FK). */
export async function getProfileWithContext(): Promise<ProfileWithContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, churches!church_id(name, icon, picture_url), services!service_id(name, icon, picture_url)')
    .eq('id', user.id)
    .single();

  return (profile as ProfileWithContext) ?? null;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (profile as Profile) ?? null;
}
