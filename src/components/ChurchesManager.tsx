'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Church } from '@/lib/types';
import { Plus, Power, PowerOff, Loader2, Pencil, X, Check, Camera } from 'lucide-react';
import { AppIcon, CHURCH_ICONS } from '@/lib/icons';
import SignupQr from '@/components/SignupQr';
import ImageCropUpload from '@/components/ImageCropUpload';

const inputCls =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition';

export default function ChurchesManager({ churches }: { churches: Church[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [icon, setIcon] = useState('church');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addChurch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from('churches').insert({
      name: name.trim(),
      address: address.trim() || null,
      phone: phone.trim() || null,
      icon,
    });
    if (error) setError(error.message);
    else {
      setName('');
      setAddress('');
      setPhone('');
      setIcon('church');
      router.refresh();
    }
    setLoading(false);
  }

  async function toggleActive(church: Church) {
    const supabase = createClient();
    await supabase.from('churches').update({ is_active: !church.is_active }).eq('id', church.id);
    router.refresh();
  }

  // ---- edit modal ----
  const [editing, setEditing] = useState<Church | null>(null);
  const [eName, setEName] = useState('');
  const [eAddress, setEAddress] = useState('');
  const [ePhone, setEPhone] = useState('');
  const [eIcon, setEIcon] = useState('church');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  function openEdit(c: Church) {
    setEditing(c);
    setEName(c.name);
    setEAddress(c.address ?? '');
    setEPhone(c.phone ?? '');
    setEIcon(c.icon);
    setEditError(null);
  }

  async function saveEdit() {
    if (!editing) return;
    setSavingEdit(true);
    setEditError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from('churches')
      .update({
        name: eName.trim(),
        address: eAddress.trim() || null,
        phone: ePhone.trim() || null,
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

  async function savePicture(churchId: string, url: string) {
    const supabase = createClient();
    await supabase.from('churches').update({ picture_url: url }).eq('id', churchId);
    router.refresh();
  }

  return (
    <div className="space-y-3 mt-3">
      <form onSubmit={addChurch}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <Plus className="w-4 h-4 text-blue-600" />
          </span>
          إضافة كنيسة جديدة
        </h3>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم الكنيسة"
          className={inputCls}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="العنوان (اختياري)"
            className={inputCls}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
            placeholder="الهاتف (اختياري)"
            className={inputCls}
          />
        </div>

        {/* Icon picker */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">أيقونة الكنيسة</p>
          <div className="flex flex-wrap gap-2">
            {CHURCH_ICONS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setIcon(key)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition active:scale-[0.95] ${
                  icon === key
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300'
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
          إضافة كنيسة
        </button>
      </form>

      <ul className="space-y-2">
        {churches.map((c) => (
          <li
            key={c.id}
            className={`bg-white rounded-2xl border p-4 flex items-center gap-3 shadow-sm ${
              c.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'
            }`}
          >
            {c.picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.picture_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-100" />
            ) : (
              <span className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <AppIcon name={c.icon} className="w-5 h-5 text-indigo-600" fallback="church" />
              </span>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-800 truncate">{c.name}</h4>
              <p className="text-xs text-gray-400 truncate">
                {c.address ?? ''} {c.phone ? `· ${c.phone}` : ''}
              </p>
              <p className="text-[10px] text-gray-300 mt-0.5 truncate" dir="ltr">ID: {c.id}</p>
            </div>
            {c.is_active && (
              <SignupQr churchId={c.id} title={c.name} subtitle="رابط تسجيل الخدام للكنيسة" />
            )}
            <button
              onClick={() => openEdit(c)}
              className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 active:scale-[0.95] transition shrink-0"
              aria-label="تعديل"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleActive(c)}
              className={`inline-flex items-center gap-1 text-xs font-semibold rounded-xl px-3 py-2 transition active:scale-[0.98] shrink-0 ${
                c.is_active
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              {c.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
              {c.is_active ? 'إيقاف' : 'تفعيل'}
            </button>
          </li>
        ))}
        {!churches.length && (
          <li className="text-center text-gray-400 text-sm py-10 bg-white rounded-2xl border border-gray-100">
            لا توجد كنائس بعد
          </li>
        )}
      </ul>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm">تعديل الكنيسة</h3>
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
                  <span className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <AppIcon name={editing.icon} className="w-9 h-9 text-indigo-600" fallback="church" />
                  </span>
                )}
                <ImageCropUpload
                  storagePath={`churches/${editing.id}`}
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
              <input required value={eName} onChange={(e) => setEName(e.target.value)} placeholder="اسم الكنيسة" className={inputCls} />
              <input value={eAddress} onChange={(e) => setEAddress(e.target.value)} placeholder="العنوان (اختياري)" className={inputCls} />
              <input value={ePhone} onChange={(e) => setEPhone(e.target.value)} dir="ltr" placeholder="الهاتف (اختياري)" className={inputCls} />

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">الأيقونة</p>
                <div className="flex flex-wrap gap-2">
                  {CHURCH_ICONS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEIcon(key)}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition active:scale-[0.95] ${
                        eIcon === key
                          ? 'bg-blue-600 text-white ring-2 ring-blue-300'
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
