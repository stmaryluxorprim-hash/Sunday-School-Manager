'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, Star, Minus, Loader2 } from 'lucide-react';

interface Props {
  childId: string;
  churchId: string;
  serviceId: string | null;
  attendedToday: boolean;
}

export default function ChildActions({ childId, churchId, serviceId, attendedToday }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function vibrate() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(50);
  }

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
      setMsg({
        text: error.code === '23505' ? 'تم تسجيل الحضور اليوم بالفعل' : 'حدث خطأ',
        ok: false,
      });
    } else {
      vibrate();
      setMsg({ text: 'تم تسجيل الحضور', ok: true });
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
    if (!error) vibrate();
    setMsg(
      error
        ? { text: 'حدث خطأ', ok: false }
        : delta > 0
          ? { text: `تم إضافة ${delta} نقاط`, ok: true }
          : { text: `تم خصم ${-delta} نقاط`, ok: true }
    );
    setLoading(false);
    router.refresh();
  }

  return (
    <section id="child-actions" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-bold text-gray-800 mb-4 text-sm">إجراءات</h3>

      {/* Attendance */}
      <button
        onClick={markAttendance}
        disabled={loading || attendedToday}
        className={`w-full flex items-center justify-center gap-2 rounded-xl p-4 font-semibold text-sm transition active:scale-[0.98] ${
          attendedToday
            ? 'bg-green-50 text-green-700 cursor-default'
            : 'bg-green-600 hover:bg-green-700 text-white'
        } disabled:opacity-70`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <CheckCircle2 className="w-5 h-5" />
        )}
        {attendedToday ? 'حاضر اليوم' : 'تسجيل حضور اليوم'}
      </button>

      {/* Points */}
      <div className="mt-3">
        <div className="flex items-center gap-2 mb-2">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-xs font-semibold text-gray-500">إضافة نقاط</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 5, 10].map((n) => (
            <button
              key={n}
              onClick={() => addPoints(n, `إضافة ${n} نقاط`)}
              disabled={loading}
              className="bg-amber-50 hover:bg-amber-100 active:scale-[0.98] text-amber-700 rounded-xl py-3 font-bold text-sm transition disabled:opacity-50"
            >
              +{n}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => addPoints(-1, 'خصم نقطة')}
        disabled={loading}
        className="mt-3 inline-flex items-center gap-1 text-xs text-red-500 hover:underline disabled:opacity-50"
      >
        <Minus className="w-3 h-3" />
        خصم نقطة
      </button>

      {msg && (
        <p className={`mt-3 text-sm font-semibold ${msg.ok ? 'text-green-600' : 'text-red-500'}`}>
          {msg.text}
        </p>
      )}
    </section>
  );
}
