import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
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
    <div className="space-y-4 mt-4">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">المخدومين</h2>
        <Link
          href="/dashboard/children/new"
          className="bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg px-4 py-2 text-sm transition"
        >
          ➕ إضافة مخدوم
        </Link>
      </header>

      <form method="GET" className="flex gap-2">
        <input
          id="search-input"
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="بحث بالاسم أو الكود..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        />
        <button className="bg-gray-800 text-white rounded-lg px-4 py-2 text-sm font-semibold">
          بحث
        </button>
      </form>

      {!children?.length ? (
        <section className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">
          {q ? 'لا توجد نتائج للبحث' : 'لا يوجد مخدومين بعد — ابدأ بإضافة أول مخدوم'}
        </section>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {(children as Child[]).map((child) => (
            <li key={child.id}>
              <Link
                href={`/dashboard/children/${child.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition"
              >
                {child.picture_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={child.picture_url}
                    alt={child.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-blue-100"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                    👧
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 truncate">{child.name}</h3>
                  <p className="text-xs text-gray-400" dir="ltr">{child.child_code}</p>
                </div>
                <div className="text-left shrink-0">
                  <div className="text-sm font-bold text-amber-600">⭐ {child.points}</div>
                  <div className="text-xs text-gray-400">حضور {child.attendance_count}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
