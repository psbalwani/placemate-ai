'use client';

import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

// ── Context ────────────────────────────────────────────────────
interface DropdownCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
}
const DropdownContext = createContext<DropdownCtx>({ open: false, setOpen: () => {} });

// ── Root ───────────────────────────────────────────────────────
export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

// ── Trigger ────────────────────────────────────────────────────
export function DropdownMenuTrigger({
  children,
  asChild,
}: {
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  asChild?: boolean;
}) {
  const { open, setOpen } = useContext(DropdownContext);
  if (asChild) {
    return React.cloneElement(children, {
      onClick: () => setOpen(!open),
      'aria-expanded': open,
    });
  }
  return (
    <button onClick={() => setOpen(!open)} aria-expanded={open}>
      {children}
    </button>
  );
}

// ── Content ────────────────────────────────────────────────────
export function DropdownMenuContent({
  children,
  align = 'end',
  className,
}: {
  children: React.ReactNode;
  align?: 'start' | 'end' | 'center';
  className?: string;
}) {
  const { open, setOpen } = useContext(DropdownContext);
  if (!open) return null;

  const alignClass =
    align === 'start' ? 'left-0' : align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2';

  return (
    <div
      className={cn(
        'absolute z-50 mt-2 min-w-[10rem] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg animate-scale-in',
        alignClass,
        className
      )}
      role="menu"
      onClick={() => setOpen(false)}
    >
      {children}
    </div>
  );
}

// ── Item ───────────────────────────────────────────────────────
export function DropdownMenuItem({
  children,
  onClick,
  className,
  destructive,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  destructive?: boolean;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors',
        destructive
          ? 'text-destructive hover:bg-destructive/10 focus:bg-destructive/10'
          : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent',
        className
      )}
    >
      {children}
    </button>
  );
}

// ── Label ──────────────────────────────────────────────────────
export function DropdownMenuLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground', className)}>
      {children}
    </div>
  );
}

// ── Separator ──────────────────────────────────────────────────
export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div role="separator" className={cn('my-1 h-px bg-border', className)} />;
}
