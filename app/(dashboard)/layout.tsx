import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Topbar } from '@/components/layout/topbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = ((session.user as Record<string, unknown>).role as string) ?? 'student';
  const userName = session.user.name ?? session.user.email?.split('@')[0] ?? 'User';
  const userEmail = session.user.email ?? '';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <AppSidebar role={role as 'student' | 'tpo' | 'admin'} userName={userName} userEmail={userEmail} />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar role={role as 'student' | 'tpo' | 'admin'} userName={userName} userEmail={userEmail} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
