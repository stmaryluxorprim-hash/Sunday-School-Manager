'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="w-full inline-flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] border border-gray-200 text-gray-600 font-semibold rounded-xl py-3 text-sm transition"
    >
      <LogOut className="w-4 h-4" />
      تسجيل الخروج
    </button>
  );
}
