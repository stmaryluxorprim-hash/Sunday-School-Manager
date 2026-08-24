import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import ServicesManager from '@/components/ServicesManager';
import type { Service } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  // Services management is for church_manager and app_owner only
  const profile = await requireRole('church_manager');
  const supabase = await createClient();

  if (!profile.church_id) {
    return (
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center mt-8 text-amber-700">
        حسابك غير مرتبط بكنيسة بعد
      </section>
    );
  }

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('church_id', profile.church_id)
    .order('name');

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-2xl font-bold text-gray-800">الخدمات</h2>
      <ServicesManager
        churchId={profile.church_id}
        services={(services as Service[]) ?? []}
        canManage={profile.role === 'church_manager' || profile.role === 'app_owner'}
      />
    </div>
  );
}
