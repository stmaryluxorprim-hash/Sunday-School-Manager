import {
  Church, Cross, Landmark, Building2, Home,
  ClipboardList, BookOpen, GraduationCap, Music, Palette,
  Users, Baby, Heart, Star, Trophy, Sparkles, Gamepad2, Tent,
  type LucideIcon,
} from 'lucide-react';

/**
 * Icon key → lucide component map.
 * Keys are stored in DB (churches.icon / services.icon).
 */
export const ICON_MAP: Record<string, LucideIcon> = {
  // church icons
  'church': Church,
  'cross': Cross,
  'landmark': Landmark,
  'building': Building2,
  'home': Home,
  // service icons
  'clipboard-list': ClipboardList,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  'music': Music,
  'palette': Palette,
  'users': Users,
  'baby': Baby,
  'heart': Heart,
  'star': Star,
  'trophy': Trophy,
  'sparkles': Sparkles,
  'gamepad': Gamepad2,
  'tent': Tent,
};

export const CHURCH_ICONS = ['church', 'cross', 'landmark', 'building', 'home'];

export const SERVICE_ICONS = [
  'clipboard-list', 'book-open', 'graduation-cap', 'music', 'palette',
  'users', 'baby', 'heart', 'star', 'trophy', 'sparkles', 'gamepad', 'tent',
];

/** Render an icon by its DB key, with a safe fallback. */
export function AppIcon({
  name,
  className,
  fallback = 'clipboard-list',
}: {
  name: string | null | undefined;
  className?: string;
  fallback?: string;
}) {
  const Icon = ICON_MAP[name ?? ''] ?? ICON_MAP[fallback] ?? ClipboardList;
  return <Icon className={className} />;
}
