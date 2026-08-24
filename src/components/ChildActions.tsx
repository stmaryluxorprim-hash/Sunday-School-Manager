'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  childId: string;
  churchId: string;
  serviceId: string | null;
  attendedToday: boolean;
}

export default function ChildActions({ childId, churchId, serviceId, attendedToday }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function markAttendance() {
    setLoading(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.from('attendance').insert({
      church_id: churchId,
      child_id: childId,
      service_id: serviceId,
    });
    if (error) {
      setMsg(error.code === '23505' ? 'تم تسجيل الحضور اليوم بالفعل' : 'حدث خطأ');
    } else {
      setMsg('✅ تم تسجيل الحضور');
    }
    setLoading(false);
    router.refresh();
  }

  async function addPoints(delta: number, reason: string) {
    setLoading(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.from('points_log').insert({
      church_id: churchId,
      child_id: childId,
      delta,
      reason,
    });
    setMsg(error ? 'حدث خطأ' : delta > 0 ? `⭐ تم إضافة ${delta} نقاط` : `تم خصم ${-delta} نقاط`);
    setLoading(false);
    router.refresh();
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-bold text-gray-800 mb-4">إجراءات</h3>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={markAttendance}
          disabled={loading || attendedToday}
          className={`rounded-xl p-4 font-semibold transition ${
            attendedToday
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-70`}
        >
          {attendedToday ? '✅ حاضر اليوم' : '✅ تسجيل حضور اليوم'}
        </button>

        <div className="grid grid-cols-3 gap-2">
          {[1, 5, 10].map((n) => (
            <button
              key={n}
              onClick={() => addPoints(n, `إضافة ${n} نقاط`)}
              disabled={loading}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-bold transition disabled:opacity-50"
            >
              +{n}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => addPoints(-1, 'خصم نقطة')}
        disabled={loading}
        className="mt-3 text-xs text-red-500 hover:underline disabled:opacity-50"
      >
        − خصم نقطة
      </button>

      {msg && <p className="mt-3 text-sm font-semibold text-gray-600">{msg}</p>}
    </section>
  );
}
