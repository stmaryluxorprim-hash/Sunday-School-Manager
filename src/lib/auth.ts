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
  if (!hasMinRole(profile.role, minRole)) redirect('/dashboard');

  return profile as Profile;
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
