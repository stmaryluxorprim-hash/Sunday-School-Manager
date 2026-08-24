'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
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
          <div className="text-5xl mb-3">✅</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">تم إنشاء الحساب</h1>
          <p className="text-gray-600 mb-6">
            إذا كان تأكيد البريد مفعلاً، تحقق من بريدك الإلكتروني. ثم انتظر أن يقوم مدير الكنيسة بتفعيل حسابك وتحديد دورك.
          </p>
          <Link href="/login" className="text-blue-700 font-semibold hover:underline">
            الذهاب لتسجيل الدخول
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 to-blue-600">
      <section className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <header className="text-center mb-8">
          <div className="text-5xl mb-3">⛪</div>
          <h1 className="text-2xl font-bold text-gray-800">إنشاء حساب جديد</h1>
        </header>

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
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg py-3 transition disabled:opacity-50"
          >
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
