'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Service } from '@/lib/types';
import { Plus, Power, PowerOff, Loader2, Pencil, X, Check, Camera, Trash2 } from 'lucide-react';
import { AppIcon, SERVICE_ICONS } from '@/lib/icons';
import SignupQr from '@/components/SignupQr';
import ImageCropUpload from '@/components/ImageCropUpload';

export type ServiceRow = Service & { churches?: { name: string } | null };

interface Props {
  /** null = owner viewing all churches (add form hidden) */
  churchId: string | null;
  services: ServiceRow[];
  canManage: boolean;
  /** show church name under each service (owner all-churches view) */
  showChurchName?: boolean;
}

const inputCls =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition';

export default function ServicesManager({ churchId, services, canManage, showChurchName }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('clipboard-list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    if (!churchId) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from('services').insert({
      church_id: churchId,
      name: name.trim(),
      description: description.trim() || null,
      icon,
    });
    if (error) setError(error.message);
    else {
      setName('');
      setDescription('');
      setIcon('clipboard-list');
      router.refresh();
    }
    setLoading(false);
  }

  async function toggleActive(s: Service) {
    const supabase = createClient();
    await supabase.from('services').update({ is_active: !s.is_active }).eq('id', s.id);
    router.refresh();
  }

  // ---- edit modal ----
  const [editing, setEditing] = useState<Service | null>(null);
  const [eName, setEName] = useState('');
  const [eDescription, setEDescription] = useState('');
  const [eIcon, setEIcon] = useState('clipboard-list');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  function openEdit(s: Service) {
    setEditing(s);
    setEName(s.name);
    setEDescription(s.description ?? '');
    setEIcon(s.icon);
    setEditError(null);
  }

  async function saveEdit() {
    if (!editing) return;
    setSavingEdit(true);
    setEditError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from('services')
      .update({
        name: eName.trim(),
        description: eDescription.trim() || null,
        icon: eIcon,
      })
      .eq('id', editing.id);
    if (error) setEditError(error.message);
    else {
      setEditing(null);
      router.refresh();
    }
    setSavingEdit(false);
  }

  async function savePicture(serviceId: string, url: string) {
    const supabase = createClient();
    await supabase.from('services').update({ picture_url: url }).eq('id', serviceId);
    router.refresh();
  }

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteService(s: ServiceRow) {
    const ok = window.confirm(
      `هل أنت متأكد من حذف خدمة "${s.name}" نهائيًا؟ سيتم حذف كل البيانات المرتبطة بها.`
    );
    if (!ok) return;
    setDeletingId(s.id);
    const supabase = createClient();
    const { error } = await supabase.from('services').delete().eq('id', s.id);
    setDeletingId(null);
    if (error) {
      window.alert('تعذر حذف الخدمة: ' + error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3 mt-3">
      {canManage && churchId && (
        <form onSubmit={addService}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Plus className="w-4 h-4 text-blue-600" />
            </span>
            إضافة خدمة جديدة
          </h3>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم الخدمة (مثال: ابتدائي بنين)"
            className={inputCls}
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف (اختياري)"
            className={inputCls}
          />

          {/* Icon picker */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">أيقونة الخدمة</p>
            <div className="flex flex-wrap gap-2">
              {SERVICE_ICONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition active:scale-[0.95] ${
                    icon === key
                      ? 'bg-purple-600 text-white ring-2 ring-purple-300'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <AppIcon name={key} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</p>}
          <button
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-xl px-5 py-3 text-sm transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            إضافة
          </button>
        </form>
      )}

      <ul className="space-y-2">
        {services.map((s) => (
          <li
            key={s.id}
            className={`bg-white rounded-2xl border p-4 flex items-center gap-3 shadow-sm ${
              s.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'
            }`}
          >
            {s.picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.picture_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-100" />
            ) : (
              <span className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <AppIcon name={s.icon} className="w-5 h-5 text-purple-600" />
              </span>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-800 truncate">{s.name}</h4>
              {showChurchName && s.churches?.name ? (
                <p className="text-xs text-amber-600 truncate">{s.churches.name}</p>
              ) : (
                s.description && <p className="text-xs text-gray-400 truncate">{s.description}</p>
              )}
            </div>
            {canManage && s.is_active && (
              <SignupQr
                churchId={s.church_id}
                serviceId={s.id}
                title={s.name}
                subtitle="رابط تسجيل الخدام للخدمة دي"
              />
            )}
            {canManage && (
              <button
                onClick={() => openEdit(s)}
                className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 active:scale-[0.95] transition shrink-0"
                aria-label="تعديل"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {canManage && (
              <button
                onClick={() => toggleActive(s)}
                className={`inline-flex items-center gap-1 text-xs font-semibold rounded-xl px-3 py-2 transition active:scale-[0.98] shrink-0 ${
                  s.is_active
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                {s.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                {s.is_active ? 'إيقاف' : 'تفعيل'}
              </button>
            )}
            {canManage && (
              <button
                onClick={() => deleteService(s)}
                disabled={deletingId === s.id}
                className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 active:scale-[0.95] transition shrink-0 disabled:opacity-50"
                aria-label="حذف"
              >
                {deletingId === s.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            )}
          </li>
        ))}
        {!services.length && (
          <li className="text-center text-gray-400 text-sm py-10 bg-white rounded-2xl border border-gray-100">
            لا توجد خدمات بعد
          </li>
        )}
      </ul>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm">تعديل الخدمة</h3>
              <button
                onClick={() => setEditing(null)}
                className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* picture */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative">
                {editing.picture_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editing.picture_url} alt="" className="w-20 h-20 rounded-2xl object-cover border border-gray-100" />
                ) : (
                  <span className="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center">
                    <AppIcon name={editing.icon} className="w-9 h-9 text-purple-600" />
                  </span>
                )}
                <ImageCropUpload
                  storagePath={`services/${editing.id}`}
                  onUploaded={async (url) => {
                    await savePicture(editing.id, url);
                    setEditing({ ...editing, picture_url: url });
                  }}
                >
                  <span className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md active:scale-[0.95] transition">
                    <Camera className="w-4 h-4" />
                  </span>
                </ImageCropUpload>
              </div>
            </div>

            <div className="space-y-3">
              <input required value={eName} onChange={(e) => setEName(e.target.value)} placeholder="اسم الخدمة" className={inputCls} />
              <input value={eDescription} onChange={(e) => setEDescription(e.target.value)} placeholder="وصف (اختياري)" className={inputCls} />

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">الأيقونة</p>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_ICONS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEIcon(key)}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition active:scale-[0.95] ${
                        eIcon === key
                          ? 'bg-purple-600 text-white ring-2 ring-purple-300'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <AppIcon name={key} className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {editError && <p className="text-red-600 text-xs bg-red-50 rounded-xl p-2.5 mt-3">{editError}</p>}

            <button
              onClick={saveEdit}
              disabled={savingEdit || !eName.trim()}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-sm transition disabled:opacity-50 active:scale-[0.98] mt-4"
            >
              {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              حفظ التعديلات
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
