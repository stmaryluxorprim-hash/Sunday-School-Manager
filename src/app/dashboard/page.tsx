import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ROLE_LABELS } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const profile = await requireRole('servant');
  const supabase = await createClient();

  // No church assigned yet
  if (!profile.church_id && profile.role !== 'app_owner') {
    return (
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center mt-8">
        <div className="text-5xl mb-3">⏳</div>
        <h2 className="text-xl font-bold text-amber-800 mb-2">حسابك قيد التفعيل</h2>
        <p className="text-amber-700">
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

  const stats = [
    { label: 'المخدومين', value: childrenRes.count ?? 0, icon: '👧', href: '/dashboard/children' },
    { label: 'حضور اليوم', value: attendanceTodayRes.count ?? 0, icon: '✅', href: '/dashboard/attendance' },
    { label: 'الخدمات', value: servicesRes.count ?? 0, icon: '📋', href: '/dashboard/services' },
  ];

  return (
    <div className="space-y-6 mt-4">
      <header>
        <h2 className="text-2xl font-bold text-gray-800">
          أهلاً، {profile.full_name} 👋
        </h2>
        <p className="text-gray-500">{ROLE_LABELS[profile.role]}</p>
      </header>

      <section id="stats-grid" className="grid grid-cols-3 gap-3 md:gap-6">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 text-center hover:shadow-md transition"
          >
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl md:text-3xl font-bold text-blue-800">{s.value}</div>
            <div className="text-xs md:text-sm text-gray-500 mt-1">{s.label}</div>
          </Link>
        ))}
      </section>

      <section id="quick-actions" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-4">إجراءات سريعة</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/dashboard/attendance"
            className="bg-green-50 text-green-800 rounded-xl p-4 text-center font-semibold hover:bg-green-100 transition"
          >
            ✅ تسجيل حضور
          </Link>
          <Link
            href="/dashboard/children/new"
            className="bg-blue-50 text-blue-800 rounded-xl p-4 text-center font-semibold hover:bg-blue-100 transition"
          >
            ➕ إضافة مخدوم
          </Link>
        </div>
      </section>
    </div>
  );
}
