'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number]; // Array form for compatibility with Radix-style API
  onValueChange: (value: [number]) => void;
  className?: string;
  id?: string;
}

export function Slider({ min, max, step = 1, value, onValueChange, className, id }: SliderProps) {
  const v = value[0] ?? min;
  const pct = ((v - min) / (max - min)) * 100;

  return (
    <div className={cn('relative flex items-center py-2', className)}>
      <div className="relative h-2 w-full rounded-full bg-muted">
        {/* Filled track */}
        <div
          className="absolute left-0 top-0 h-2 rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => onValueChange([Number(e.target.value)])}
        className="absolute inset-0 w-full cursor-pointer opacity-0"
        aria-label="slider"
      />
      {/* Thumb */}
      <div
        className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 rounded-full border-2 border-primary bg-background shadow-md transition-all"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}
