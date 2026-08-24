'use client';

import { Church } from 'lucide-react';
import type { Profile } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/types';

export default function TopBar({ profile }: { profile: Profile }) {
  return (
    <header className="bg-gradient-to-l from-blue-800 to-blue-600 text-white sticky top-0 z-40 shadow-md pt-[env(safe-area-inset-top)]">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <Church className="w-5 h-5" strokeWidth={2.2} />
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm leading-tight truncate">خدمات الكنيسة</h1>
          <p className="text-[11px] text-blue-100 truncate">
            {profile.full_name} · {ROLE_LABELS[profile.role]}
          </p>
        </div>
      </div>
    </header>
  );
}
