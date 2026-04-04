'use client';

interface VoiceWaveformProps {
  listening: boolean;
  speaking?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const BAR_COUNT = 15;

// Pre-computed heights per size to avoid inline recalculation
const HEIGHTS = {
  sm: [6, 10, 14, 12, 16, 13, 8, 14, 10, 7, 12, 11, 16, 10, 8],
  md: [8, 14, 20, 16, 24, 18, 10, 20, 14, 9, 18, 15, 22, 14, 10],
  lg: [10, 18, 28, 22, 32, 24, 14, 28, 18, 12, 24, 20, 30, 18, 14],
};

const BAR_WIDTHS = { sm: 2, md: 3, lg: 4 };
const IDLE_FRACTION = 0.25;

export function VoiceWaveform({ listening, speaking = false, size = 'md' }: VoiceWaveformProps) {
  const active = listening || speaking;
  const color = speaking ? '#f59e0b' : '#10b981';
  const barW = BAR_WIDTHS[size];
  const maxH = HEIGHTS[size][4]; // peak height for idle calc

  return (
    <>
      <style>{`
        @keyframes wf-bounce {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
      `}</style>
      <div
        className="flex items-center gap-0.5"
        aria-label={listening ? 'Listening' : speaking ? 'AI speaking' : 'Idle'}
        role="img"
      >
        {Array.from({ length: BAR_COUNT }, (_, i) => {
          const activeH = HEIGHTS[size][i];
          const idleH = Math.round(maxH * IDLE_FRACTION);
          /* FIX: Use separate animation properties instead of shorthand + animationDelay
             Mixing `animation` shorthand with `animationDelay` causes React style conflicts */
          return (
            <span
              key={i}
              className="rounded-full"
              style={{
                display: 'inline-block',
                width: barW,
                height: active ? activeH : idleH,
                background: active ? color : 'rgba(255,255,255,0.15)',
                transformOrigin: 'bottom',
                transition: active ? 'none' : 'height 0.3s ease, background 0.3s ease',
                // Separate animation properties — no shorthand conflict
                animationName: active ? 'wf-bounce' : 'none',
                animationDuration: `${0.4 + (i % 5) * 0.1}s`,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDirection: 'alternate',
                animationDelay: `${i * 40}ms`,
                animationFillMode: 'both',
              }}
            />
          );
        })}
      </div>
    </>
  );
}
