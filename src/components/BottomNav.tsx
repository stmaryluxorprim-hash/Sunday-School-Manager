'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, ScanLine, BarChart3, Settings } from 'lucide-react';

const ITEMS = [
  { href: '/dashboard', label: 'الرئيسية', Icon: Home },
  { href: '/dashboard/children', label: 'المخدومين', Icon: Users },
  { href: '/dashboard/scanner', label: 'الماسح', Icon: ScanLine, isCenter: true },
  { href: '/dashboard/stats', label: 'الإحصائيات', Icon: BarChart3 },
  { href: '/dashboard/settings', label: 'الإعدادات', Icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  return (
    <nav
      id="bottom-nav"
      className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-gray-200 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-lg mx-auto flex items-end justify-around">
        {ITEMS.map(({ href, label, Icon, isCenter }) => {
          const active = isActive(href);

          if (isCenter) {
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="relative -top-4 flex flex-col items-center"
              >
                <span
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition ${
                    active
                      ? 'bg-blue-700 shadow-blue-300'
                      : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'
                  }`}
                >
                  <Icon className="w-7 h-7 text-white" strokeWidth={2.2} />
                </span>
                <span
                  className={`text-[10px] mt-1 font-semibold ${
                    active ? 'text-blue-700' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[64px]"
            >
              <Icon
                className={`w-6 h-6 transition ${
                  active ? 'text-blue-700' : 'text-gray-400'
                }`}
                strokeWidth={active ? 2.4 : 2}
              />
              <span
                className={`text-[10px] font-semibold ${
                  active ? 'text-blue-700' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
