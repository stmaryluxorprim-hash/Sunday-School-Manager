import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Clock, XCircle } from 'lucide-react';
import type { Profile } from '@/lib/types';
import SignOutButton from '@/components/SignOutButton';

export const dynamic = 'force-dynamic';

export default async function PendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // NOTE: profiles has TWO relationships to services (service_id FK and the
  // service_members join table), so the embed MUST be disambiguated with
  // !service_id — otherwise PostgREST errors (PGRST201) and profile is null.
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, churches!church_id(name), services!service_id(name)')
    .eq('id', user.id)
    .single();

  // IMPORTANT: never redirect an authenticated user to /login from here —
  // middleware bounces logged-in users from /login back to /dashboard,
  // which creates an infinite redirect loop. Render a fallback instead.
  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 to-blue-600">
        <section className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">حسابك قيد المعالجة</h1>
          <p className="text-gray-500 text-sm mt-2 mb-6">
            لم نتمكن من تحميل بيانات حسابك. جرب تسجيل الخروج والدخول مرة أخرى، أو تواصل مع مدير الكنيسة.
          </p>
          <SignOutButton />
        </section>
      </main>
    );
  }

  const p = profile as Profile & {
    churches: { name: string } | null;
    services: { name: string } | null;
  };

  // Already approved (or owner)? Go to the app.
  if (p.role === 'app_owner' || p.approval_status === 'approved') redirect('/dashboard');

  const rejected = p.approval_status === 'rejected';

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 to-blue-600">
      <section className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            rejected ? 'bg-red-50' : 'bg-amber-50'
          }`}
        >
          {rejected ? (
            <XCircle className="w-8 h-8 text-red-500" />
          ) : (
            <Clock className="w-8 h-8 text-amber-500" />
          )}
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-2">
          {rejected ? 'تم رفض طلبك' : 'حسابك في انتظار الموافقة'}
        </h1>

        <p className="text-gray-600 text-sm mb-1">مرحباً {p.full_name}</p>

        {p.churches && (
          <p className="text-gray-500 text-sm">
            الكنيسة: <span className="font-semibold text-gray-700">{p.churches.name}</span>
            {p.services && (
              <>
                {' · '}الخدمة: <span className="font-semibold text-gray-700">{p.services.name}</span>
              </>
            )}
          </p>
        )}

        <p className="text-gray-500 text-sm mt-4 mb-6">
          {rejected
            ? 'تواصل مع مدير الكنيسة لمراجعة طلبك.'
            : 'مدير الكنيسة هيراجع طلبك ويوافق عليه قريباً. جرب تسجيل الدخول لاحقاً.'}
        </p>

        <SignOutButton />
      </section>
    </main>
  );
}
