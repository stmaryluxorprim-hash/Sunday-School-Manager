'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Church } from '@/lib/types';
import { Plus, Church as ChurchIcon, Power, PowerOff, Loader2 } from 'lucide-react';

const inputCls =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition';

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
            <span className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <ChurchIcon className="w-5 h-5 text-indigo-600" />
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-800 truncate">{c.name}</h4>
              <p className="text-xs text-gray-400 truncate">
                {c.address ?? ''} {c.phone ? `· ${c.phone}` : ''}
              </p>
              <p className="text-[10px] text-gray-300 mt-0.5 truncate" dir="ltr">ID: {c.id}</p>
            </div>
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
    </div>
  );
}
