'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Church as ChurchIcon, UserPlus, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AppIcon } from '@/lib/icons';
import type { Church, Service } from '@/lib/types';

function SignupForm() {
  const searchParams = useSearchParams();
  const churchId = searchParams.get('church');
  const serviceId = searchParams.get('service');

  const [church, setChurch] = useState<Church | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [linkChecked, setLinkChecked] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load church & service info from the invite link
  useEffect(() => {
    async function load() {
      if (!churchId) {
        setLinkChecked(true);
        return;
      }
      const supabase = createClient();
      const { data: c } = await supabase
        .from('churches')
        .select('*')
        .eq('id', churchId)
        .eq('is_active', true)
        .maybeSingle();
      setChurch((c as Church) ?? null);

      if (c && serviceId) {
        const { data: s } = await supabase
          .from('services')
          .select('*')
          .eq('id', serviceId)
          .eq('church_id', churchId)
          .eq('is_active', true)
          .maybeSingle();
        setService((s as Service) ?? null);
      }
      setLinkChecked(true);
    }
    load();
  }, [churchId, serviceId]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          church_id: church?.id ?? null,
          service_id: service?.id ?? null,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 to-blue-600">
        <section className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">تم إنشاء الحساب</h1>
          <p className="text-gray-600 text-sm mb-2">
            {church
              ? `طلبك مسجل في ${church.name}${service ? ` — خدمة ${service.name}` : ''}.`
              : 'تم تسجيل طلبك.'}
          </p>
          <p className="text-gray-500 text-sm mb-6">
            حسابك في انتظار موافقة مدير الكنيسة. بعد الموافقة تقدر تسجل الدخول وتبدأ الخدمة.
          </p>
          <Link href="/login" className="text-blue-700 font-semibold hover:underline text-sm">
            الذهاب لتسجيل الدخول
          </Link>
        </section>
      </main>
    );
  }

  const inputCls =
    'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition';

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 to-blue-600">
      <section className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <header className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            {church ? (
              <AppIcon name={church.icon} className="w-8 h-8 text-blue-600" fallback="church" />
            ) : (
              <ChurchIcon className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">إنشاء حساب جديد</h1>
        </header>

        {/* Invite context card */}
        {church && (
          <div id="invite-context" className="bg-blue-50 rounded-2xl p-4 mb-5 space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
                <AppIcon name={church.icon} className="w-4 h-4 text-blue-600" fallback="church" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-blue-500">الكنيسة</p>
                <p className="text-sm font-bold text-blue-900 truncate">{church.name}</p>
              </div>
            </div>
            {service && (
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
                  <AppIcon name={service.icon} className="w-4 h-4 text-purple-600" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-blue-500">الخدمة</p>
                  <p className="text-sm font-bold text-blue-900 truncate">{service.name}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Invalid link warning */}
        {linkChecked && churchId && !church && (
          <div className="bg-amber-50 rounded-2xl p-4 mb-5 flex gap-2 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            رابط الدعوة غير صالح — هيتم إنشاء الحساب بدون كنيسة وهيحتاج ربط يدوي.
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              الاسم الكامل
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              كلمة المرور (6 أحرف على الأقل)
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-xl py-3.5 text-sm transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="text-blue-700 font-semibold hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-600">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </main>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
