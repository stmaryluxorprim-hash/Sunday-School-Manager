import { requireRole } from '@/lib/auth';
import SettingsMenu from '@/components/SettingsMenu';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const profile = await requireRole('servant');

  return (
    <div className="space-y-4 mt-2">
      <header className="py-2">
        <h2 className="text-xl font-bold text-gray-800">الإعدادات</h2>
        <p className="text-sm text-gray-500">إدارة الحساب والمنصة</p>
      </header>
      <SettingsMenu profile={profile} />
    </div>
  );
}
