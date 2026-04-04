'use client';

interface ReadinessScoreProps {
  score: number; // 0-100
  size?: number;
}

function getScoreStyle(score: number) {
  if (score >= 75) return { stroke: '#10b981', glow: '#10b98133', label: 'Excellent',  text: 'text-emerald-400' };
  if (score >= 50) return { stroke: '#f59e0b', glow: '#f59e0b33', label: 'Good',       text: 'text-amber-400'  };
  if (score >= 25) return { stroke: '#f97316', glow: '#f9731633', label: 'Fair',        text: 'text-orange-400' };
  return               { stroke: '#ef4444', glow: '#ef444433', label: 'Needs Work', text: 'text-red-400'    };
}

export function ReadinessScore({ score, size = 180 }: ReadinessScoreProps) {
  const { stroke, glow, label, text } = getScoreStyle(score);
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {/* Outer glow ring */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke={glow} strokeWidth={strokeWidth + 6} />
          {/* Track */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-border/40" />
          {/* Progress arc */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',
              filter: `drop-shadow(0 0 6px ${stroke}88)`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className={`text-4xl font-black tabular-nums leading-none ${text}`}>{score}</span>
          <span className="text-[11px] text-muted-foreground font-medium">/ 100</span>
        </div>
      </div>

      <div className="text-center">
        <p className={`text-sm font-bold ${text}`}>{label}</p>
        <p className="text-xs text-muted-foreground">Placement Readiness</p>
      </div>
    </div>
  );
}
