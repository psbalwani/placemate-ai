'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  FileText,
  MessageSquare,
  User,
  Settings,
  Sparkles,
  LogOut,
  BarChart3,
  Users,
  TrendingUp,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const STUDENT_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/roadmap', label: 'Roadmap', icon: Map },
  { href: '/resume', label: 'Resume ATS', icon: FileText },
  { href: '/interview', label: 'Mock Interview', icon: MessageSquare },
  { href: '/interview/history', label: 'Interview History', icon: History },
];

const BOTTOM_NAV = [
  { href: '/profile', label: 'Profile', icon: User },
];

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: BarChart3 },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
];

interface AppSidebarProps {
  role?: 'student' | 'tpo' | 'admin';
  userName?: string;
  userEmail?: string;
}

export function AppSidebar({ role = 'student', userName, userEmail }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = role === 'student' ? STUDENT_NAV : ADMIN_NAV;

  async function handleSignOut() {
    await signOut({ callbackUrl: '/login' });
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-white/8" style={{ background: 'oklch(0.13 0.02 260)' }}>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/8 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/30">
          <Sparkles className="h-4 w-4 text-emerald-400" />
        </div>
        <span className="text-base font-semibold text-white">Placemate AI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20'
                  : 'text-slate-300 hover:bg-white/8 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </Link>
          );
        })}

        {/* TPO can also access student features */}
        {role === 'tpo' && (
          <>
            <div className="my-3 border-t border-white/8" />
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              My Tools
            </p>
            {STUDENT_NAV.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={`tpo-${href}`}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20'
                      : 'text-slate-300 hover:bg-white/8 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/8 px-3 py-4 space-y-1">
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
              pathname === href
                ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20'
                : 'text-slate-300 hover:bg-white/8 hover:text-white'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        {/* User card */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 mt-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
              {(userName?.[0] ?? 'U').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{userName ?? 'User'}</p>
              <p className="truncate text-xs text-slate-500">{userEmail ?? ''}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-white transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
