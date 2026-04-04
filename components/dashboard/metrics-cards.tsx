import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Map, FileText, MessageSquare, TrendingUp } from 'lucide-react';

interface MetricsCardsProps {
  roadmapProgress: number;  // 0-100
  atsScore: number;          // 0-100
  interviewScore: number;    // 0-100
  streakDays: number;
}

const METRICS = [
  {
    key: 'roadmap',
    label: 'Roadmap Progress',
    icon: Map,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    description: 'Weekly tasks completed',
  },
  {
    key: 'ats',
    label: 'ATS Score',
    icon: FileText,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    description: 'Resume strength',
  },
  {
    key: 'interview',
    label: 'Interview Score',
    icon: MessageSquare,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    description: 'Latest mock score',
  },
  {
    key: 'streak',
    label: 'Day Streak',
    icon: TrendingUp,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    description: 'Consecutive active days',
  },
];

export function MetricsCards({
  roadmapProgress,
  atsScore,
  interviewScore,
  streakDays,
}: MetricsCardsProps) {
  const values = { roadmap: roadmapProgress, ats: atsScore, interview: interviewScore, streak: streakDays };

  return (
    <div className="stagger-children grid grid-cols-2 gap-4 lg:grid-cols-4">
      {METRICS.map(({ key, label, icon: Icon, color, bg, description }) => {
        const val = values[key as keyof typeof values];
        const isStreak = key === 'streak';

        return (
          <Card key={key} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className={`text-2xl font-bold tabular-nums ${color}`}>{val}</span>
                    {!isStreak && <span className="text-xs text-muted-foreground">/ 100</span>}
                    {isStreak && <span className="text-xs text-muted-foreground">days</span>}
                  </div>
                </div>
                <div className={`rounded-xl p-2.5 ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
              {!isStreak && (
                <Progress value={val} className="mt-3 h-1.5" />
              )}
              <p className="mt-2 text-xs text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
