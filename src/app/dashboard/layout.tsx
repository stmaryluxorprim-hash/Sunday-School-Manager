import { getProfileWithContext } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfileWithContext();
  if (!profile) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar
        profile={profile}
        churchName={profile.churches?.name ?? null}
        churchIcon={profile.churches?.icon ?? null}
        churchPicture={profile.churches?.picture_url ?? null}
        serviceName={profile.services?.name ?? null}
      />
      <main className="max-w-lg mx-auto px-4 pb-28 pt-2">{children}</main>
      <BottomNav />
    </div>
  );
}
