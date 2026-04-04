import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Topbar } from '@/components/layout/topbar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = ((session.user as Record<string, unknown>).role as string) ?? 'student';

  if (!['tpo', 'admin'].includes(role)) {
    redirect('/dashboard');
  }

  const userName = session.user.name ?? session.user.email?.split('@')[0] ?? 'TPO';
  const userEmail = session.user.email ?? '';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden lg:flex">
        <AppSidebar role="tpo" userName={userName} userEmail={userEmail} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar role="tpo" userName={userName} userEmail={userEmail} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
