'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Child } from '@/lib/types';

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
      <div className="flex items-center justify-between gap-3">
        <input
          id="attendance-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث سريع..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <span className="text-sm font-bold text-green-700 bg-green-50 rounded-lg px-3 py-2 shrink-0">
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
                className={`w-full flex items-center gap-3 rounded-xl border p-3 transition text-right ${
                  isAttended
                    ? 'bg-green-50 border-green-300'
                    : 'bg-white border-gray-100 hover:border-blue-200'
                } disabled:opacity-60`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${
                    isAttended ? 'bg-green-600 text-white' : 'bg-gray-100'
                  }`}
                >
                  {isAttended ? '✓' : ''}
                </span>
                {child.picture_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={child.picture_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <span className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">👧</span>
                )}
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-gray-800 truncate">{child.name}</span>
                  <span className="block text-xs text-gray-400" dir="ltr">{child.child_code}</span>
                </span>
              </button>
            </li>
          );
        })}
        {!filtered.length && (
          <li className="text-center text-gray-400 py-8">لا توجد نتائج</li>
        )}
      </ul>
    </>
  );
}
