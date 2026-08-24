'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, ShieldCheck, Pencil, X, Loader2, Camera } from 'lucide-react';
import ImageCropUpload from '@/components/ImageCropUpload';
import type { Profile } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/types';

/**
 * MyProfileCard — every user can edit his OWN data:
 * name, phone and profile picture (avatar).
 */
export default function MyProfileCard({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile.full_name ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) {
      setError('الاسم مطلوب');
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from('profiles')
      .update({ full_name: name.trim(), phone: phone.trim() || null })
      .eq('id', profile.id);
    setSaving(false);
    if (err) {
      setError('تعذر حفظ البيانات، حاول مرة أخرى');
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function saveAvatar(url: string) {
    const supabase = createClient();
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id);
    router.refresh();
  }

  return (
    <>
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className="relative shrink-0">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="w-14 h-14 rounded-2xl object-cover border border-gray-100"
            />
          ) : (
            <span className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </span>
          )}
          <ImageCropUpload storagePath={`avatars/${profile.id}`} round onUploaded={saveAvatar}>
            <span className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center">
              <Camera className="w-3 h-3 text-white" />
            </span>
          </ImageCropUpload>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 truncate">{profile.full_name}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            {ROLE_LABELS[profile.role]}
          </p>
        </div>
        <button
          onClick={() => {
            setName(profile.full_name ?? '');
            setPhone(profile.phone ?? '');
            setError(null);
            setOpen(true);
          }}
          className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 active:bg-gray-100"
          aria-label="تعديل بياناتي"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">تعديل بياناتي</h3>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">الاسم الكامل</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">رقم الهاتف</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  dir="ltr"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              onClick={save}
              disabled={saving}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              حفظ
            </button>
          </div>
        </div>
      )}
    </>
  );
}
