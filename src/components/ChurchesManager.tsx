'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Church } from '@/lib/types';

export default function ChurchesManager({ churches }: { churches: Church[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
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
    });
    if (error) setError(error.message);
    else {
      setName('');
      setAddress('');
      setPhone('');
      router.refresh();
    }
    setLoading(false);
  }

  async function toggleActive(church: Church) {
    const supabase = createClient();
    await supabase.from('churches').update({ is_active: !church.is_active }).eq('id', church.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addChurch} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h3 className="font-bold text-gray-800">إضافة كنيسة جديدة</h3>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم الكنيسة"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <div className="grid md:grid-cols-2 gap-3">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="العنوان (اختياري)"
            className="rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
            placeholder="الهاتف (اختياري)"
            className="rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          disabled={loading}
          className="bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg px-5 py-2 text-sm transition disabled:opacity-50"
        >
          ➕ إضافة كنيسة
        </button>
      </form>

      <ul className="space-y-2">
        {churches.map((c) => (
          <li
            key={c.id}
            className={`bg-white rounded-xl border p-4 flex items-center justify-between ${
              c.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'
            }`}
          >
            <div>
              <h4 className="font-bold text-gray-800">⛪ {c.name}</h4>
              <p className="text-xs text-gray-400">
                {c.address ?? ''} {c.phone ? `· ${c.phone}` : ''}
              </p>
              <p className="text-[10px] text-gray-300 mt-1" dir="ltr">ID: {c.id}</p>
            </div>
            <button
              onClick={() => toggleActive(c)}
              className={`text-xs font-semibold rounded-lg px-3 py-1.5 transition ${
                c.is_active
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              {c.is_active ? 'إيقاف' : 'تفعيل'}
            </button>
          </li>
        ))}
        {!churches.length && (
          <li className="text-center text-gray-400 py-8 bg-white rounded-xl border border-gray-100">
            لا توجد كنائس بعد
          </li>
        )}
      </ul>
    </div>
  );
}
