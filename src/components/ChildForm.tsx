'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Child, Service } from '@/lib/types';

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
    'w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Picture */}
      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="صورة المخدوم" className="w-20 h-20 rounded-full object-cover border-2 border-blue-200" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-3xl">👧</div>
        )}
        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition">
          📷 {preview ? 'تغيير الصورة' : 'إضافة صورة'}
          <input type="file" accept="image/*" onChange={onPickPicture} className="hidden" />
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="child_code" className="block text-sm font-medium text-gray-700 mb-1">
            كود المخدوم *
          </label>
          <input id="child_code" required dir="ltr" value={form.child_code}
            onChange={(e) => set('child_code', e.target.value)} className={inputCls} placeholder="C-001" />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            الاسم *
          </label>
          <input id="name" required value={form.name}
            onChange={(e) => set('name', e.target.value)} className={inputCls} />
        </div>

        <div>
          <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
            تاريخ الميلاد
          </label>
          <input id="dob" type="date" value={form.date_of_birth}
            onChange={(e) => set('date_of_birth', e.target.value)} className={inputCls} />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            رقم الهاتف
          </label>
          <input id="phone" type="tel" dir="ltr" value={form.phone_number}
            onChange={(e) => set('phone_number', e.target.value)} className={inputCls} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            العنوان
          </label>
          <input id="address" value={form.address}
            onChange={(e) => set('address', e.target.value)} className={inputCls} />
        </div>

        <div>
          <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
            الخدمة
          </label>
          <select id="service" value={form.service_id}
            onChange={(e) => set('service_id', e.target.value)} className={inputCls}>
            <option value="">— بدون خدمة —</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            ملاحظات
          </label>
          <textarea id="notes" rows={3} value={form.notes}
            onChange={(e) => set('notes', e.target.value)} className={inputCls} />
        </div>
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg px-6 py-2.5 transition disabled:opacity-50">
          {loading ? 'جاري الحفظ...' : child ? '💾 حفظ التعديلات' : '➕ إضافة المخدوم'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg px-6 py-2.5 transition">
          إلغاء
        </button>
      </div>
    </form>
  );
}
