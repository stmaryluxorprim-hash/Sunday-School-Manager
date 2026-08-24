import { getProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav profile={profile} />
      <main className="max-w-6xl mx-auto p-4 pb-24 md:pb-8">{children}</main>
    </div>
  );
}
