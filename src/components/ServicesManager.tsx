'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Service } from '@/lib/types';

interface Props {
  churchId: string;
  services: Service[];
  canManage: boolean;
}

export default function ServicesManager({ churchId, services, canManage }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from('services').insert({
      church_id: churchId,
      name: name.trim(),
      description: description.trim() || null,
    });
    if (error) setError(error.message);
    else {
      setName('');
      setDescription('');
      router.refresh();
    }
    setLoading(false);
  }

  async function toggleActive(s: Service) {
    const supabase = createClient();
    await supabase.from('services').update({ is_active: !s.is_active }).eq('id', s.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <form onSubmit={addService} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          <h3 className="font-bold text-gray-800">إضافة خدمة جديدة</h3>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم الخدمة (مثال: ابتدائي بنين)"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف (اختياري)"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            disabled={loading}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg px-5 py-2 text-sm transition disabled:opacity-50"
          >
            ➕ إضافة
          </button>
        </form>
      )}

      <ul className="space-y-2">
        {services.map((s) => (
          <li
            key={s.id}
            className={`bg-white rounded-xl border p-4 flex items-center justify-between ${
              s.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'
            }`}
          >
            <div>
              <h4 className="font-bold text-gray-800">📋 {s.name}</h4>
              {s.description && <p className="text-sm text-gray-500">{s.description}</p>}
            </div>
            {canManage && (
              <button
                onClick={() => toggleActive(s)}
                className={`text-xs font-semibold rounded-lg px-3 py-1.5 transition ${
                  s.is_active
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                {s.is_active ? 'إيقاف' : 'تفعيل'}
              </button>
            )}
          </li>
        ))}
        {!services.length && (
          <li className="text-center text-gray-400 py-8 bg-white rounded-xl border border-gray-100">
            لا توجد خدمات بعد
          </li>
        )}
      </ul>
    </div>
  );
}
