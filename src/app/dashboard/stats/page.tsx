import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  Users,
  CalendarCheck,
  Star,
  TrendingUp,
  Trophy,
  Medal,
} from 'lucide-react';
import type { Child } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const profile = await requireRole('servant');
  const supabase = await createClient();

  if (!profile.church_id && profile.role !== 'app_owner') {
    return (
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center mt-8 text-amber-700 text-sm">
        حسابك غير مرتبط بكنيسة بعد
      </section>
    );
  }

  const churchFilter = profile.church_id;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Last 7 days range
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);

  const childrenQ = supabase.from('children').select('*').eq('is_active', true).order('points', { ascending: false });
  const weekQ = supabase.from('attendance').select('attended_on').gte('attended_on', weekAgoStr).lte('attended_on', todayStr);

  const [{ data: children }, { data: weekAttendance }] = await Promise.all([
    churchFilter ? childrenQ.eq('church_id', churchFilter) : childrenQ,
    churchFilter ? weekQ.eq('church_id', churchFilter) : weekQ,
  ]);

  const list = (children as Child[]) ?? [];
  const totalChildren = list.length;
  const totalPoints = list.reduce((s, c) => s + c.points, 0);
  const totalAttendance = list.reduce((s, c) => s + c.attendance_count, 0);
  const avgAttendance = totalChildren ? (totalAttendance / totalChildren).toFixed(1) : '0';

  // Build last-7-days bars
  const days: { date: string; label: string; count: number }[] = [];
  const dayNames = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    days.push({
      date: ds,
      label: dayNames[d.getDay()],
      count: (weekAttendance ?? []).filter((a) => a.attended_on === ds).length,
    });
  }
  const maxDay = Math.max(...days.map((d) => d.count), 1);

  const topPoints = list.slice(0, 5);
  const topAttendance = [...list].sort((a, b) => b.attendance_count - a.attendance_count).slice(0, 5);

  const medalColors = ['text-amber-500', 'text-gray-400', 'text-orange-400'];

  return (
    <div className="space-y-4 mt-2">
      <header className="py-2">
        <h2 className="text-xl font-bold text-gray-800">الإحصائيات</h2>
        <p className="text-sm text-gray-500">نظرة عامة على الخدمة</p>
      </header>

      {/* Summary cards */}
      <section className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
          <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">{totalChildren}</p>
          <p className="text-[10px] text-gray-400">المخدومين</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
          <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">{totalPoints}</p>
          <p className="text-[10px] text-gray-400">إجمالي النقاط</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
          <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">{avgAttendance}</p>
          <p className="text-[10px] text-gray-400">متوسط الحضور</p>
        </div>
      </section>

      {/* Weekly chart */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-1.5">
          <CalendarCheck className="w-4 h-4 text-blue-600" /> الحضور — آخر 7 أيام
        </h3>
        <div className="flex items-end justify-between gap-1.5 h-28">
          {days.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-gray-600">{d.count || ''}</span>
              <div
                className={`w-full rounded-t-lg transition-all ${
                  d.date === todayStr ? 'bg-blue-600' : 'bg-blue-200'
                }`}
                style={{ height: `${Math.max((d.count / maxDay) * 80, d.count ? 8 : 2)}px` }}
              />
              <span className="text-[9px] text-gray-400">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top points */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500" /> الأعلى نقاطاً
        </h3>
        {!topPoints.length ? (
          <p className="text-gray-400 text-sm text-center py-4">لا يوجد مخدومين بعد</p>
        ) : (
          <ul className="space-y-2">
            {topPoints.map((c, i) => (
              <li key={c.id}>
                <Link href={`/dashboard/children/${c.id}`} className="flex items-center gap-3">
                  <Medal className={`w-5 h-5 shrink-0 ${medalColors[i] ?? 'text-gray-200'}`} />
                  {c.picture_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.picture_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-400" />
                    </span>
                  )}
                  <span className="flex-1 text-sm font-semibold text-gray-700 truncate">{c.name}</span>
                  <span className="text-sm font-bold text-amber-600 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" /> {c.points}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Top attendance */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-1.5">
          <CalendarCheck className="w-4 h-4 text-green-600" /> الأكثر حضوراً
        </h3>
        {!topAttendance.length ? (
          <p className="text-gray-400 text-sm text-center py-4">لا يوجد مخدومين بعد</p>
        ) : (
          <ul className="space-y-2">
            {topAttendance.map((c, i) => (
              <li key={c.id}>
                <Link href={`/dashboard/children/${c.id}`} className="flex items-center gap-3">
                  <Medal className={`w-5 h-5 shrink-0 ${medalColors[i] ?? 'text-gray-200'}`} />
                  {c.picture_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.picture_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-400" />
                    </span>
                  )}
                  <span className="flex-1 text-sm font-semibold text-gray-700 truncate">{c.name}</span>
                  <span className="text-sm font-bold text-green-600">{c.attendance_count} مرة</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
