import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import UsersManager, { type UserRow } from '@/components/UsersManager';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  // service_manager and above can access; scoping is applied below.
  const profile = await requireRole('service_manager');
  const supabase = await createClient();

  // NOTE: profiles → services has two possible relationships (service_id FK
  // and the service_members join table). The embed must be disambiguated
  // with !service_id, otherwise PostgREST returns PGRST201 and users is null.
  let query = supabase
    .from('profiles')
    .select('*, churches!church_id(name), services!service_id(name)');

  // church_manager: only his church (+ unassigned users so he can attach them)
  if (profile.role === 'church_manager' && profile.church_id) {
    query = query.or(`church_id.eq.${profile.church_id},church_id.is.null`);
  }

  // service_manager: only users of HIS service
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

  // Sort: church name → service name → full name (nulls last)
  const sorted = ((users as UserRow[]) ?? []).sort((a, b) => {
    const ca = a.churches?.name ?? '\uffff';
    const cb = b.churches?.name ?? '\uffff';
    if (ca !== cb) return ca.localeCompare(cb, 'ar');
    const sa = a.services?.name ?? '\uffff';
    const sb = b.services?.name ?? '\uffff';
    if (sa !== sb) return sa.localeCompare(sb, 'ar');
    return (a.full_name ?? '').localeCompare(b.full_name ?? '', 'ar');
  });

  // Churches & services lists for the edit modal
  // owner: all; church_manager: his church only. RLS enforces this too.
  const [churchesRes, servicesRes] = await Promise.all([
    profile.role === 'app_owner'
      ? supabase.from('churches').select('id, name').eq('is_active', true).order('name')
      : profile.church_id
        ? supabase.from('churches').select('id, name').eq('id', profile.church_id)
        : Promise.resolve({ data: [] }),
    profile.role === 'app_owner'
      ? supabase.from('services').select('id, church_id, name').eq('is_active', true).order('name')
      : profile.church_id
        ? supabase
            .from('services')
            .select('id, church_id, name')
            .eq('church_id', profile.church_id)
            .eq('is_active', true)
            .order('name')
        : Promise.resolve({ data: [] }),
  ]);

  const scopeHint =
    profile.role === 'service_manager'
      ? 'إدارة خدام خدمتك وطلبات الانضمام لها.'
      : profile.role === 'church_manager'
        ? 'إدارة أدوار وخدمات الخدام في كنيستك. طلبات الانضمام الجديدة بتظهر هنا لموافقتك.'
        : 'إدارة جميع المستخدمين على المنصة — الكنيسة والخدمة والدور.';

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-2xl font-bold text-gray-800">المستخدمون</h2>
      <p className="text-sm text-gray-500">{scopeHint}</p>
      <UsersManager
        users={sorted}
        churches={(churchesRes.data as { id: string; name: string }[]) ?? []}
        services={(servicesRes.data as { id: string; church_id: string; name: string }[]) ?? []}
        currentProfile={profile}
      />
    </div>
  );
}
