'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Service } from '@/lib/types';
import { Plus, ClipboardList, Power, PowerOff, Loader2 } from 'lucide-react';

interface Props {
  churchId: string;
  services: Service[];
  canManage: boolean;
}

const inputCls =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition';

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
    <div className="space-y-3 mt-3">
      {canManage && (
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
            <span className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-purple-600" />
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-800 truncate">{s.name}</h4>
              {s.description && <p className="text-xs text-gray-400 truncate">{s.description}</p>}
            </div>
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
          </li>
        ))}
        {!services.length && (
          <li className="text-center text-gray-400 text-sm py-10 bg-white rounded-2xl border border-gray-100">
            لا توجد خدمات بعد
          </li>
        )}
      </ul>
    </div>
  );
}
