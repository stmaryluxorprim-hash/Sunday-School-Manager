import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Child } from '@/lib/types';
import ChildActions from '@/components/ChildActions';
import ChildQrCode from '@/components/ChildQrCode';
import {
  User, Star, CalendarCheck, Pencil, Phone, MapPin, Cake, Hash,
  ClipboardList, StickyNote, History,
} from 'lucide-react';

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

  const info = [
    { icon: Hash, label: 'الكود', value: c.child_code, dir: 'ltr' as const },
    { icon: Cake, label: 'تاريخ الميلاد', value: c.date_of_birth ?? '—', dir: 'ltr' as const },
    { icon: Cake, label: 'العمر', value: calcAge(c.date_of_birth), dir: undefined },
    { icon: Phone, label: 'الهاتف', value: c.phone_number ?? '—', dir: 'ltr' as const },
    { icon: MapPin, label: 'العنوان', value: c.address ?? '—', dir: undefined },
    { icon: ClipboardList, label: 'الخدمة', value: c.services?.name ?? '—', dir: undefined },
  ];

  return (
    <div className="space-y-3 mt-3">
      {/* Profile header */}
      <section id="child-profile" className="bg-gradient-to-l from-blue-600 to-indigo-600 rounded-2xl shadow-sm p-6 text-center text-white">
        {c.picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.picture_url} alt={c.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-white/30 mx-auto mb-3" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <User className="w-12 h-12 text-white" />
          </div>
        )}
        <h2 className="text-2xl font-bold">{c.name}</h2>
        <div className="flex justify-center gap-4 mt-4">
          <div className="bg-white/15 rounded-xl px-4 py-2 min-w-[90px]">
            <div className="flex items-center justify-center gap-1 text-xl font-bold">
              <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
              {c.points}
            </div>
            <div className="text-xs text-blue-100 mt-0.5">النقاط</div>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2 min-w-[90px]">
            <div className="flex items-center justify-center gap-1 text-xl font-bold">
              <CalendarCheck className="w-5 h-5 text-green-300" />
              {c.attendance_count}
            </div>
            <div className="text-xs text-blue-100 mt-0.5">مرات الحضور</div>
          </div>
        </div>
        <Link href={`/dashboard/children/${c.id}/edit`}
          className="inline-flex items-center gap-2 mt-4 bg-white/20 hover:bg-white/30 active:scale-[0.98] text-white rounded-xl px-4 py-2 text-sm font-semibold transition">
          <Pencil className="w-4 h-4" />
          تعديل البيانات
        </Link>
      </section>

      {/* QR code */}
      <ChildQrCode code={c.child_code} name={c.name} />

      {/* Actions: attendance + points */}
      <ChildActions
        childId={c.id}
        churchId={c.church_id}
        serviceId={c.service_id}
        attendedToday={!!todayAttendance}
      />

      {/* Info */}
      <section id="child-info" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-4 text-sm">البيانات</h3>
        <ul className="space-y-3">
          {info.map((i) => (
            <li key={i.label} className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                <i.icon className="w-4 h-4 text-gray-500" />
              </span>
              <div className="min-w-0">
                <div className="text-xs text-gray-400">{i.label}</div>
                <div className="text-sm font-semibold text-gray-700 truncate" dir={i.dir}>{i.value}</div>
              </div>
            </li>
          ))}
        </ul>
        {c.notes && (
          <div className="mt-4 bg-amber-50 rounded-xl p-3 text-sm flex gap-2">
            <StickyNote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-amber-800">{c.notes}</span>
          </div>
        )}
      </section>

      {/* Recent attendance */}
      <section id="recent-attendance" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
          <History className="w-4 h-4 text-gray-400" />
          آخر مرات الحضور
        </h3>
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
