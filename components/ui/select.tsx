'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
  id?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

const SelectContext = React.createContext<{
  value: string;
  onValueChange: (v: string) => void;
  close: () => void;
}>({ value: '', onValueChange: () => {}, close: () => {} });

export function Select({ value, onValueChange, children, placeholder, className, id }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Find display label
  const [label, setLabel] = React.useState<string>('');
  React.useEffect(() => {
    const el = ref.current?.querySelector(`[data-value="${value}"]`);
    setLabel(el?.textContent ?? '');
  }, [value]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, close: () => setOpen(false) }}>
      <div ref={ref} className={cn('relative', className)}>
        <button
          id={id}
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
            {label || placeholder || 'Select…'}
          </span>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl animate-scale-in">
            <div className="max-h-60 overflow-y-auto p-1">{children}</div>
          </div>
        )}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectItem({ value, children }: SelectItemProps) {
  const ctx = React.useContext(SelectContext);
  const isSelected = ctx.value === value;

  return (
    <button
      type="button"
      data-value={value}
      onClick={() => { ctx.onValueChange(value); ctx.close(); }}
      className={cn(
        'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
        isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'
      )}
    >
      {children}
    </button>
  );
}
