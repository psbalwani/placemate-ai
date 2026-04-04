'use client';

import { useEffect, useRef } from 'react';

interface ReadinessScoreProps {
  score: number; // 0-100
  size?: number;
}

function getScoreColor(score: number) {
  if (score >= 75) return { stroke: '#10b981', label: 'Excellent', text: 'text-emerald-500' };
  if (score >= 50) return { stroke: '#f59e0b', label: 'Good', text: 'text-amber-500' };
  if (score >= 25) return { stroke: '#f97316', label: 'Fair', text: 'text-orange-500' };
  return { stroke: '#ef4444', label: 'Needs Work', text: 'text-red-500' };
}

export function ReadinessScore({ score, size = 180 }: ReadinessScoreProps) {
  const { stroke, label, text } = getScoreColor(score);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1s ease-in-out',
              filter: `drop-shadow(0 0 8px ${stroke}66)`,
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold tabular-nums ${text}`}>{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <p className={`text-sm font-semibold ${text}`}>{label}</p>
        <p className="text-xs text-muted-foreground">Placement Readiness</p>
      </div>
    </div>
  );
}
