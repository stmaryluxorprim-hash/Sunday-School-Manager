'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ClipboardList,
  UsersRound,
  Church,
  CheckCircle2,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import type { Profile } from '@/lib/types';
import MyProfileCard from '@/components/MyProfileCard';

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
      href: '/dashboard/settings/churches',
      label: 'إدارة الكنائس',
      desc: 'إدارة المستأجرين على المنصة',
      Icon: Church,
      color: 'bg-amber-50 text-amber-600',
      // owner only
      show: profile.role === 'app_owner',
    },
    {
      href: '/dashboard/settings/services',
      label: 'إدارة الخدمات',
      desc: 'إضافة وتعديل خدمات الكنيسة',
      Icon: ClipboardList,
      color: 'bg-violet-50 text-violet-600',
      // owner + church_manager (service_manager does NOT manage services)
      show: profile.role === 'app_owner' || profile.role === 'church_manager',
    },
    {
      href: '/dashboard/settings/users',
      label: 'إدارة المستخدمين',
      desc:
        profile.role === 'service_manager'
          ? 'خدام خدمتك وطلبات الانضمام'
          : 'الأدوار وصلاحيات الخدام',
      Icon: UsersRound,
      color: 'bg-blue-50 text-blue-600',
      // owner + church_manager (church scope) + service_manager (service scope)
      show:
        profile.role === 'app_owner' ||
        profile.role === 'church_manager' ||
        profile.role === 'service_manager',
    },
  ].filter((i) => i.show);

  return (
    <div className="space-y-4">
      {/* Profile card (self editable) */}
      <MyProfileCard profile={profile} />

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
