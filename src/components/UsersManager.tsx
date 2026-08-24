'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AppRole, ApprovalStatus, Profile } from '@/lib/types';
import { ROLE_LABELS, ROLE_LEVEL } from '@/lib/types';
import ImageCropUpload from '@/components/ImageCropUpload';
import {
  User, Church, Power, PowerOff, Check, X, UserCheck, Pencil, Loader2, Camera, Trash2,
} from 'lucide-react';

export type UserRow = Profile & {
  churches?: { name: string } | null;
  services?: { name: string } | null;
};

interface Option { id: string; name: string }
interface ServiceOption extends Option { church_id: string }

interface Props {
  users: UserRow[];
  churches: Option[];
  services: ServiceOption[];
  currentProfile: Profile;
}

const inputCls =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition';

function Avatar({ url, className = 'w-10 h-10', iconCls = 'w-5 h-5' }: { url: string | null; className?: string; iconCls?: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className={`${className} rounded-xl object-cover shrink-0 border border-gray-100`} />
  ) : (
    <span className={`${className} rounded-xl bg-blue-50 flex items-center justify-center shrink-0`}>
      <User className={`${iconCls} text-blue-600`} />
    </span>
  );
}

export default function UsersManager({ users, churches, services, currentProfile }: Props) {
  const router = useRouter();
  const isOwner = currentProfile.role === 'app_owner';
  const isChurchManager = currentProfile.role === 'church_manager';
  const isServiceManager = currentProfile.role === 'service_manager';

  // ---- permissions & hierarchy ----
  // Nobody may see or act on a user of a HIGHER role level than himself,
  // and the app owner is only visible to himself. (RLS enforces this too —
  // this is defense-in-depth on the client.)
  const myLevel = ROLE_LEVEL[currentProfile.role];
  const isBelowMe = (u: UserRow) =>
    u.id !== currentProfile.id && ROLE_LEVEL[u.role] < myLevel;
  const visibleUsers = users.filter((u) => {
    if (u.id === currentProfile.id) return false;
    if (!isOwner && u.role === 'app_owner') return false;
    if (!isOwner && ROLE_LEVEL[u.role] > myLevel) return false;
    return true;
  });

  // owner: edit any user's church + service + role (never another app_owner)
  // church_manager: edit service + role of users BELOW him in his church
  // service_manager: approve/reject/activate servants of his service only
  const canEditChurch = isOwner;
  const canEditService = isOwner || isChurchManager;
  const canAssignRoles = isOwner || isChurchManager;
  const canEditUser = (u: UserRow) =>
    u.id !== currentProfile.id &&
    u.role !== 'app_owner' &&
    (isOwner || (isChurchManager && isBelowMe(u)));

  // delete: owner deletes anyone (except owners); church_manager deletes
  // service_manager/servant; service_manager deletes servants of his service.
  const canDeleteUser = (u: UserRow) =>
    u.id !== currentProfile.id &&
    u.role !== 'app_owner' &&
    (isOwner || isBelowMe(u));

  const assignableRoles: AppRole[] = isOwner
    ? ['app_owner', 'church_manager', 'service_manager', 'servant']
    : ['service_manager', 'servant'];

  const pending = visibleUsers.filter((u) => u.approval_status === 'pending');
  const others = visibleUsers.filter((u) => u.approval_status !== 'pending');

  // ---- group approved/rejected users by church → service ----
  const groups = useMemo(() => {
    const map = new Map<string, { church: string; sections: Map<string, UserRow[]> }>();
    for (const u of others) {
      const churchKey = u.churches?.name ?? 'بدون كنيسة';
      const serviceKey = u.services?.name ?? 'بدون خدمة';
      if (!map.has(churchKey)) map.set(churchKey, { church: churchKey, sections: new Map() });
      const g = map.get(churchKey)!;
      if (!g.sections.has(serviceKey)) g.sections.set(serviceKey, []);
      g.sections.get(serviceKey)!.push(u);
    }
    return Array.from(map.values());
  }, [others]);

  // ---- edit modal state ----
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editChurch, setEditChurch] = useState<string>('');
  const [editService, setEditService] = useState<string>('');
  const [editRole, setEditRole] = useState<AppRole>('servant');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  function openEdit(u: UserRow) {
    setEditing(u);
    setEditChurch(u.church_id ?? '');
    setEditService(u.service_id ?? '');
    setEditRole(u.role);
    setEditError(null);
  }

  const editServiceOptions = services.filter(
    (s) => s.church_id === (canEditChurch ? editChurch : currentProfile.church_id ?? '')
  );

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    setEditError(null);
    const supabase = createClient();

    const patch: Record<string, unknown> = {};
    if (canEditChurch) {
      patch.church_id = editChurch || null;
      // church changed → keep service only if it belongs to the new church
      const svcOk = services.some((s) => s.id === editService && s.church_id === editChurch);
      patch.service_id = svcOk ? editService : null;
    } else if (canEditService) {
      patch.service_id = editService || null;
    }
    if (canAssignRoles) patch.role = editRole;

    const { error } = await supabase.from('profiles').update(patch).eq('id', editing.id);
    if (error) setEditError(error.message);
    else {
      setEditing(null);
      router.refresh();
    }
    setSaving(false);
  }

  async function saveAvatar(userId: string, url: string) {
    const supabase = createClient();
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
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

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteUser(u: UserRow) {
    const ok = window.confirm(
      `هل أنت متأكد من حذف المستخدم "${u.full_name || ''}" نهائيًا؟`
    );
    if (!ok) return;
    setDeletingId(u.id);
    const supabase = createClient();
    const { error } = await supabase.from('profiles').delete().eq('id', u.id);
    setDeletingId(null);
    if (error) {
      window.alert('تعذر حذف المستخدم: ' + error.message);
      return;
    }
    router.refresh();
  }

  function renderUserCard(u: UserRow) {
    return (
      <li
        key={u.id}
        className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${
          !u.is_active || u.approval_status === 'rejected' ? 'opacity-60' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <Avatar url={u.avatar_url} />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-800 truncate">
              {u.full_name || '(بدون اسم)'}
            </h4>
            <p className="text-xs text-gray-400 truncate">
              {ROLE_LABELS[u.role]}
              {u.services?.name && ` · ${u.services.name}`}
              {!u.church_id && ' · غير مرتبط بكنيسة'}
              {u.approval_status === 'rejected' && ' · مرفوض'}
            </p>
          </div>

          {canEditUser(u) && (
            <button
              onClick={() => openEdit(u)}
              className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 active:scale-[0.95] transition shrink-0"
              aria-label="تعديل"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
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

          {!u.church_id && currentProfile.church_id && isChurchManager && (
            <button
              onClick={() => attachToMyChurch(u)}
              className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded-xl px-3 py-2 font-semibold hover:bg-blue-100 active:scale-[0.98] transition"
            >
              <Church className="w-3.5 h-3.5" />
              ربط بكنيستي
            </button>
          )}

          {u.id !== currentProfile.id &&
            (isOwner || isBelowMe(u)) &&
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

          {canDeleteUser(u) && (
            <button
              onClick={() => deleteUser(u)}
              disabled={deletingId === u.id}
              className="inline-flex items-center gap-1 text-xs font-semibold rounded-xl px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 active:scale-[0.98] transition disabled:opacity-50 mr-auto"
            >
              {deletingId === u.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              حذف
            </button>
          )}
        </div>
      </li>
    );
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
              <li key={u.id} className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <Avatar url={u.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-800 truncate">
                      {u.full_name || '(بدون اسم)'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {ROLE_LABELS[u.role]}
                      {u.churches?.name && ` · ${u.churches.name}`}
                      {u.services?.name && ` · ${u.services.name}`}
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

      {/* Users grouped by church → service */}
      {groups.map((g) => (
        <section key={g.church}>
          {/* church header — hidden for service managers (single service view) */}
          {!isServiceManager && (
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
              <Church className="w-4 h-4 text-indigo-500" />
              {g.church}
            </h3>
          )}
          <div className="space-y-3">
            {Array.from(g.sections.entries()).map(([serviceName, list]) => (
              <div key={serviceName}>
                <p className="text-xs font-semibold text-purple-600 mb-1.5 pr-1">{serviceName}</p>
                <ul className="space-y-2">{list.map(renderUserCard)}</ul>
              </div>
            ))}
          </div>
        </section>
      ))}

      {!visibleUsers.length && (
        <p className="text-center text-gray-400 text-sm py-10 bg-white rounded-2xl border border-gray-100">
          لا يوجد مستخدمون
        </p>
      )}

      {/* ---- Edit modal ---- */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm">تعديل بيانات الخادم</h3>
              <button
                onClick={() => setEditing(null)}
                className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* avatar + name */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative">
                <Avatar url={editing.avatar_url} className="w-20 h-20" iconCls="w-9 h-9" />
                <ImageCropUpload
                  storagePath={`avatars/${editing.id}`}
                  round
                  onUploaded={async (url) => {
                    await saveAvatar(editing.id, url);
                    setEditing({ ...editing, avatar_url: url });
                  }}
                >
                  <span className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md active:scale-[0.95] transition">
                    <Camera className="w-4 h-4" />
                  </span>
                </ImageCropUpload>
              </div>
              <p className="font-bold text-gray-800 mt-2">{editing.full_name}</p>
            </div>

            <div className="space-y-3">
              {canEditChurch && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">الكنيسة</label>
                  <select
                    value={editChurch}
                    onChange={(e) => {
                      setEditChurch(e.target.value);
                      setEditService('');
                    }}
                    className={inputCls}
                  >
                    <option value="">بدون كنيسة</option>
                    {churches.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {canEditService && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">الخدمة</label>
                  <select
                    value={editService}
                    onChange={(e) => setEditService(e.target.value)}
                    className={inputCls}
                    disabled={canEditChurch && !editChurch}
                  >
                    <option value="">بدون خدمة</option>
                    {editServiceOptions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {canAssignRoles && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">الدور</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as AppRole)}
                    className={inputCls}
                  >
                    {assignableRoles.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {editError && (
              <p className="text-red-600 text-xs bg-red-50 rounded-xl p-2.5 mt-3">{editError}</p>
            )}

            <button
              onClick={saveEdit}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-sm transition disabled:opacity-50 active:scale-[0.98] mt-4"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              حفظ التعديلات
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
