import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import UsersManager from '@/components/UsersManager';
import type { Profile } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  // service_manager and above can access; scoping is applied below.
  const profile = await requireRole('service_manager');
  const supabase = await createClient();

  // NOTE: profiles → services has two possible relationships (service_id FK
  // and the service_members join table). The embed must be disambiguated
  // with !service_id, otherwise PostgREST returns PGRST201 and users is null,
  // hiding the whole list including the pending-approval queue.
  let query = supabase
    .from('profiles')
    .select('*, services!service_id(name)')
    .order('full_name');

  // church_manager: only his church (+ unassigned users so he can attach them)
  if (profile.role === 'church_manager' && profile.church_id) {
    query = query.or(`church_id.eq.${profile.church_id},church_id.is.null`);
  }

  // service_manager: only users of HIS service (RLS also limits reads to his church)
  if (profile.role === 'service_manager') {
    if (!profile.service_id) {
      return (
        <div className="space-y-4 mt-4">
          <h2 className="text-2xl font-bold text-gray-800">المستخدمون</h2>
          <section className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center text-amber-700 text-sm">
            حسابك غير مرتبط بخدمة بعد — تواصل مع مدير الكنيسة.
          </section>
        </div>
      );
    }
    query = query.eq('service_id', profile.service_id);
  }

  const { data: users, error } = await query;
  if (error) console.error('users query failed:', error.message);

  const scopeHint =
    profile.role === 'service_manager'
      ? 'إدارة خدام خدمتك وطلبات الانضمام لها.'
      : profile.role === 'church_manager'
        ? 'إدارة أدوار الخدام في كنيستك. طلبات الانضمام الجديدة بتظهر هنا لموافقتك.'
        : 'إدارة جميع المستخدمين على المنصة.';

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-2xl font-bold text-gray-800">المستخدمون</h2>
      <p className="text-sm text-gray-500">{scopeHint}</p>
      <UsersManager
        users={(users as (Profile & { services?: { name: string } | null })[]) ?? []}
        currentProfile={profile}
      />
    </div>
  );
}
