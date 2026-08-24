import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import ServicesManager from '@/components/ServicesManager';
import type { Church, Service } from '@/lib/types';
import Link from 'next/link';
import { AppIcon } from '@/lib/icons';

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

  // Owner can manage services of ANY church — church picker via ?church=
  let churches: Church[] = [];
  let churchId = profile.church_id;

  if (isOwner) {
    const { data } = await supabase
      .from('churches')
      .select('*')
      .eq('is_active', true)
      .order('name');
    churches = (data as Church[]) ?? [];
    churchId = searchParams.church ?? profile.church_id ?? churches[0]?.id ?? null;
  }

  if (!churchId) {
    return (
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center mt-8 text-amber-700">
        {isOwner ? 'لا توجد كنائس بعد — أضف كنيسة أولاً' : 'حسابك غير مرتبط بكنيسة بعد'}
      </section>
    );
  }

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('church_id', churchId)
    .order('name');

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-2xl font-bold text-gray-800">الخدمات</h2>

      {/* Owner: church selector */}
      {isOwner && churches.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {churches.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/settings/services?church=${c.id}`}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3 py-2 whitespace-nowrap transition shrink-0 ${
                c.id === churchId
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <AppIcon name={c.icon} className="w-3.5 h-3.5" fallback="church" />
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <ServicesManager
        churchId={churchId}
        services={(services as Service[]) ?? []}
        canManage={profile.role === 'church_manager' || isOwner}
      />
    </div>
  );
}
