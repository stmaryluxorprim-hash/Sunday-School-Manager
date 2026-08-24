'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Child } from '@/lib/types';
import { Search, Check, User } from 'lucide-react';

interface Props {
  churchId: string;
  childList: Child[];
  attendedIds: string[];
}

export default function AttendanceList({ churchId, childList, attendedIds }: Props) {
  const [attended, setAttended] = useState<Set<string>>(new Set(attendedIds));
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return childList;
    return childList.filter(
      (c) => c.name.toLowerCase().includes(q) || c.child_code.toLowerCase().includes(q)
    );
  }, [childList, search]);

  function vibrate() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(40);
  }

  async function toggle(child: Child) {
    if (busy.has(child.id)) return;
    setBusy((b) => new Set(b).add(child.id));
    const supabase = createClient();
    const isAttended = attended.has(child.id);
    const today = new Date().toISOString().slice(0, 10);

    if (isAttended) {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('child_id', child.id)
        .eq('attended_on', today);
      if (!error) {
        setAttended((a) => {
          const next = new Set(a);
          next.delete(child.id);
          return next;
        });
      }
    } else {
      const { error } = await supabase.from('attendance').insert({
        church_id: churchId,
        child_id: child.id,
        service_id: child.service_id,
      });
      if (!error || (error as { code?: string }).code === '23505') {
        vibrate();
        setAttended((a) => new Set(a).add(child.id));
      }
    }
    setBusy((b) => {
      const next = new Set(b);
      next.delete(child.id);
      return next;
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="attendance-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث سريع..."
            className="w-full rounded-xl border border-gray-200 pr-10 pl-4 py-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
        <span className="text-sm font-bold text-green-700 bg-green-50 rounded-xl px-3 py-3 shrink-0">
          {attended.size} / {childList.length}
        </span>
      </div>

      <ul className="space-y-2">
        {filtered.map((child) => {
          const isAttended = attended.has(child.id);
          return (
            <li key={child.id}>
              <button
                onClick={() => toggle(child)}
                disabled={busy.has(child.id)}
                className={`w-full flex items-center gap-3 rounded-2xl border p-3 transition text-right active:scale-[0.98] ${
                  isAttended
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-100 shadow-sm'
                } disabled:opacity-60`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition ${
                    isAttended ? 'bg-green-600' : 'bg-gray-100'
                  }`}
                >
                  {isAttended && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </span>
                {child.picture_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={child.picture_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <span className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-300" />
                  </span>
                )}
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-gray-800 truncate">{child.name}</span>
                  <span className="block text-xs text-gray-400" dir="ltr">{child.child_code}</span>
                </span>
              </button>
            </li>
          );
        })}
        {!filtered.length && (
          <li className="text-center text-gray-400 text-sm py-10">لا توجد نتائج</li>
        )}
      </ul>
    </>
  );
}
