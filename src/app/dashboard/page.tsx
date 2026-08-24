import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  ClipboardList,
  ScanLine,
  UserPlus,
  CalendarCheck,
  Hourglass,
  ChevronLeft,
  User,
  ShieldCheck,
} from 'lucide-react';
import { ROLE_LABELS } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const profile = await requireRole('servant');
  const supabase = await createClient();

  // No church assigned yet
  if (!profile.church_id && profile.role !== 'app_owner') {
    return (
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center mt-8">
        <Hourglass className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-amber-800 mb-2">حسابك قيد التفعيل</h2>
        <p className="text-amber-700 text-sm">
          لم يتم ربط حسابك بكنيسة بعد. يرجى التواصل مع مدير الكنيسة لتفعيل حسابك.
        </p>
      </section>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const churchFilter = profile.church_id;

  const childrenQ = supabase.from('children').select('id', { count: 'exact', head: true }).eq('is_active', true);
  const attendanceQ = supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('attended_on', today);
  const servicesQ = supabase.from('services').select('id', { count: 'exact', head: true }).eq('is_active', true);

  const [childrenRes, attendanceTodayRes, servicesRes] = await Promise.all([
    churchFilter ? childrenQ.eq('church_id', churchFilter) : childrenQ,
    churchFilter ? attendanceQ.eq('church_id', churchFilter) : attendanceQ,
    churchFilter ? servicesQ.eq('church_id', churchFilter) : servicesQ,
  ]);

  const canManageServices = profile.role === 'app_owner' || profile.role === 'church_manager';
  const totalChildren = childrenRes.count ?? 0;
  const attendedToday = attendanceTodayRes.count ?? 0;
  const pct = totalChildren > 0 ? Math.round((attendedToday / totalChildren) * 100) : 0;

  return (
    <div className="space-y-4 mt-2">
      {/* User profile card */}
      <section
        id="profile-card"
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
      >
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.full_name}
            className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-gray-100"
          />
        ) : (
          <span className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-white" />
          </span>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-800 truncate">أهلاً، {profile.full_name} 👋</h2>
          <p className="text-xs text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            {ROLE_LABELS[profile.role]}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5" dir="ltr">{today}</p>
        </div>
      </section>

      {/* Today's attendance hero card */}
      <section
        id="today-card"
        className="bg-gradient-to-l from-blue-700 to-blue-500 rounded-3xl p-5 text-white shadow-lg shadow-blue-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-xs font-semibold flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4" /> حضور اليوم
            </p>
            <p className="text-4xl font-bold mt-1">
              {attendedToday}
              <span className="text-lg text-blue-200 font-semibold"> / {totalChildren}</span>
            </p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center">
            <span className="font-bold text-lg">{pct}%</span>
          </div>
        </div>
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </section>

      {/* Stats row */}
      <section id="stats-grid" className="grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/children"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 active:scale-[0.98] transition"
        >
          <span className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-blue-600" />
          </span>
          <div>
            <p className="text-xl font-bold text-gray-800">{totalChildren}</p>
            <p className="text-xs text-gray-400">المخدومين</p>
          </div>
        </Link>

        {canManageServices ? (
          <Link
            href="/dashboard/settings/services"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 active:scale-[0.98] transition"
          >
            <span className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-violet-600" />
            </span>
            <div>
              <p className="text-xl font-bold text-gray-800">{servicesRes.count ?? 0}</p>
              <p className="text-xs text-gray-400">الخدمات</p>
            </div>
          </Link>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-violet-600" />
            </span>
            <div>
              <p className="text-xl font-bold text-gray-800">{servicesRes.count ?? 0}</p>
              <p className="text-xs text-gray-400">الخدمات</p>
            </div>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section id="quick-actions" className="space-y-2.5">
        <h3 className="font-bold text-gray-700 text-sm px-1">إجراءات سريعة</h3>

        <Link
          href="/dashboard/scanner"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 active:scale-[0.98] transition"
        >
          <span className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <ScanLine className="w-5 h-5 text-white" />
          </span>
          <div className="flex-1">
            <p className="font-bold text-gray-800 text-sm">مسح كود المخدوم</p>
            <p className="text-xs text-gray-400">تسجيل حضور فوري بالماسح</p>
          </div>
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </Link>

        <Link
          href="/dashboard/attendance"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 active:scale-[0.98] transition"
        >
          <span className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </span>
          <div className="flex-1">
            <p className="font-bold text-gray-800 text-sm">تسجيل حضور يدوي</p>
            <p className="text-xs text-gray-400">قائمة كاملة بجميع المخدومين</p>
          </div>
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </Link>

        <Link
          href="/dashboard/children/new"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 active:scale-[0.98] transition"
        >
          <span className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5 text-amber-600" />
          </span>
          <div className="flex-1">
            <p className="font-bold text-gray-800 text-sm">إضافة مخدوم جديد</p>
            <p className="text-xs text-gray-400">تسجيل بيانات مخدوم</p>
          </div>
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </Link>
      </section>
    </div>
  );
}
