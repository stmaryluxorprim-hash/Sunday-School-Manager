import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { UserPlus, Search, Star, CalendarCheck, User, ChevronLeft } from 'lucide-react';
import type { Child } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ChildrenPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const profile = await requireRole('servant');
  const supabase = await createClient();

  let query = supabase
    .from('children')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (profile.church_id) query = query.eq('church_id', profile.church_id);

  const q = searchParams.q?.trim();
  if (q) query = query.or(`name.ilike.%${q}%,child_code.ilike.%${q}%`);

  const { data: children } = await query;

  return (
    <div className="space-y-3 mt-3">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">المخدومين</h2>
          <p className="text-xs text-gray-400 mt-0.5">{children?.length ?? 0} مخدوم</p>
        </div>
        <Link
          href="/dashboard/children/new"
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition"
        >
          <UserPlus className="w-4 h-4" />
          إضافة
        </Link>
      </header>

      <form method="GET" className="relative">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          id="search-input"
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="بحث بالاسم أو الكود..."
          className="w-full rounded-xl border border-gray-200 pr-10 pl-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition"
        />
      </form>

      {!children?.length ? (
        <section className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <User className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">
            {q ? 'لا توجد نتائج للبحث' : 'لا يوجد مخدومين بعد — ابدأ بإضافة أول مخدوم'}
          </p>
        </section>
      ) : (
        <ul className="space-y-2">
          {(children as Child[]).map((child) => (
            <li key={child.id}>
              <Link
                href={`/dashboard/children/${child.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex items-center gap-3 active:scale-[0.98] transition"
              >
                {child.picture_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={child.picture_url}
                    alt={child.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-100 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-blue-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-800 truncate">{child.name}</h3>
                  <p className="text-xs text-gray-400" dir="ltr">{child.child_code}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {child.points}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    {child.attendance_count}
                  </span>
                  <ChevronLeft className="w-4 h-4 text-gray-300" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
