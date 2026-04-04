'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { MultiDimensionalScore } from '@/types/ai';

interface ScoreRadarChartProps {
  score: MultiDimensionalScore;
  label?: string;
  size?: number;
  color?: string;
}

const DIMENSION_LABELS: Record<keyof MultiDimensionalScore, string> = {
  technical: 'Technical',
  clarity: 'Clarity',
  structure: 'Structure',
  confidence: 'Confidence',
  relevance: 'Relevance',
};

export function ScoreRadarChart({
  score,
  label,
  size = 240,
  color = '#10b981',
}: ScoreRadarChartProps) {
  const data = (Object.keys(DIMENSION_LABELS) as Array<keyof MultiDimensionalScore>).map((key) => ({
    dimension: DIMENSION_LABELS[key],
    value: Math.round((score[key] ?? 0) * 10), // 0-10 -> 0-100
    fullMark: 100,
  }));

  return (
    <div style={{ width: '100%', height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <PolarGrid stroke="oklch(0.5 0 0 / 20%)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: 'oklch(0.6 0 0)', fontSize: 11, fontWeight: 500 }}
          />
          <Tooltip
            contentStyle={{
              background: 'oklch(0.18 0.01 260)',
              border: '1px solid oklch(1 0 0 / 10%)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v: number) => [`${v}/100`, label ?? 'Score']}
          />
          <Radar
            name={label ?? 'Score'}
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.18}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---- Line chart for score trends ----
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as LineTooltip,
  ResponsiveContainer as LineResponsiveContainer,
} from 'recharts';

interface ScoreTrendPoint {
  label: string;
  score: number;
}

interface ScoreTrendChartProps {
  data: ScoreTrendPoint[];
  color?: string;
  height?: number;
}

export function ScoreTrendChart({ data, color = '#10b981', height = 180 }: ScoreTrendChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <LineResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0 0 / 15%)" />
          <XAxis
            dataKey="label"
            tick={{ fill: 'oklch(0.6 0 0)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'oklch(0.6 0 0)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <LineTooltip
            contentStyle={{
              background: 'oklch(0.18 0.01 260)',
              border: '1px solid oklch(1 0 0 / 10%)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v: number) => [`${v}/100`, 'Score']}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke={color}
            strokeWidth={2.5}
            dot={{ fill: color, r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: color }}
          />
        </LineChart>
      </LineResponsiveContainer>
    </div>
  );
}
