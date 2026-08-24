import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ChildForm from '@/components/ChildForm';
import type { Child, Service } from '@/lib/types';

export default async function EditChildPage({ params }: { params: { id: string } }) {
  await requireRole('servant');
  const supabase = await createClient();

  const { data: child } = await supabase
    .from('children')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!child) notFound();
  const c = child as Child;

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('church_id', c.church_id)
    .eq('is_active', true)
    .order('name');

  return (
    <div className="space-y-4 mt-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800">تعديل بيانات: {c.name}</h2>
      <ChildForm churchId={c.church_id} services={(services as Service[]) ?? []} child={c} />
    </div>
  );
}
