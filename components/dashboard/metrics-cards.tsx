import { Card, CardContent } from '@/components/ui/card';
import { Map, FileText, MessageSquare, Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricsCardsProps {
  roadmapProgress: number;  // 0-100
  atsScore: number;          // 0-100
  interviewScore: number;    // 0-100
  streakDays: number;
}

function DeltaBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-500/15 px-2 py-0.5 text-[11px] font-medium text-slate-400">
      <Minus className="h-2.5 w-2.5" /> No data
    </span>
  );
  const positive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold
      ${positive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
      {positive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {Math.abs(value)}{suffix}
    </span>
  );
}

const METRICS = [
  {
    key: 'roadmap' as const,
    label: 'Roadmap Progress',
    sublabel: 'Weekly completion',
    icon: Map,
    gradient: 'from-blue-500/20 to-blue-600/5',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/15 ring-1 ring-blue-500/20',
    suffix: '%',
    delta: 0,
  },
  {
    key: 'ats' as const,
    label: 'ATS Score',
    sublabel: 'Resume strength',
    icon: FileText,
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15 ring-1 ring-emerald-500/20',
    suffix: '/100',
    delta: 0,
  },
  {
    key: 'interview' as const,
    label: 'Interview Score',
    sublabel: 'Latest mock score',
    icon: MessageSquare,
    gradient: 'from-violet-500/20 to-violet-600/5',
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/15 ring-1 ring-violet-500/20',
    suffix: '/100',
    delta: 0,
  },
  {
    key: 'streak' as const,
    label: 'Day Streak',
    sublabel: 'Consecutive active days',
    icon: Flame,
    gradient: 'from-amber-500/20 to-amber-600/5',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/15 ring-1 ring-amber-500/20',
    suffix: ' days',
    delta: 0,
  },
];

export function MetricsCards({ roadmapProgress, atsScore, interviewScore, streakDays }: MetricsCardsProps) {
  const values = {
    roadmap: roadmapProgress,
    ats: atsScore,
    interview: interviewScore,
    streak: streakDays,
  };

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {METRICS.map(({ key, label, sublabel, icon: Icon, gradient, iconColor, iconBg, suffix }) => {
        const val = values[key];

        return (
          <Card key={key} className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:border-border hover:shadow-lg hover:shadow-black/20">
            {/* Gradient tint */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60 pointer-events-none`} />

            <CardContent className="relative p-5">
              {/* Icon row */}
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <DeltaBadge value={val} suffix="" />
              </div>

              {/* Number */}
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tabular-nums text-foreground tracking-tight">{val}</span>
                  <span className="text-sm text-muted-foreground">{suffix}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-foreground/80">{label}</p>
                <p className="text-xs text-muted-foreground">{sublabel}</p>
              </div>

              {/* Progress bar for scores */}
              {key !== 'streak' && (
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted/50">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${iconColor.replace('text-', 'bg-')}`}
                    style={{ width: `${Math.min(val, 100)}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
