import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ChildForm from '@/components/ChildForm';
import type { Child, Service } from '@/lib/types';
import { Pencil } from 'lucide-react';

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
    <div className="space-y-3 mt-3">
      <header className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <Pencil className="w-5 h-5 text-amber-600" />
        </span>
        <h2 className="text-xl font-bold text-gray-800 truncate">تعديل بيانات: {c.name}</h2>
      </header>
      <ChildForm churchId={c.church_id} services={(services as Service[]) ?? []} child={c} />
    </div>
  );
}
