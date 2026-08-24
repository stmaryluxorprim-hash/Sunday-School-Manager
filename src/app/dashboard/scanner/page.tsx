import { requireRole } from '@/lib/auth';
import QrScanner from '@/components/QrScanner';

export const dynamic = 'force-dynamic';

export default async function ScannerPage() {
  const profile = await requireRole('servant');

  if (!profile.church_id) {
    return (
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center mt-8 text-amber-700 text-sm">
        حسابك غير مرتبط بكنيسة بعد
      </section>
    );
  }

  return (
    <div className="space-y-4 mt-2">
      <header className="py-2">
        <h2 className="text-xl font-bold text-gray-800">الماسح</h2>
        <p className="text-sm text-gray-500">مسح كود المخدوم لتسجيل الحضور</p>
      </header>
      <QrScanner churchId={profile.church_id} />
    </div>
  );
}
