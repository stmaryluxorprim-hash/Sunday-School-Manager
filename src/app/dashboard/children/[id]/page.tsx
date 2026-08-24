import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Child } from '@/lib/types';
import ChildActions from '@/components/ChildActions';

export const dynamic = 'force-dynamic';

function calcAge(dob: string | null): string {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  return `${years} سنة`;
}

export default async function ChildDetailPage({ params }: { params: { id: string } }) {
  await requireRole('servant');
  const supabase = await createClient();

  const { data: child } = await supabase
    .from('children')
    .select('*, services(name)')
    .eq('id', params.id)
    .single();

  if (!child) notFound();
  const c = child as Child & { services: { name: string } | null };

  const today = new Date().toISOString().slice(0, 10);
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('id')
    .eq('child_id', c.id)
    .eq('attended_on', today)
    .maybeSingle();

  const { data: recentAttendance } = await supabase
    .from('attendance')
    .select('attended_on')
    .eq('child_id', c.id)
    .order('attended_on', { ascending: false })
    .limit(10);

  const info: { label: string; value: string; dir?: string }[] = [
    { label: 'الكود', value: c.child_code, dir: 'ltr' },
    { label: 'تاريخ الميلاد', value: c.date_of_birth ?? '—', dir: 'ltr' },
    { label: 'العمر', value: calcAge(c.date_of_birth) },
    { label: 'الهاتف', value: c.phone_number ?? '—', dir: 'ltr' },
    { label: 'العنوان', value: c.address ?? '—' },
    { label: 'الخدمة', value: c.services?.name ?? '—' },
  ];

  return (
    <div className="space-y-4 mt-4 max-w-2xl mx-auto">
      {/* Profile header */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        {c.picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.picture_url} alt={c.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 mx-auto mb-3" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-4xl mx-auto mb-3">👧</div>
        )}
        <h2 className="text-2xl font-bold text-gray-800">{c.name}</h2>
        <div className="flex justify-center gap-6 mt-3">
          <div>
            <div className="text-2xl font-bold text-amber-600">⭐ {c.points}</div>
            <div className="text-xs text-gray-400">النقاط</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">✅ {c.attendance_count}</div>
            <div className="text-xs text-gray-400">مرات الحضور</div>
          </div>
        </div>
        <Link href={`/dashboard/children/${c.id}/edit`}
          className="inline-block mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold transition">
          ✏️ تعديل البيانات
        </Link>
      </section>

      {/* Actions: attendance + points */}
      <ChildActions
        childId={c.id}
        churchId={c.church_id}
        serviceId={c.service_id}
        attendedToday={!!todayAttendance}
      />

      {/* Info */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4">البيانات</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {info.map((i) => (
            <div key={i.label}>
              <dt className="text-gray-400">{i.label}</dt>
              <dd className="font-semibold text-gray-700" dir={i.dir}>{i.value}</dd>
            </div>
          ))}
        </dl>
        {c.notes && (
          <div className="mt-4 bg-amber-50 rounded-lg p-3 text-sm">
            <span className="font-semibold text-amber-800">📝 ملاحظات: </span>
            <span className="text-amber-700">{c.notes}</span>
          </div>
        )}
      </section>

      {/* Recent attendance */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-3">آخر مرات الحضور</h3>
        {!recentAttendance?.length ? (
          <p className="text-gray-400 text-sm">لا يوجد حضور مسجل</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {recentAttendance.map((a) => (
              <li key={a.attended_on}
                className="bg-green-50 text-green-700 rounded-lg px-3 py-1 text-xs font-semibold" dir="ltr">
                {a.attended_on}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
