'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AppRole, ApprovalStatus, Profile } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/types';
import { User, Church, Power, PowerOff, Check, X, UserCheck } from 'lucide-react';

type UserRow = Profile & { services?: { name: string } | null };

interface Props {
  users: UserRow[];
  currentProfile: Profile;
}

export default function UsersManager({ users, currentProfile }: Props) {
  const router = useRouter();
  const isOwner = currentProfile.role === 'app_owner';
  const isChurchManager = currentProfile.role === 'church_manager';
  const isServiceManager = currentProfile.role === 'service_manager';

  // Role assignment: owner assigns anything; church_manager up to church_manager;
  // service_manager cannot change roles at all.
  const canAssignRoles = isOwner || isChurchManager;
  const assignableRoles: AppRole[] = isOwner
    ? ['app_owner', 'church_manager', 'service_manager', 'servant']
    : ['church_manager', 'service_manager', 'servant'];

  const pending = users.filter((u) => u.approval_status === 'pending');
  const others = users.filter((u) => u.approval_status !== 'pending');

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

  async function setApproval(user: Profile, status: ApprovalStatus) {
    const supabase = createClient();
    await supabase.from('profiles').update({ approval_status: status }).eq('id', user.id);
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-5">
      {/* Pending approvals */}
      {pending.length > 0 && (
        <section id="pending-approvals">
          <h3 className="flex items-center gap-2 text-sm font-bold text-amber-700 mb-2">
            <UserCheck className="w-4 h-4" />
            طلبات انضمام مستنية الموافقة ({pending.length})
          </h3>
          <ul className="space-y-2">
            {pending.map((u) => (
              <li
                key={u.id}
                className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-amber-600" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-800 truncate">
                      {u.full_name || '(بدون اسم)'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {ROLE_LABELS[u.role]}
                      {u.services?.name && ` · خدمة ${u.services.name}`}
                      {!u.church_id && ' · غير مرتبط بكنيسة'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => setApproval(u, 'approved')}
                    className="flex-1 inline-flex items-center justify-center gap-1 text-xs bg-green-600 text-white rounded-xl px-3 py-2.5 font-semibold hover:bg-green-700 active:scale-[0.98] transition"
                  >
                    <Check className="w-4 h-4" />
                    قبول
                  </button>
                  <button
                    onClick={() => setApproval(u, 'rejected')}
                    className="flex-1 inline-flex items-center justify-center gap-1 text-xs bg-white text-red-600 border border-red-200 rounded-xl px-3 py-2.5 font-semibold hover:bg-red-50 active:scale-[0.98] transition"
                  >
                    <X className="w-4 h-4" />
                    رفض
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* All users */}
      <ul className="space-y-2">
        {others.map((u) => (
          <li
            key={u.id}
            className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${
              !u.is_active || u.approval_status === 'rejected' ? 'opacity-60' : ''
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
                  {u.services?.name && ` · خدمة ${u.services.name}`}
                  {!u.church_id && ' · غير مرتبط بكنيسة'}
                  {u.approval_status === 'rejected' && ' · مرفوض'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {u.approval_status === 'rejected' && u.id !== currentProfile.id && (
                <button
                  onClick={() => setApproval(u, 'approved')}
                  className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 rounded-xl px-3 py-2 font-semibold hover:bg-green-100 active:scale-[0.98] transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  قبول
                </button>
              )}

              {!u.church_id && currentProfile.church_id && !isServiceManager && (
                <button
                  onClick={() => attachToMyChurch(u)}
                  className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded-xl px-3 py-2 font-semibold hover:bg-blue-100 active:scale-[0.98] transition"
                >
                  <Church className="w-3.5 h-3.5" />
                  ربط بكنيستي
                </button>
              )}

              {u.id !== currentProfile.id && canAssignRoles && (
                <select
                  value={u.role}
                  onChange={(e) => updateRole(u, e.target.value as AppRole)}
                  className="text-xs rounded-xl border border-gray-200 px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {assignableRoles.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              )}

              {u.id !== currentProfile.id &&
                // service_manager can only activate/deactivate servants of his service
                (!isServiceManager || u.role === 'servant') && (
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
    </div>
  );
}
