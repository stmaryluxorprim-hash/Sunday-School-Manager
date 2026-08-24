import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import UsersManager, { type UserRow } from '@/components/UsersManager';
import FilterSelect from '@/components/FilterSelect';
import { ROLE_LEVEL } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { church?: string; service?: string };
}) {
  // service_manager and above can access; scoping is applied below.
  const profile = await requireRole('service_manager');
  const supabase = await createClient();

  const isOwner = profile.role === 'app_owner';
  const isChurchManager = profile.role === 'church_manager';

  // Filters from URL (dropdowns)
  const filterChurch = isOwner ? searchParams.church || null : null;
  const filterService =
    isOwner || isChurchManager ? searchParams.service || null : null;

  // NOTE: profiles → services has two possible relationships (service_id FK
  // and the service_members join table). The embed must be disambiguated
  // with !service_id, otherwise PostgREST returns PGRST201 and users is null.
  let query = supabase
    .from('profiles')
    .select('*, churches!church_id(name), services!service_id(name)');

  // owner: optional church/service filters ("" = all)
  if (isOwner) {
    if (filterChurch) query = query.eq('church_id', filterChurch);
    if (filterService) query = query.eq('service_id', filterService);
  }

  // church_manager: only his church (+ unassigned users so he can attach them),
  // optional service filter
  if (isChurchManager && profile.church_id) {
    if (filterService) {
      query = query.eq('service_id', filterService);
    } else {
      query = query.or(`church_id.eq.${profile.church_id},church_id.is.null`);
    }
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

  // Hierarchy defense-in-depth (RLS also enforces this):
  // - never show the app owner to anyone else
  // - never show users of a HIGHER role level than the viewer
  const myLevel = ROLE_LEVEL[profile.role];
  const visible = ((users as UserRow[]) ?? []).filter((u) => {
    if (u.id === profile.id) return false; // self is edited from settings page
    if (!isOwner && u.role === 'app_owner') return false;
    if (!isOwner && ROLE_LEVEL[u.role] > myLevel) return false;
    return true;
  });

  // Sort: church name → service name → full name (nulls last)
  const sorted = visible.sort((a, b) => {
    const ca = a.churches?.name ?? '\uffff';
    const cb = b.churches?.name ?? '\uffff';
    if (ca !== cb) return ca.localeCompare(cb, 'ar');
    const sa = a.services?.name ?? '\uffff';
    const sb = b.services?.name ?? '\uffff';
    if (sa !== sb) return sa.localeCompare(sb, 'ar');
    return (a.full_name ?? '').localeCompare(b.full_name ?? '', 'ar');
  });

  // Churches & services lists (for filters + edit modal)
  // owner: all; church_manager: his church only. RLS enforces this too.
  const [churchesRes, servicesRes] = await Promise.all([
    isOwner
      ? supabase.from('churches').select('id, name').order('name')
      : profile.church_id
        ? supabase.from('churches').select('id, name').eq('id', profile.church_id)
        : Promise.resolve({ data: [] }),
    isOwner
      ? supabase.from('services').select('id, church_id, name').order('name')
      : profile.church_id
        ? supabase
            .from('services')
            .select('id, church_id, name')
            .eq('church_id', profile.church_id)
            .order('name')
        : Promise.resolve({ data: [] }),
  ]);

  const churches = (churchesRes.data as { id: string; name: string }[]) ?? [];
  const services =
    (servicesRes.data as { id: string; church_id: string; name: string }[]) ?? [];

  // Owner's service dropdown follows the chosen church (if any)
  const serviceFilterOptions = filterChurch
    ? services.filter((s) => s.church_id === filterChurch)
    : services;

  const scopeHint =
    profile.role === 'service_manager'
      ? 'إدارة خدام خدمتك وطلبات الانضمام لها.'
      : isChurchManager
        ? 'إدارة أدوار وخدمات الخدام في كنيستك. طلبات الانضمام الجديدة بتظهر هنا لموافقتك.'
        : 'إدارة جميع المستخدمين على المنصة — الكنيسة والخدمة والدور.';

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-2xl font-bold text-gray-800">المستخدمون</h2>
      <p className="text-sm text-gray-500">{scopeHint}</p>

      {/* Filters */}
      {(isOwner || isChurchManager) && (
        <div className="flex gap-2">
          {isOwner && (
            <FilterSelect
              paramKey="church"
              label="الكنيسة"
              value={filterChurch ?? ''}
              options={[
                { value: '', label: 'كل الكنائس' },
                ...churches.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          )}
          <FilterSelect
            paramKey="service"
            label="الخدمة"
            value={filterService ?? ''}
            options={[
              { value: '', label: 'كل الخدمات' },
              ...serviceFilterOptions.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        </div>
      )}

      <UsersManager
        users={sorted}
        churches={churches}
        services={services}
        currentProfile={profile}
      />
    </div>
  );
}
