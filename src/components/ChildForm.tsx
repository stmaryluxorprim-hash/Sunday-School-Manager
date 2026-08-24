'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Child, Service } from '@/lib/types';
import { Camera, Save, UserPlus, X, Loader2, User } from 'lucide-react';

interface Props {
  churchId: string;
  services: Service[];
  child?: Child; // present = edit mode
}

export default function ChildForm({ churchId, services, child }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    child_code: child?.child_code ?? '',
    name: child?.name ?? '',
    date_of_birth: child?.date_of_birth ?? '',
    phone_number: child?.phone_number ?? '',
    address: child?.address ?? '',
    notes: child?.notes ?? '',
    service_id: child?.service_id ?? '',
  });
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(child?.picture_url ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function onPickPicture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPictureFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      let picture_url = child?.picture_url ?? null;

      // Upload picture if selected
      if (pictureFile) {
        const ext = pictureFile.name.split('.').pop() || 'jpg';
        const path = `${churchId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('children-pictures')
          .upload(path, pictureFile, { upsert: true });
        if (upErr) throw new Error('فشل رفع الصورة: ' + upErr.message);
        const { data: pub } = supabase.storage.from('children-pictures').getPublicUrl(path);
        picture_url = pub.publicUrl;
      }

      const payload = {
        church_id: churchId,
        child_code: form.child_code.trim(),
        name: form.name.trim(),
        date_of_birth: form.date_of_birth || null,
        phone_number: form.phone_number.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
        service_id: form.service_id || null,
        picture_url,
      };

      if (child) {
        const { error: err } = await supabase.from('children').update(payload).eq('id', child.id);
        if (err) throw new Error(err.message);
        router.push(`/dashboard/children/${child.id}`);
      } else {
        const { data, error: err } = await supabase.from('children').insert(payload).select('id').single();
        if (err) {
          if (err.code === '23505') throw new Error('كود المخدوم مستخدم بالفعل في هذه الكنيسة');
          throw new Error(err.message);
        }
        router.push(`/dashboard/children/${data.id}`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ');
      setLoading(false);
    }
  }

  const inputCls =
    'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition';
  const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5';

  return (
    <form onSubmit={handleSubmit}
      className="space-y-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-3">
      {/* Picture */}
      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="صورة المخدوم"
            className="w-20 h-20 rounded-full object-cover border-2 border-blue-100" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
            <User className="w-9 h-9 text-blue-300" />
          </div>
        )}
        <label className="cursor-pointer inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 transition">
          <Camera className="w-4 h-4 text-gray-500" />
          {preview ? 'تغيير الصورة' : 'إضافة صورة'}
          <input type="file" accept="image/*" onChange={onPickPicture} className="hidden" />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="child_code" className={labelCls}>كود المخدوم *</label>
          <input id="child_code" required dir="ltr" value={form.child_code}
            onChange={(e) => set('child_code', e.target.value)} className={inputCls} placeholder="C-001" />
        </div>

        <div>
          <label htmlFor="name" className={labelCls}>الاسم *</label>
          <input id="name" required value={form.name}
            onChange={(e) => set('name', e.target.value)} className={inputCls} />
        </div>

        <div>
          <label htmlFor="dob" className={labelCls}>تاريخ الميلاد</label>
          <input id="dob" type="date" value={form.date_of_birth}
            onChange={(e) => set('date_of_birth', e.target.value)} className={inputCls} />
        </div>

        <div>
          <label htmlFor="phone" className={labelCls}>رقم الهاتف</label>
          <input id="phone" type="tel" dir="ltr" value={form.phone_number}
            onChange={(e) => set('phone_number', e.target.value)} className={inputCls} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="address" className={labelCls}>العنوان</label>
          <input id="address" value={form.address}
            onChange={(e) => set('address', e.target.value)} className={inputCls} />
        </div>

        <div>
          <label htmlFor="service" className={labelCls}>الخدمة</label>
          <select id="service" value={form.service_id}
            onChange={(e) => set('service_id', e.target.value)} className={inputCls}>
            <option value="">— بدون خدمة —</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="notes" className={labelCls}>ملاحظات</label>
          <textarea id="notes" rows={3} value={form.notes}
            onChange={(e) => set('notes', e.target.value)} className={inputCls} />
        </div>
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-xl px-6 py-3 text-sm transition disabled:opacity-50">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : child ? (
            <Save className="w-4 h-4" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {loading ? 'جاري الحفظ...' : child ? 'حفظ التعديلات' : 'إضافة المخدوم'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] border border-gray-200 text-gray-600 font-semibold rounded-xl px-5 py-3 text-sm transition">
          <X className="w-4 h-4" />
          إلغاء
        </button>
      </div>
    </form>
  );
}
