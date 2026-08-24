'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface Option {
  value: string;
  label: string;
}

interface Props {
  /** query string key, e.g. "church" or "service" */
  paramKey: string;
  options: Option[];
  value: string;
  label?: string;
}

/**
 * FilterSelect — dropdown that writes its value to the URL query string
 * so server components can re-query with the new filter.
 */
export default function FilterSelect({ paramKey, options, value, label }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v) params.set(paramKey, v);
    else params.delete(paramKey);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex-1 min-w-0">
      {label && <p className="text-[11px] font-bold text-gray-500 mb-1">{label}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o.value || '__all__'} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
