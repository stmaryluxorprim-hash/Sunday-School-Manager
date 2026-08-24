import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import ChurchesManager from '@/components/ChurchesManager';
import type { Church } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ChurchesPage() {
  await requireRole('app_owner');
  const supabase = await createClient();

  const { data: churches } = await supabase
    .from('churches')
    .select('*')
    .order('name');

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-2xl font-bold text-gray-800">الكنائس (المستأجرين)</h2>
      <p className="text-sm text-gray-500">إدارة الكنائس على المنصة — متاح لمالك التطبيق فقط</p>
      <ChurchesManager churches={(churches as Church[]) ?? []} />
    </div>
  );
}
