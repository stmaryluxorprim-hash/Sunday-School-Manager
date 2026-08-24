import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import UsersManager from '@/components/UsersManager';
import type { Profile } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const profile = await requireRole('church_manager');
  const supabase = await createClient();

  const { data: users } = await supabase
    .from('profiles')
    .select('*, services(name)')
    .order('full_name');

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-2xl font-bold text-gray-800">المستخدمون</h2>
      <p className="text-sm text-gray-500">
        إدارة أدوار الخدام في كنيستك. طلبات الانضمام الجديدة بتظهر هنا لموافقتك.
      </p>
      <UsersManager
        users={(users as (Profile & { services?: { name: string } | null })[]) ?? []}
        currentProfile={profile}
      />
    </div>
  );
}
