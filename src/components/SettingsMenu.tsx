'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  User,
  ClipboardList,
  UsersRound,
  Church,
  CheckCircle2,
  LogOut,
  ChevronLeft,
  ShieldCheck,
} from 'lucide-react';
import type { Profile } from '@/lib/types';
import { ROLE_LABELS, hasMinRole } from '@/lib/types';

export default function SettingsMenu({ profile }: { profile: Profile }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const menuItems = [
    {
      href: '/dashboard/attendance',
      label: 'تسجيل حضور يدوي',
      desc: 'قائمة كاملة بجميع المخدومين',
      Icon: CheckCircle2,
      color: 'bg-green-50 text-green-600',
      show: true,
    },
    {
      href: '/dashboard/settings/services',
      label: 'إدارة الخدمات',
      desc: 'إضافة وتعديل خدمات الكنيسة',
      Icon: ClipboardList,
      color: 'bg-violet-50 text-violet-600',
      show: hasMinRole(profile.role, 'service_manager'),
    },
    {
      href: '/dashboard/settings/users',
      label: 'إدارة المستخدمين',
      desc: 'الأدوار وصلاحيات الخدام',
      Icon: UsersRound,
      color: 'bg-blue-50 text-blue-600',
      show: hasMinRole(profile.role, 'church_manager'),
    },
    {
      href: '/dashboard/settings/churches',
      label: 'إدارة الكنائس',
      desc: 'إدارة المستأجرين على المنصة',
      Icon: Church,
      color: 'bg-amber-50 text-amber-600',
      show: profile.role === 'app_owner',
    },
  ].filter((i) => i.show);

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <span className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
          <User className="w-7 h-7 text-white" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 truncate">{profile.full_name}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            {ROLE_LABELS[profile.role]}
          </p>
        </div>
      </section>

      {/* Menu */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
        {menuItems.map(({ href, label, desc, Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-4 active:bg-gray-50 transition"
          >
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-gray-800 text-sm">{label}</span>
              <span className="block text-xs text-gray-400">{desc}</span>
            </span>
            <ChevronLeft className="w-5 h-5 text-gray-300" />
          </Link>
        ))}
      </section>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="w-full bg-white rounded-2xl border border-red-100 shadow-sm p-4 flex items-center gap-3 active:bg-red-50 transition"
      >
        <span className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
          <LogOut className="w-5 h-5 text-red-500" />
        </span>
        <span className="font-bold text-red-600 text-sm">تسجيل الخروج</span>
      </button>

      <p className="text-center text-[11px] text-gray-300 pb-2">
        منصة إدارة خدمات الكنيسة · v2.0
      </p>
    </div>
  );
}
