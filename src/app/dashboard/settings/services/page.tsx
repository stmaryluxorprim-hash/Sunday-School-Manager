import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import ServicesManager, { type ServiceRow } from '@/components/ServicesManager';
import FilterSelect from '@/components/FilterSelect';
import type { Church } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: { church?: string };
}) {
  // Services management is for church_manager and app_owner only
  const profile = await requireRole('church_manager');
  const supabase = await createClient();

  const isOwner = profile.role === 'app_owner';

  // Owner: dropdown of churches incl. "كل الكنائس" (all churches).
  // Church manager: locked to his own church.
  let churches: Church[] = [];
  let selectedChurch: string | null = profile.church_id;

  if (isOwner) {
    const { data } = await supabase
      .from('churches')
      .select('*')
      .order('name');
    churches = (data as Church[]) ?? [];
    selectedChurch = searchParams.church || null; // '' / undefined => all churches
  }

  if (!isOwner && !selectedChurch) {
    return (
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center mt-8 text-amber-700">
        حسابك غير مرتبط بكنيسة بعد
      </section>
    );
  }

  // Query services — join church name for the "all churches" owner view
  let query = supabase
    .from('services')
    .select('*, churches!church_id(name)');
  if (selectedChurch) query = query.eq('church_id', selectedChurch);
  const { data } = await query;

  const services = ((data as ServiceRow[]) ?? []).sort((a, b) => {
    const c = (a.churches?.name ?? '').localeCompare(b.churches?.name ?? '', 'ar');
    if (c !== 0) return c;
    return a.name.localeCompare(b.name, 'ar');
  });

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-2xl font-bold text-gray-800">الخدمات</h2>

      {/* Owner: church dropdown incl. all churches */}
      {isOwner && (
        <FilterSelect
          paramKey="church"
          label="الكنيسة"
          value={selectedChurch ?? ''}
          options={[
            { value: '', label: 'كل الكنائس' },
            ...churches.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
      )}

      <ServicesManager
        churchId={selectedChurch}
        services={services}
        canManage={profile.role === 'church_manager' || isOwner}
        showChurchName={isOwner && !selectedChurch}
      />
    </div>
  );
}
