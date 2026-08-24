'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { ROLE_LABELS, hasMinRole } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  minRole: Profile['role'];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'الرئيسية', icon: '🏠', minRole: 'servant' },
  { href: '/dashboard/children', label: 'المخدومين', icon: '👧', minRole: 'servant' },
  { href: '/dashboard/attendance', label: 'الحضور', icon: '✅', minRole: 'servant' },
  { href: '/dashboard/services', label: 'الخدمات', icon: '📋', minRole: 'service_manager' },
  { href: '/dashboard/users', label: 'المستخدمون', icon: '👥', minRole: 'church_manager' },
  { href: '/dashboard/churches', label: 'الكنائس', icon: '⛪', minRole: 'app_owner' },
];

export default function Nav({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();

  const items = NAV_ITEMS.filter((i) => hasMinRole(profile.role, i.minRole));

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {/* Top bar */}
      <header className="bg-blue-800 text-white sticky top-0 z-40 shadow">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⛪</span>
            <div>
              <h1 className="font-bold leading-tight">خدمات الكنيسة</h1>
              <p className="text-xs text-blue-200">
                {profile.full_name} · {ROLE_LABELS[profile.role]}
              </p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm transition ${
                  pathname === item.href
                    ? 'bg-blue-700 font-semibold'
                    : 'hover:bg-blue-700/50'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
            <button
              onClick={signOut}
              className="px-3 py-2 rounded-lg text-sm hover:bg-red-600/80 transition mr-2"
            >
              🚪 خروج
            </button>
          </nav>

          {/* Mobile: sign out only (nav is bottom bar) */}
          <button onClick={signOut} className="md:hidden text-sm px-3 py-1.5 rounded-lg bg-blue-700">
            خروج
          </button>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40 flex justify-around py-1.5 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        {items.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center px-2 py-1 rounded-lg text-[11px] ${
              pathname === item.href ? 'text-blue-700 font-bold' : 'text-gray-500'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
