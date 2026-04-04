'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Menu, X, LayoutDashboard, Calendar, FileText,
  MessageSquare, User, LogOut, Sparkles,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/roadmap', label: 'Roadmap', icon: Calendar },
  { href: '/resume', label: 'Resume ATS', icon: FileText },
  { href: '/interview', label: 'Mock Interview', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  async function handleSignOut() {
    await signOut({ callbackUrl: '/login' });
  }

  return (
    <>
      {/* Hamburger trigger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
        aria-label="Open navigation"
        id="mobile-nav-open"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 border-r border-white/8 transition-transform duration-300 ease-in-out lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'oklch(0.13 0.02 260)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/30">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="font-bold text-white">Placemate AI</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            id="mobile-nav-close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20'
                    : 'text-slate-300 hover:bg-white/8 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-white/8">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/8 hover:text-white transition-colors"
            id="mobile-signout"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
