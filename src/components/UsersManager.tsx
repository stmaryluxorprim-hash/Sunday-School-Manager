'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AppRole, Profile } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/types';
import { User, Church, Power, PowerOff } from 'lucide-react';

interface Props {
  users: Profile[];
  currentProfile: Profile;
}

export default function UsersManager({ users, currentProfile }: Props) {
  const router = useRouter();
  const isOwner = currentProfile.role === 'app_owner';

  // church_manager can assign up to church_manager; app_owner can assign anything
  const assignableRoles: AppRole[] = isOwner
    ? ['app_owner', 'church_manager', 'service_manager', 'servant']
    : ['church_manager', 'service_manager', 'servant'];

  async function updateRole(user: Profile, role: AppRole) {
    const supabase = createClient();
    await supabase.from('profiles').update({ role }).eq('id', user.id);
    router.refresh();
  }

  async function attachToMyChurch(user: Profile) {
    if (!currentProfile.church_id) return;
    const supabase = createClient();
    await supabase.from('profiles').update({ church_id: currentProfile.church_id }).eq('id', user.id);
    router.refresh();
  }

  async function toggleActive(user: Profile) {
    const supabase = createClient();
    await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id);
    router.refresh();
  }

  return (
    <ul className="space-y-2 mt-3">
      {users.map((u) => (
        <li
          key={u.id}
          className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${
            !u.is_active ? 'opacity-60' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-blue-600" />
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-800 truncate">
                {u.full_name || '(بدون اسم)'}
              </h4>
              <p className="text-xs text-gray-400">
                {ROLE_LABELS[u.role]}
                {!u.church_id && ' · غير مرتبط بكنيسة'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {!u.church_id && currentProfile.church_id && (
              <button
                onClick={() => attachToMyChurch(u)}
                className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded-xl px-3 py-2 font-semibold hover:bg-blue-100 active:scale-[0.98] transition"
              >
                <Church className="w-3.5 h-3.5" />
                ربط بكنيستي
              </button>
            )}

            {u.id !== currentProfile.id && (
              <>
                <select
                  value={u.role}
                  onChange={(e) => updateRole(u, e.target.value as AppRole)}
                  className="text-xs rounded-xl border border-gray-200 px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {assignableRoles.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                <button
                  onClick={() => toggleActive(u)}
                  className={`inline-flex items-center gap-1 text-xs font-semibold rounded-xl px-3 py-2 transition active:scale-[0.98] ${
                    u.is_active
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {u.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                  {u.is_active ? 'إيقاف' : 'تفعيل'}
                </button>
              </>
            )}
          </div>
        </li>
      ))}
      {!users.length && (
        <li className="text-center text-gray-400 text-sm py-10 bg-white rounded-2xl border border-gray-100">
          لا يوجد مستخدمون
        </li>
      )}
    </ul>
  );
}
