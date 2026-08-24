'use client';

import { Church } from 'lucide-react';
import { AppIcon } from '@/lib/icons';
import type { Profile } from '@/lib/types';

interface Props {
  profile: Profile;
  churchName?: string | null;
  churchIcon?: string | null;
  serviceName?: string | null;
}

export default function TopBar({ profile, churchName, churchIcon, serviceName }: Props) {
  const title = churchName || 'خدمات الكنيسة';
  const subtitle = serviceName
    ? `خدمة ${serviceName}`
    : profile.role === 'app_owner'
      ? 'إدارة المنصة'
      : null;

  return (
    <header className="bg-gradient-to-l from-blue-800 to-blue-600 text-white sticky top-0 z-40 shadow-md pt-[env(safe-area-inset-top)]">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          {churchIcon ? (
            <AppIcon name={churchIcon} className="w-5 h-5" fallback="church" />
          ) : (
            <Church className="w-5 h-5" strokeWidth={2.2} />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm leading-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-[11px] text-blue-100 truncate">{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
}
