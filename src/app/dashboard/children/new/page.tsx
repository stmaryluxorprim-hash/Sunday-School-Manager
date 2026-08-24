import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ChildForm from '@/components/ChildForm';
import type { Service } from '@/lib/types';

export default async function NewChildPage() {
  const profile = await requireRole('servant');
  if (!profile.church_id) redirect('/dashboard');

  const supabase = await createClient();
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('name');

  return (
    <div className="space-y-4 mt-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800">إضافة مخدوم جديد</h2>
      <ChildForm churchId={profile.church_id} services={(services as Service[]) ?? []} />
    </div>
  );
}
