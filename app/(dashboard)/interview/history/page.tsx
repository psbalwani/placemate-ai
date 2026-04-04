import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUserInterviews } from '@/lib/db/queries';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InterviewHistoryClient } from '@/components/interview/interview-history-client';
import { History, TrendingUp } from 'lucide-react';

export const metadata = { title: 'Interview History' };

export default async function InterviewHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const intervs = await getUserInterviews(session.user.id);
  const completed = intervs.filter((i) => i.status === 'completed');

  const trendData = completed
    .slice()
    .reverse()
    .slice(-10)
    .map((i, idx) => ({
      label: `#${idx + 1}`,
      score: (i.overall_score as number) ?? 0,
    }));

  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((a, b) => a + ((b.overall_score as number) ?? 0), 0) / completed.length)
    : 0;

  const best = completed.reduce<number>((acc, i) => Math.max(acc, (i.overall_score as number) ?? 0), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Interview History
          </h1>
          <p className="mt-1 text-muted-foreground">Track your progress and improvement over time</p>
        </div>
        <a
          href="/interview"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          New Interview
        </a>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-foreground">{completed.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-emerald-500">{avgScore}</p>
            <p className="text-xs text-muted-foreground mt-1">Avg Score / 100</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-black text-amber-500">{best}</p>
            <p className="text-xs text-muted-foreground mt-1">Best Score</p>
          </CardContent>
        </Card>
      </div>

      {completed.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <History className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-foreground font-semibold">No interviews yet</p>
            <p className="text-sm text-muted-foreground mt-1">Complete your first mock interview to see history here</p>
            <a
              href="/interview"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start Interview
            </a>
          </CardContent>
        </Card>
      ) : (
        <InterviewHistoryClient
          interviews={completed.map((i) => ({
            id: i.id as string,
            target_role: (i.target_role as string) ?? 'Unknown Role',
            overall_score: (i.overall_score as number) ?? 0,
            summary: (i.summary as string) ?? '',
            completed_at: (i.completed_at as string) ?? (i.created_at as string),
            question_count: Array.isArray(i.question_scores_json) ? i.question_scores_json.length : 0,
          }))}
          trendData={trendData}
        />
      )}
    </div>
  );
}
