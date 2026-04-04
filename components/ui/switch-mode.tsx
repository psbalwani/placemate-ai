'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, useCallback } from 'react';

interface SwitchModeProps {
  width?: number;
  height?: number;
  darkColor?: string;
  lightColor?: string;
  knobDarkColor?: string;
  knobLightColor?: string;
  borderDarkColor?: string;
  borderLightColor?: string;
  className?: string;
}

export function SwitchMode({
  width = 180,
  height = 90,
  darkColor = '#111',
  lightColor = '#F9F9F9',
  knobDarkColor = '#1C1C1C',
  knobLightColor = '#F3F3F7',
  borderDarkColor = '#444',
  borderLightColor = '#DDD',
  className = '',
}: SwitchModeProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isDark = resolvedTheme === 'dark';
  const toggle = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  if (!mounted) {
    // SSR-safe placeholder — same dimensions, no flash
    return <div style={{ width, height }} className="rounded-full bg-muted/30" />;
  }

  const padding = height * 0.1;
  const knobSize = height - padding * 2;
  const knobTravel = width - knobSize - padding * 2;
  const knobX = isDark ? padding : padding + knobTravel;

  const bg = isDark ? darkColor : lightColor;
  const border = isDark ? borderDarkColor : borderLightColor;
  const knobBg = isDark ? knobDarkColor : knobLightColor;

  // Moon / Sun icon scale
  const iconSize = knobSize * 0.45;

  return (
    <button
      role="switch"
      aria-checked={!isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
      suppressHydrationWarning
      className={`relative shrink-0 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      style={{
        width,
        height,
        borderRadius: height / 2,
        background: bg,
        border: `2px solid ${border}`,
        transition: 'background 0.4s ease, border-color 0.4s ease',
        padding: 0,
      }}
    >
      {/* Stars — visible in dark mode only */}
      {isDark && <Stars height={height} />}

      {/* Knob */}
      <span
        style={{
          position: 'absolute',
          top: padding,
          left: knobX,
          width: knobSize,
          height: knobSize,
          borderRadius: '50%',
          background: knobBg,
          transition: 'left 0.4s cubic-bezier(0.4,0,0.2,1), background 0.4s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isDark
            ? '0 2px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 2px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      >
        {isDark ? (
          <MoonIcon size={iconSize} />
        ) : (
          <SunIcon size={iconSize} />
        )}
      </span>
    </button>
  );
}

/** Tiny decorative stars for dark mode */
function Stars({ height }: { height: number }) {
  const dots = [
    { x: '72%', y: '20%', r: 1.5 },
    { x: '80%', y: '50%', r: 1 },
    { x: '65%', y: '65%', r: 1 },
    { x: '85%', y: '35%', r: 1.2 },
  ];
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="rgba(255,255,255,0.6)" />
      ))}
    </svg>
  );
}

function MoonIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="rgba(255,255,255,0.85)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

function SunIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="5" fill="#FBBF24" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 12 + 7.5 * Math.cos(rad);
        const y1 = 12 + 7.5 * Math.sin(rad);
        const x2 = 12 + 9.5 * Math.cos(rad);
        const y2 = 12 + 9.5 * Math.sin(rad);
        return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />;
      })}
    </svg>
  );
}
