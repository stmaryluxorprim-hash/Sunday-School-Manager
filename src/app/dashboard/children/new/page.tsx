import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ChildForm from '@/components/ChildForm';
import type { Service } from '@/lib/types';
import { UserPlus } from 'lucide-react';

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
    <div className="space-y-3 mt-3">
      <header className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-blue-600" />
        </span>
        <h2 className="text-xl font-bold text-gray-800">إضافة مخدوم جديد</h2>
      </header>
      <ChildForm churchId={profile.church_id} services={(services as Service[]) ?? []} />
    </div>
  );
}
