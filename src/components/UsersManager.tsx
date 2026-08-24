'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AppRole, Profile } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/types';

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
    <ul className="space-y-2">
      {users.map((u) => (
        <li
          key={u.id}
          className={`bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap items-center gap-3 ${
            !u.is_active ? 'opacity-60' : ''
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-lg shrink-0">
            👤
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-800 truncate">{u.full_name || '(بدون اسم)'}</h4>
            <p className="text-xs text-gray-400">
              {ROLE_LABELS[u.role]}
              {!u.church_id && ' · غير مرتبط بكنيسة'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!u.church_id && currentProfile.church_id && (
              <button
                onClick={() => attachToMyChurch(u)}
                className="text-xs bg-blue-50 text-blue-700 rounded-lg px-3 py-1.5 font-semibold hover:bg-blue-100 transition"
              >
                ⛪ ربط بكنيستي
              </button>
            )}

            {u.id !== currentProfile.id && (
              <>
                <select
                  value={u.role}
                  onChange={(e) => updateRole(u, e.target.value as AppRole)}
                  className="text-xs rounded-lg border border-gray-300 px-2 py-1.5 bg-white"
                >
                  {assignableRoles.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                <button
                  onClick={() => toggleActive(u)}
                  className={`text-xs font-semibold rounded-lg px-3 py-1.5 transition ${
                    u.is_active
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {u.is_active ? 'إيقاف' : 'تفعيل'}
                </button>
              </>
            )}
          </div>
        </li>
      ))}
      {!users.length && (
        <li className="text-center text-gray-400 py-8 bg-white rounded-xl border border-gray-100">
          لا يوجد مستخدمون
        </li>
      )}
    </ul>
  );
}
