'use client';

import { usePathname } from 'next/navigation';
import { Bell, Menu, X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { AppSidebar } from './app-sidebar';
import { SwitchMode } from '@/components/ui/switch-mode';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/roadmap': 'Career Roadmap',
  '/resume': 'Resume ATS Analyzer',
  '/interview': 'Mock Interview',
  '/profile': 'My Profile',
  '/admin': 'TPO Overview',
  '/admin/students': 'Students',
  '/admin/analytics': 'Analytics',
};

interface TopbarProps {
  role?: 'student' | 'tpo' | 'admin';
  userName?: string;
  userEmail?: string;
}

export function Topbar({ role, userName, userEmail }: TopbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const title = PAGE_TITLES[pathname] ?? 'Placemate AI';

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur-sm">
        {/* Mobile menu button */}
        <button
          className="flex items-center gap-2 rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
          onClick={() => setMobileOpen(true)}
          id="mobile-menu-open"
          suppressHydrationWarning
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-base font-semibold text-foreground hidden lg:block">{title}</h1>

        {/* Mobile logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">Placemate AI</span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <SwitchMode
            width={60}
            height={30}
            darkColor="#111827"
            lightColor="#F3F4F6"
            knobDarkColor="#1f2937"
            knobLightColor="#ffffff"
            borderDarkColor="#374151"
            borderLightColor="#D1D5DB"
          />

          <button
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            suppressHydrationWarning
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
            {(userName?.[0] ?? 'U').toUpperCase()}
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 animate-slide-in">
            <AppSidebar role={role} userName={userName} userEmail={userEmail} />
          </div>
          <button
            className="absolute right-4 top-4 rounded-full bg-card p-2 text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
}
