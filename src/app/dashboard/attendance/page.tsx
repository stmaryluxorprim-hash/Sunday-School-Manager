import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Child } from '@/lib/types';
import AttendanceList from '@/components/AttendanceList';
import { CalendarCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const profile = await requireRole('servant');
  const supabase = await createClient();

  if (!profile.church_id) {
    return (
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center mt-8 text-amber-700">
        حسابك غير مرتبط بكنيسة بعد
      </section>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: children }, { data: todayRecords }] = await Promise.all([
    supabase
      .from('children')
      .select('*')
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('attendance')
      .select('child_id')
      .eq('church_id', profile.church_id)
      .eq('attended_on', today),
  ]);

  const attendedIds = (todayRecords ?? []).map((r) => r.child_id);

  return (
    <div className="space-y-3 mt-3">
      <header className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
          <CalendarCheck className="w-5 h-5 text-green-600" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-gray-800">تسجيل الحضور</h2>
          <p className="text-gray-400 text-xs" dir="ltr">{today}</p>
        </div>
      </header>

      <AttendanceList
        churchId={profile.church_id}
        childList={(children as Child[]) ?? []}
        attendedIds={attendedIds}
      />
    </div>
  );
}
