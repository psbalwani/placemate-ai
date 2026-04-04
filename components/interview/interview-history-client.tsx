'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreTrendChart } from '@/components/charts/interview-charts';
import { TrendingUp, Calendar, MessageSquare } from 'lucide-react';

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  } catch { return iso; }
}

interface InterviewSummary {
  id: string;
  target_role: string;
  overall_score: number;
  summary: string;
  completed_at: string;
  question_count: number;
}

interface Props {
  interviews: InterviewSummary[];
  trendData: { label: string; score: number }[];
}



function scoreColor(s: number) {
  if (s >= 75) return 'text-emerald-500';
  if (s >= 55) return 'text-amber-500';
  return 'text-red-500';
}

function scoreLabel(s: number) {
  if (s >= 75) return 'Excellent';
  if (s >= 55) return 'Good';
  if (s >= 35) return 'Fair';
  return 'Needs Work';
}

export function InterviewHistoryClient({ interviews, trendData }: Props) {
  return (
    <div className="space-y-6">
      {/* Trend chart */}
      {trendData.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Score Progression
            </h3>
          </CardHeader>
          <CardContent>
            <ScoreTrendChart data={trendData} height={200} />
          </CardContent>
        </Card>
      )}

      {/* Interview list */}
      <div className="space-y-3">
        {interviews.map((iv) => (
          <Card key={iv.id} className="hover:border-border/80 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Score circle */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-muted">
                  <span className={`text-xl font-black ${scoreColor(iv.overall_score)}`}>
                    {iv.overall_score}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{iv.target_role}</span>
                    <Badge
                      variant={iv.overall_score >= 75 ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {scoreLabel(iv.overall_score)}
                    </Badge>
                  </div>
                  {iv.summary && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{iv.summary}</p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatRelative(iv.completed_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {iv.question_count} questions
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="hidden sm:flex w-24 flex-col gap-1 shrink-0">
                  <div className="text-xs text-muted-foreground text-right">{iv.overall_score}/100</div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${iv.overall_score >= 75 ? 'bg-emerald-500' : iv.overall_score >= 55 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${iv.overall_score}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
